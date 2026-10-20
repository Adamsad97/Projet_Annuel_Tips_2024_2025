import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Messaging, blocks and notifications Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;

  const clearAll = async () => {
    await prisma.conversation.deleteMany();
    await prisma.notification.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(async () => {
    await seedBadges();
    await clearAll();
  });

  afterEach(clearAll);

  afterAll(async () => {
    await disconnectPrisma();
  });

  const createAndLoginUser = async (name: string) => {
    const payload = {
      email: `${name}@test.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      username: name,
      firstname: name,
    };
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send(payload);
    const loginRes = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: payload.email, password: payload.password });

    const token = loginRes.body.data.accessToken as string;
    const id = loginRes.body.data.user.id as number;
    const auth = { Authorization: `Bearer ${token}` };

    return {
      id,
      send: (recipientId: number, content: string) =>
        request(app).post(`${api}/messages`).set(auth).send({ recipientId, content }),
      open: (conversationId: number) =>
        request(app).get(`${api}/conversations/${conversationId}`).set(auth),
      edit: (messageId: number, content: string) =>
        request(app).patch(`${api}/messages/${messageId}`).set(auth).send({ content }),
      conversations: () => request(app).get(`${api}/conversations`).set(auth),
      conversationWith: (userId: number) =>
        request(app).get(`${api}/conversations/with/${userId}`).set(auth),
      block: (userId: number) => request(app).post(`${api}/users/${userId}/block`).set(auth),
      unblock: (userId: number) => request(app).delete(`${api}/users/${userId}/block`).set(auth),
      blocks: () => request(app).get(`${api}/blocks`).set(auth),
      notifications: () => request(app).get(`${api}/notifications`).set(auth),
      readAllNotifications: () => request(app).post(`${api}/notifications/read-all`).set(auth),
      createTip: () =>
        request(app)
          .post(api + ROUTES.tips.base)
          .set(auth)
          .send({ title: 'My first tip', content: 'Content of my first tip' }),
    };
  };

  describe('Messages', () => {
    it('should allow only one message until the recipient replies', async () => {
      const alice = await createAndLoginUser('alice');
      const bob = await createAndLoginUser('bob');

      const first = await alice.send(bob.id, 'Salut Bob !');
      expect(first.status).toBe(201);
      const conversationId = first.body.data.conversationId;

      const second = await alice.send(bob.id, 'Tu es là ?');
      expect(second.status).toBe(403);

      const status = await alice.conversationWith(bob.id);
      expect(status.body.data).toMatchObject({ conversationId, restriction: 'waiting_reply' });

      const reply = await bob.send(alice.id, 'Salut Alice');
      expect(reply.status).toBe(201);
      expect(reply.body.data.conversationId).toBe(conversationId);

      const third = await alice.send(bob.id, 'Super, merci !');
      expect(third.status).toBe(201);

      const conversation = await bob.open(conversationId);
      expect(conversation.status).toBe(200);
      expect(conversation.body.data.messages).toHaveLength(3);
      expect(conversation.body.data.otherUser.username).toBe('alice');
      expect(conversation.body.data.otherUser).not.toHaveProperty('email');
    });

    it('should allow editing a message only until the recipient reads it', async () => {
      const alice = await createAndLoginUser('alice');
      const bob = await createAndLoginUser('bob');

      const sent = await alice.send(bob.id, 'Messsage avec faute');
      const { conversationId, message } = sent.body.data;
      expect(message.canEdit).toBe(true);
      expect(message.isRead).toBe(false);

      const edited = await alice.edit(message.id, 'Message corrigé');
      expect(edited.status).toBe(200);
      expect(edited.body.data.content).toBe('Message corrigé');
      expect(edited.body.data.editedAt).not.toBeNull();

      const byOther = await bob.edit(message.id, 'Pirate');
      expect(byOther.status).toBe(403);

      await bob.open(conversationId);

      const afterRead = await alice.edit(message.id, 'Trop tard');
      expect(afterRead.status).toBe(403);

      const aliceView = await alice.open(conversationId);
      expect(aliceView.body.data.messages[0]).toMatchObject({
        content: 'Message corrigé',
        isRead: true,
        canEdit: false,
      });
    });

    it('should list conversations with unread counts', async () => {
      const alice = await createAndLoginUser('alice');
      const bob = await createAndLoginUser('bob');

      const sent = await alice.send(bob.id, 'Hello');

      const bobList = await bob.conversations();
      expect(bobList.status).toBe(200);
      expect(bobList.body.data).toHaveLength(1);
      expect(bobList.body.data[0]).toMatchObject({
        id: sent.body.data.conversationId,
        unreadCount: 1,
        otherUser: { id: alice.id },
        lastMessage: { content: 'Hello' },
      });

      await bob.open(sent.body.data.conversationId);
      const afterOpen = await bob.conversations();
      expect(afterOpen.body.data[0].unreadCount).toBe(0);

      const aliceList = await alice.conversations();
      expect(aliceList.body.data[0].unreadCount).toBe(0);
    });

    it('should refuse messages to self, unknown users and foreign conversations', async () => {
      const alice = await createAndLoginUser('alice');
      const bob = await createAndLoginUser('bob');
      const eve = await createAndLoginUser('eve');

      expect((await alice.send(alice.id, 'Moi')).status).toBe(400);
      expect((await alice.send(999999, 'Personne')).status).toBe(404);
      expect((await alice.send(bob.id, '')).status).toBe(400);

      const sent = await alice.send(bob.id, 'Privé');
      const spy = await eve.open(sent.body.data.conversationId);
      expect(spy.status).toBe(404);
    });
  });

  describe('Blocks', () => {
    it('should prevent messages in both directions while blocked', async () => {
      const alice = await createAndLoginUser('alice');
      const troll = await createAndLoginUser('troll');

      expect((await alice.block(troll.id)).status).toBe(200);

      const fromTroll = await troll.send(alice.id, 'Spam');
      expect(fromTroll.status).toBe(403);
      expect((await troll.conversationWith(alice.id)).body.data.restriction).toBe('blocked');

      const fromAlice = await alice.send(troll.id, 'Message');
      expect(fromAlice.status).toBe(403);
      expect((await alice.conversationWith(troll.id)).body.data.restriction).toBe('you_blocked');

      const blocks = await alice.blocks();
      expect(blocks.body.data).toHaveLength(1);
      expect(blocks.body.data[0]).toMatchObject({ id: troll.id, username: 'troll' });

      expect((await alice.unblock(troll.id)).status).toBe(200);
      expect((await troll.send(alice.id, 'Désolé')).status).toBe(201);
    });

    it('should refuse blocking yourself', async () => {
      const alice = await createAndLoginUser('alice');
      expect((await alice.block(alice.id)).status).toBe(400);
    });
  });

  describe('Notifications', () => {
    it('should notify a new message once per unread conversation and mark it read on open', async () => {
      const alice = await createAndLoginUser('alice');
      const bob = await createAndLoginUser('bob');

      const sent = await alice.send(bob.id, 'Coucou');
      await bob.send(alice.id, 'Re');
      await alice.send(bob.id, 'Encore moi');

      const notifications = await bob.notifications();
      expect(notifications.status).toBe(200);
      const messageNotifications = notifications.body.data.items.filter(
        (n: { type: string }) => n.type === 'NEW_MESSAGE',
      );
      expect(messageNotifications).toHaveLength(1);
      expect(messageNotifications[0]).toMatchObject({
        title: 'Nouveau message de alice',
        link: `/messages?c=${sent.body.data.conversationId}`,
        readAt: null,
      });
      expect(notifications.body.data.unreadCount).toBe(1);

      await bob.open(sent.body.data.conversationId);
      const afterOpen = await bob.notifications();
      expect(afterOpen.body.data.unreadCount).toBe(0);
    });

    it('should notify when a badge is unlocked and mark all as read', async () => {
      const alice = await createAndLoginUser('alice');

      await alice.createTip();

      const notifications = await alice.notifications();
      const badgeNotification = notifications.body.data.items.find(
        (n: { type: string }) => n.type === 'BADGE_UNLOCKED',
      );
      expect(badgeNotification).toBeDefined();
      expect(notifications.body.data.unreadCount).toBeGreaterThan(0);

      expect((await alice.readAllNotifications()).status).toBe(200);
      expect((await alice.notifications()).body.data.unreadCount).toBe(0);
    });
  });
});
