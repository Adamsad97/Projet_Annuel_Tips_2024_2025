import request from 'supertest';
import app from '../../app';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { prisma } from '../../db/prisma';

describe('Tips Integration', () => {
  const baseAuth = ROUTES.api + ROUTES.users.base;
  const baseTips = ROUTES.api + ROUTES.tips.base;

  beforeAll(async () => {
    await seedBadges();
    await prisma.category.upsert({
      where: { name: 'Cuisine' },
      update: {},
      create: { name: 'Cuisine' },
    });
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

  it('POST /tips should store location, images and categories', async () => {
    const { token } = await createAndLoginUser('locator');

    const res = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Located Tip',
        content: 'Some content with a location',
        categories: ['cuisine'],
        address: 'Paris, France',
        latitude: 48.8566,
        longitude: 2.3522,
        images: ['/uploads/tips/abc-123.jpg'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.address).toBe('Paris, France');
    expect(res.body.data.latitude).toBe(48.8566);
    expect(res.body.data.longitude).toBe(2.3522);
    expect(res.body.data.images).toEqual(['/uploads/tips/abc-123.jpg']);
    expect(res.body.data.categories[0].category.name).toBe('Cuisine');
  });

  it('POST /tips should reject unknown categories', async () => {
    const { token } = await createAndLoginUser('unknowncat');

    const res = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad category', content: 'Some content here', categories: ['Nope'] });

    expect(res.status).toBe(400);
  });

  it('POST /tips should reject latitude without longitude and external image urls', async () => {
    const { token } = await createAndLoginUser('invalidloc');

    const res = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid tip',
        content: 'Some content here',
        latitude: 10,
        images: ['https://evil.example.com/x.jpg'],
      });

    expect(res.status).toBe(400);
  });

  it('GET /tips should filter by category and location', async () => {
    const { token } = await createAndLoginUser('filterer');

    const create = (body: Record<string, unknown>) =>
      request(app)
        .post(baseTips + ROUTES.tips.create)
        .set('Authorization', `Bearer ${token}`)
        .send(body);

    const located = await create({
      title: 'Located cuisine tip',
      content: 'Content of the located tip',
      categories: ['Cuisine'],
      latitude: 45.764,
      longitude: 4.8357,
    });
    await create({ title: 'Plain tip here', content: 'Content of the plain tip' });
    await prisma.tip.updateMany({ data: { status: 'APPROVED' } });

    const byCategory = await request(app).get(`${baseTips}?category=cuisine`);
    expect(byCategory.status).toBe(200);
    expect(byCategory.body.data).toHaveLength(1);
    expect(byCategory.body.data[0].id).toBe(located.body.data.id);

    const byLocation = await request(app).get(`${baseTips}?located=true`);
    expect(byLocation.body.data).toHaveLength(1);
    expect(byLocation.body.data[0].id).toBe(located.body.data.id);

    const all = await request(app).get(baseTips);
    expect(all.body.data).toHaveLength(2);
  });

  it('PATCH /tips/:id should replace categories', async () => {
    const { token } = await createAndLoginUser('catupdater');

    const createRes = await request(app)
      .post(baseTips + ROUTES.tips.create)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tip with category', content: 'Content here', categories: ['Cuisine'] });

    const res = await request(app)
      .patch(`${baseTips}/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categories: [] });

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toHaveLength(0);
  });

  it('GET /tips/tags/all should list categories from the database', async () => {
    const res = await request(app).get(`${baseTips}/tags/all`);

    expect(res.status).toBe(200);
    expect(res.body.data).toContain('Cuisine');
  });
});
