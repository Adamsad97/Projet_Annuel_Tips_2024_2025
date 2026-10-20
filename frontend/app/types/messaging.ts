export interface ChatUser {
  id: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
  avatarProfile: string | null;
}

// Raison pour laquelle on ne peut pas écrire (null = envoi autorisé)
export type SendRestriction = 'you_blocked' | 'blocked' | 'waiting_reply' | null;

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
  editedAt: string | null;
  isMine: boolean;
  isRead: boolean;
  canEdit: boolean;
}

export interface ConversationSummary {
  id: number;
  otherUser: ChatUser | null;
  lastMessage: { id: number; content: string; userId: number; createdAt: string } | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationDetail {
  id: number;
  otherUser: ChatUser;
  restriction: SendRestriction;
  messages: ChatMessage[];
}

export interface ConversationWith {
  conversationId: number | null;
  otherUser: ChatUser;
  restriction: SendRestriction;
}

export interface AppNotification {
  id: number;
  type: 'NEW_MESSAGE' | 'BADGE_UNLOCKED' | 'MODERATION' | 'NEW_TIP' | 'CHALLENGE';
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
