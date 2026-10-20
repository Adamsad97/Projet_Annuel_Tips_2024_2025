import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Chatbot Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;

  const clearAll = async () => {
    await prisma.chatbotQuery.deleteMany();
    await prisma.chatbotResponse.deleteMany();
    await prisma.chatbotConfig.deleteMany();
    await prisma.admin.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(clearAll);
  afterEach(clearAll);
  afterAll(async () => {
    await disconnectPrisma();
  });

  const createUser = async (name: string, admin = false) => {
    const email = `${name}@test.com`;
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ email, password: 'Password123!', username: name });
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    if (admin) await prisma.admin.create({ data: { userId: user.id } });
    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: 'Password123!' });
    const auth = { Authorization: `Bearer ${login.body.data.accessToken}` };
    return {
      id: user.id,
      auth,
      ask: (question: string) =>
        request(app).post(`${api}/chatbot/ask`).set(auth).send({ question }),
    };
  };

  const createTip = (userId: number, title: string, content: string, status = 'APPROVED') =>
    prisma.tip.create({
      data: { title, content, userId, status: status as 'APPROVED' | 'PENDING' },
    });

  it('should require authentication and a real question', async () => {
    const res = await request(app).post(`${api}/chatbot/ask`).send({ question: 'Bonjour' });
    expect(res.status).toBe(401);

    const user = await createUser('asker');
    expect((await user.ask('ok')).status).toBe(400);
  });

  it('should find the most relevant published tips, ignoring accents and plurals', async () => {
    const author = await createUser('author');
    const user = await createUser('asker');
    const wine = await createTip(
      author.id,
      'Détacher une tâche de vin rouge',
      'Versez du vinaigre blanc sur la tache de vin puis rincez à l’eau froide.',
    );
    await createTip(
      author.id,
      'Réparer une crevaison de vélo',
      'Démontez le pneu et la chambre à air.',
    );
    await createTip(author.id, 'Tache de vin : astuce secrète', 'Contenu en attente', 'PENDING');

    const res = await user.ask('Comment enlever des taches de vin sur mes chemises ?');

    expect(res.status).toBe(200);
    expect(res.body.data.tips).toHaveLength(1);
    expect(res.body.data.tips[0]).toMatchObject({ id: wine.id, title: wine.title });
    expect(res.body.data.tips[0].snippet).toContain('vin');
    expect(res.body.data.suggestAskingCommunity).toBe(false);
  });

  it('should answer with a canned response when its keywords match', async () => {
    const user = await createUser('asker');
    await prisma.chatbotResponse.create({
      data: {
        keywords: ['mot de passe'],
        answer: 'Rendez-vous dans Paramètres > Sécurité.',
        link: '/settings',
      },
    });

    const res = await user.ask("J'ai oublié mon mot de passe, que faire ?");

    expect(res.body.data).toMatchObject({
      answer: 'Rendez-vous dans Paramètres > Sécurité.',
      link: '/settings',
      suggestAskingCommunity: false,
    });
  });

  it('should suggest asking the community and log unanswered questions', async () => {
    const admin = await createUser('boss', true);
    const user = await createUser('asker');

    const res = await user.ask('Comment dresser un dragon de Komodo ?');

    expect(res.body.data.tips).toHaveLength(0);
    expect(res.body.data.suggestAskingCommunity).toBe(true);
    expect(res.body.data.answer).toContain('communauté');

    const queries = await request(app)
      .get(`${api}/admin/chatbot/queries?unanswered=true`)
      .set(admin.auth);
    expect(queries.status).toBe(200);
    expect(queries.body.data[0]).toMatchObject({
      question: 'Comment dresser un dragon de Komodo ?',
      tipsFound: 0,
      user: { id: user.id },
    });
  });

  it('should let the admin configure the chatbot and manage canned responses', async () => {
    const admin = await createUser('boss', true);
    const user = await createUser('asker');

    const config = await request(app)
      .patch(`${api}/admin/chatbot/config`)
      .set(admin.auth)
      .send({ greeting: 'Salut, que puis-je faire pour vous ?', contextNote: 'Soyez précis.' });
    expect(config.status).toBe(200);

    const greeting = await request(app).get(`${api}/chatbot/config`).set(user.auth);
    expect(greeting.body.data.greeting).toBe('Salut, que puis-je faire pour vous ?');

    const created = await request(app)
      .post(`${api}/admin/chatbot/responses`)
      .set(admin.auth)
      .send({ keywords: ['carte'], answer: 'La carte affiche les tips localisés.', link: '/map' });
    expect(created.status).toBe(201);

    const answer = await user.ask('Où trouver la carte ?');
    expect(answer.body.data).toMatchObject({ link: '/map', context: 'Soyez précis.' });

    await request(app)
      .patch(`${api}/admin/chatbot/responses/${created.body.data.id}`)
      .set(admin.auth)
      .send({ isActive: false });
    expect((await user.ask('Où trouver la carte ?')).body.data.link).toBeNull();

    const badLink = await request(app)
      .post(`${api}/admin/chatbot/responses`)
      .set(admin.auth)
      .send({ keywords: ['pub'], answer: 'Allez voir ailleurs', link: 'https://evil.com' });
    expect(badLink.status).toBe(400);

    expect(
      (
        await request(app)
          .delete(`${api}/admin/chatbot/responses/${created.body.data.id}`)
          .set(admin.auth)
      ).status,
    ).toBe(200);
    expect((await request(app).get(`${api}/admin/chatbot/responses`).set(user.auth)).status).toBe(
      403,
    );
  });
});
