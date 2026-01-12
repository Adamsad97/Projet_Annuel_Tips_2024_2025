import request from 'supertest';
import app from '../../app';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Tips Integration', () => {
  const baseAuth = ROUTES.api + ROUTES.users.base;
  const baseTips = ROUTES.api + ROUTES.tips.base;

  beforeAll(async () => {
    await seedBadges();
    await clearTips();
    await clearUsers();
  });

  afterEach(async () => {
    await clearTips();
    await clearUsers();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  const createAndLoginUser = async (name = 'testuser') => {
    const userPayload = {
      email: `${name}@test.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      username: name,
      firstname: 'Test',
      lastname: 'User',
    };

    await request(app)
      .post(baseAuth + ROUTES.users.register)
      .send(userPayload);

    const loginRes = await request(app)
      .post(baseAuth + ROUTES.users.login)
      .send({ email: userPayload.email, password: userPayload.password });

    return {
      token: loginRes.body.data.accessToken,
      userId: loginRes.body.data.user.id,
    };
  };

  it('GET /tips should return empty list initially', async () => {
    const res = await request(app).get(baseTips + ROUTES.tips.list);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('POST /tips should create a tip', async () => {
    const { token } = await createAndLoginUser('poster');

    const tipPayload = {
      title: 'My First Tip',
      content: 'This is some content for the tip.',
    };

    const res = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send(tipPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(tipPayload.title);
    expect(res.body.data.content).toBe(tipPayload.content);
    expect(res.body.data.id).toBeDefined();
  });

  it('GET /tips/:id should return tip detail', async () => {
    const { token } = await createAndLoginUser('viewer');

    const tipPayload = {
      title: 'Detail Tip',
      content: 'Detail content',
    };

    const createRes = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send(tipPayload);

    const tipId = createRes.body.data.id;

    const res = await request(app).get(`${baseTips}/${tipId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(tipPayload.title);
    expect(res.body.data.id).toBe(tipId);
  });

  it('PATCH /tips/:id should update tip provided owner', async () => {
    const { token } = await createAndLoginUser('updater');

    const createRes = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old Title', content: 'Old Content' });

    const tipId = createRes.body.data.id;

    const updatePayload = { title: 'New Title' };
    const res = await request(app)
      .patch(`${baseTips}/${tipId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(updatePayload.title);
    expect(res.body.data.content).toBe('Old Content');
  });

  it('DELETE /tips/:id should delete tip', async () => {
    const { token } = await createAndLoginUser('deleter');

    const createRes = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete', content: 'Bye content' });

    const tipId = createRes.body.data.id;

    const res = await request(app)
      .delete(`${baseTips}/${tipId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(`${baseTips}/${tipId}`);
    expect(getRes.status).toBe(404);
  });
});
