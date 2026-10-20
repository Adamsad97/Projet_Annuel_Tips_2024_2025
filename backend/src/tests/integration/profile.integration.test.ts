import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { UPLOADS_DIR } from '../../utils/imageUpload.util';

// PNG 1x1 transparent
const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const uploadedFileExists = (uploadPath: string) =>
  fs.existsSync(path.join(UPLOADS_DIR, uploadPath.replace('/uploads/', '')));

describe('Profile Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;
  const PASSWORD = 'Password123!';

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

  const createAndLoginUser = async (name: string) => {
    const payload = {
      email: `${name}@test.com`,
      password: PASSWORD,
      confirmPassword: PASSWORD,
      username: name,
      firstname: 'Test',
      lastname: 'User',
    };
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send(payload);
    const loginRes = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: payload.email, password: PASSWORD });

    return {
      token: loginRes.body.data.accessToken as string,
      userId: loginRes.body.data.user.id as number,
      email: payload.email,
    };
  };

  it('should never expose the trust index to the user', async () => {
    const { token } = await createAndLoginUser('trusty');

    const res = await request(app)
      .get(baseUsers + ROUTES.users.profile)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('trustIndex');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('PATCH /users/profile should update and clear profile fields', async () => {
    const { token } = await createAndLoginUser('editor');

    const res = await request(app)
      .patch(baseUsers + ROUTES.users.profile)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstname: '  Jane ', lastname: 'Doe', bio: 'Bricoleuse', address: 'Lyon' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      firstname: 'Jane',
      lastname: 'Doe',
      bio: 'Bricoleuse',
      address: 'Lyon',
    });
    expect(res.body.data).not.toHaveProperty('trustIndex');

    const cleared = await request(app)
      .patch(baseUsers + ROUTES.users.profile)
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: '' });
    expect(cleared.body.data.bio).toBeNull();
    expect(cleared.body.data.firstname).toBe('Jane');

    const tooLong = await request(app)
      .patch(baseUsers + ROUTES.users.profile)
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'x'.repeat(501) });
    expect(tooLong.status).toBe(400);
  });

  it('PATCH /users/profile/password should change the password', async () => {
    const { token, email } = await createAndLoginUser('changer');
    const newPassword = 'NewPassword456!';

    const wrong = await request(app)
      .patch(baseUsers + ROUTES.users.password)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword1!', newPassword });
    expect(wrong.status).toBe(400);

    const weak = await request(app)
      .patch(baseUsers + ROUTES.users.password)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword: 'weak' });
    expect(weak.status).toBe(400);

    const ok = await request(app)
      .patch(baseUsers + ROUTES.users.password)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword });
    expect(ok.status).toBe(200);

    const oldLogin = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: newPassword });
    expect(newLogin.status).toBe(200);
  });

  it('POST/DELETE /users/profile/avatar should replace and remove the avatar file', async () => {
    const { token } = await createAndLoginUser('avatarist');

    const upload = () =>
      request(app)
        .post(baseUsers + ROUTES.users.avatar)
        .set('Authorization', `Bearer ${token}`)
        .attach('avatar', PNG_PIXEL, { filename: 'me.png', contentType: 'image/png' });

    const first = await upload();
    expect(first.status).toBe(200);
    const firstAvatar = first.body.data.avatarProfile as string;
    expect(firstAvatar).toMatch(/^\/uploads\/avatars\/[\w-]+\.png$/);
    expect(uploadedFileExists(firstAvatar)).toBe(true);

    const second = await upload();
    const secondAvatar = second.body.data.avatarProfile as string;
    expect(secondAvatar).not.toBe(firstAvatar);
    expect(uploadedFileExists(firstAvatar)).toBe(false);

    const removed = await request(app)
      .delete(baseUsers + ROUTES.users.avatar)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.avatarProfile).toBeNull();
    expect(uploadedFileExists(secondAvatar)).toBe(false);
  });

  it('GET /users/:id should return a public profile without private data', async () => {
    const author = await createAndLoginUser('publicauthor');
    const viewer = await createAndLoginUser('viewer');

    const tipRes = await request(app)
      .post(api + ROUTES.tips.base)
      .set('Authorization', `Bearer ${author.token}`)
      .send({ title: 'Public tip', content: 'Visible on the public profile' });
    await request(app)
      .post(api + ROUTES.tips.base)
      .set('Authorization', `Bearer ${author.token}`)
      .send({ title: 'Pending tip', content: 'Not visible on the public profile' });
    await prisma.tip.update({ where: { id: tipRes.body.data.id }, data: { status: 'APPROVED' } });
    await request(app)
      .post(`${api}/tips/${tipRes.body.data.id}/votes`)
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ value: 1 });

    const res = await request(app)
      .get(`${baseUsers}/${author.userId}`)
      .set('Authorization', `Bearer ${viewer.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: author.userId,
      username: 'publicauthor',
      role: 'USER',
      stats: { publishedTips: 1, comments: 0, upvotesReceived: 1 },
    });
    expect(res.body.data.recentTips).toHaveLength(1);
    expect(res.body.data.badges.map((b: { code: string }) => b.code)).toContain('FIRST_TIP');
    expect(res.body.data).not.toHaveProperty('email');
    expect(res.body.data).not.toHaveProperty('trustIndex');
    expect(res.body.data).not.toHaveProperty('password');

    const notFound = await request(app)
      .get(`${baseUsers}/999999`)
      .set('Authorization', `Bearer ${viewer.token}`);
    expect(notFound.status).toBe(404);

    const anonymous = await request(app).get(`${baseUsers}/${author.userId}`);
    expect(anonymous.status).toBe(401);
  });

  it('GET /users/leaderboard should not expose emails', async () => {
    await createAndLoginUser('ranked');

    const res = await request(app).get(baseUsers + ROUTES.users.leaderboard);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ rank: 1, username: 'ranked' });
    expect(JSON.stringify(res.body.data)).not.toContain('@test.com');
  });
});
