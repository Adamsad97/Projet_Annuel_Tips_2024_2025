import type { Message } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { assertCanParticipate } from '../../utils/accountStatus.util';
import { AppError } from '../../utils/appError.util';
import { socketService } from '../../websocket/socket.service';
import { notificationService } from '../notifications/notification.service';
import type { EditMessageInput, SendMessageInput } from './messaging.validation';

const publicUserSelect = {
  id: true,
  username: true,
  firstname: true,
  lastname: true,
  avatarProfile: true,
} as const;

// Raison pour laquelle l'utilisateur ne peut pas écrire (null = envoi autorisé)
export type SendRestriction = 'you_blocked' | 'blocked' | 'waiting_reply' | null;

const conversationLink = (conversationId: number) => `/messages?c=${conversationId}`;

const displayName = (user: {
  username: string;
  firstname: string | null;
  lastname: string | null;
}) => [user.firstname, user.lastname].filter(Boolean).join(' ') || user.username;

export class MessagingService {
  async listConversations(userId: number) {
    const conversations = await prisma.conversation.findMany({
      where: { isGroup: false, participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: publicUserSelect } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return Promise.all(
      conversations.map(async (conversation) => {
        const me = conversation.participants.find((p) => p.userId === userId)!;
        const other = conversation.participants.find((p) => p.userId !== userId);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            userId: { not: userId },
            ...(me.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}),
          },
        });

        return {
          id: conversation.id,
          otherUser: other?.user ?? null,
          lastMessage: conversation.messages[0] ?? null,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
        };
      }),
    );
  }

  // Ouvre une conversation : renvoie les messages et les marque comme lus
  async getConversation(conversationId: number, userId: number) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: { select: publicUserSelect } } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    const me = conversation?.participants.find((p) => p.userId === userId);
    if (!conversation || !me) {
      throw new AppError('conversation not found', 404);
    }

    const other = conversation.participants.find((p) => p.userId !== userId)!;
    const readAt = new Date();

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: readAt },
    });
    await notificationService.markReadByLink(userId, conversationLink(conversationId));
    // Prévient l'autre participant : ses messages ne sont plus modifiables
    socketService.emitToUser(other.userId, 'conversation:read', { conversationId, readAt });

    return {
      id: conversation.id,
      otherUser: other.user,
      restriction: await this.getSendRestriction(userId, other.userId, conversation.id),
      messages: conversation.messages.map((message) =>
        this.toMessageView(message, userId, other.lastReadAt),
      ),
    };
  }

  // Permet d'ouvrir le fil avec un membre depuis son profil, même sans conversation existante
  async getConversationWith(userId: number, otherUserId: number) {
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: publicUserSelect,
    });

    if (!otherUser || otherUserId === userId) {
      throw new AppError('user not found', 404);
    }

    const conversation = await this.findDirectConversation(userId, otherUserId);

    return {
      conversationId: conversation?.id ?? null,
      otherUser,
      restriction: await this.getSendRestriction(userId, otherUserId, conversation?.id),
    };
  }

  async sendMessage(senderId: number, { recipientId, content }: SendMessageInput) {
    if (recipientId === senderId) {
      throw new AppError('you cannot send a message to yourself', 400);
    }

    await assertCanParticipate(senderId);

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      throw new AppError('recipient not found', 404);
    }

    const existing = await this.findDirectConversation(senderId, recipientId);
    const restriction = await this.getSendRestriction(senderId, recipientId, existing?.id);

    if (restriction === 'you_blocked') {
      throw new AppError('unblock this user to send them a message', 403);
    }
    if (restriction === 'blocked') {
      throw new AppError('you cannot send a message to this user', 403);
    }
    if (restriction === 'waiting_reply') {
      throw new AppError('wait for a reply before sending another message', 403);
    }

    const now = new Date();
    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          participants: { create: [{ userId: senderId }, { userId: recipientId }] },
        },
      }));

    const message = await prisma.message.create({
      data: { content, conversationId: conversation.id, userId: senderId, createdAt: now },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: now },
    });
    // L'expéditeur a forcément lu la conversation jusqu'à son propre message
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: conversation.id, userId: senderId } },
      data: { lastReadAt: now },
    });

    const sender = await prisma.user.findUniqueOrThrow({
      where: { id: senderId },
      select: publicUserSelect,
    });

    socketService.emitToUser(recipientId, 'message:new', {
      conversationId: conversation.id,
      message: this.toMessageView(message, recipientId, null),
      sender,
    });
    await this.notifyNewMessage(recipientId, conversation.id, sender, content);

    return {
      conversationId: conversation.id,
      message: this.toMessageView(message, senderId, null),
    };
  }

  async editMessage(messageId: number, userId: number, { content }: EditMessageInput) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } },
    });

    if (!message) {
      throw new AppError('message not found', 404);
    }
    if (message.userId !== userId) {
      throw new AppError('unauthorized to edit this message', 403);
    }

    const recipient = message.conversation.participants.find((p) => p.userId !== userId);
    if (this.isReadBy(message, recipient?.lastReadAt ?? null)) {
      throw new AppError('this message has already been read and can no longer be edited', 403);
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
    });

    if (recipient) {
      socketService.emitToUser(recipient.userId, 'message:updated', {
        conversationId: message.conversationId,
        message: this.toMessageView(updated, recipient.userId, null),
      });
    }

    return this.toMessageView(updated, userId, null);
  }

  async listBlockedUsers(userId: number) {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((block) => ({ ...block.blocked, blockedAt: block.createdAt }));
  }

  async blockUser(userId: number, blockedId: number): Promise<void> {
    if (userId === blockedId) {
      throw new AppError('you cannot block yourself', 400);
    }

    const target = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!target) {
      throw new AppError('user not found', 404);
    }

    await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
      update: {},
      create: { blockerId: userId, blockedId },
    });
  }

  async unblockUser(userId: number, blockedId: number): Promise<void> {
    await prisma.userBlock.deleteMany({ where: { blockerId: userId, blockedId } });
  }

  private async findDirectConversation(userId: number, otherUserId: number) {
    return prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    });
  }

  private async getSendRestriction(
    senderId: number,
    recipientId: number,
    conversationId?: number,
  ): Promise<SendRestriction> {
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: senderId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: senderId },
        ],
      },
    });

    if (blocks.some((block) => block.blockerId === senderId)) return 'you_blocked';
    if (blocks.length > 0) return 'blocked';
    if (!conversationId) return null;

    // Un seul message tant que le destinataire n'a jamais répondu
    const [sentCount, receivedCount] = await Promise.all([
      prisma.message.count({ where: { conversationId, userId: senderId } }),
      prisma.message.count({ where: { conversationId, userId: recipientId } }),
    ]);

    return sentCount > 0 && receivedCount === 0 ? 'waiting_reply' : null;
  }

  // Une seule notification non lue par conversation pour ne pas spammer le destinataire
  private async notifyNewMessage(
    recipientId: number,
    conversationId: number,
    sender: { username: string; firstname: string | null; lastname: string | null },
    content: string,
  ) {
    const link = conversationLink(conversationId);
    const alreadyNotified = await prisma.notification.findFirst({
      where: { userId: recipientId, link, readAt: null },
    });

    if (!alreadyNotified) {
      await notificationService.notify(recipientId, {
        type: 'NEW_MESSAGE',
        title: `Nouveau message de ${displayName(sender)}`,
        body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
        link,
      });
    }
  }

  private isReadBy(message: Message, lastReadAt: Date | null): boolean {
    return !!lastReadAt && lastReadAt >= message.createdAt;
  }

  // isRead / canEdit n'ont de sens que pour les messages envoyés par l'utilisateur courant
  private toMessageView(message: Message, viewerId: number, otherLastReadAt: Date | null) {
    const isMine = message.userId === viewerId;
    const isRead = this.isReadBy(message, otherLastReadAt);

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.userId,
      content: message.content,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      isMine,
      isRead: isMine ? isRead : true,
      canEdit: isMine && !isRead,
    };
  }
}

export const messagingService = new MessagingService();
