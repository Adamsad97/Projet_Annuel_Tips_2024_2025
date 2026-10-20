import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../../app';
import { clearUsers, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { UPLOADS_DIR } from '../../modules/uploads/upload.controller';

// PNG 1x1 transparent
const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('Uploads Integration', () => {
  const baseAuth = ROUTES.api + ROUTES.users.base;
  const uploadUrl = ROUTES.api + ROUTES.uploads.base + ROUTES.uploads.tipImages;
  const uploadedFiles: string[] = [];
  let token: string;

  beforeAll(async () => {
    await clearUsers();

    const payload = {
      email: 'uploader@test.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      username: 'uploader',
      firstname: 'Up',
      lastname: 'Loader',
    };
    await request(app)
      .post(baseAuth + ROUTES.users.register)
      .send(payload);
    const loginRes = await request(app)
      .post(baseAuth + ROUTES.users.login)
      .send({ email: payload.email, password: payload.password });
    token = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    for (const file of uploadedFiles) {
      fs.rmSync(path.join(UPLOADS_DIR, file.replace('/uploads/', '')), { force: true });
    }
    await clearUsers();
    await disconnectPrisma();
  });

  it('POST /uploads/tips should require authentication', async () => {
    const res = await request(app)
      .post(uploadUrl)
      .attach('images', PNG_PIXEL, { filename: 'pixel.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
  });

  it('POST /uploads/tips should store images and serve them', async () => {
    const res = await request(app)
      .post(uploadUrl)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_PIXEL, { filename: 'pixel.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatch(/^\/uploads\/tips\/[\w-]+\.png$/);
    uploadedFiles.push(res.body.data[0]);

    const served = await request(app).get(`/api${res.body.data[0]}`);
    expect(served.status).toBe(200);
  });

  it('POST /uploads/tips should reject non image files', async () => {
    const res = await request(app)
      .post(uploadUrl)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
  });
});
