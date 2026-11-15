import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { closeTestApp, createTestApp } from './e2e/create-test-app.js';

// Set by test/e2e/setup-env.ts.
const ALLOWED_ORIGIN = process.env.CORS_ORIGINS as string;
const BLOCKED_ORIGIN = 'http://blocked.test';

describe('HTTP security (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('sets the helmet security headers', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  describe('CORS preflight', () => {
    function preflight(origin: string) {
      return request(app.getHttpServer())
        .options('/auth/login')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST');
    }

    it('allows an origin on the allowlist', async () => {
      const response = await preflight(ALLOWED_ORIGIN);

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN,
      );
    });

    it('sends no CORS headers to an origin off the allowlist', async () => {
      const response = await preflight(BLOCKED_ORIGIN);

      // The preflight itself succeeds: the browser blocks on the missing header.
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('request body limit', () => {
    function loginWithPadding(paddingLength: number) {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'x'.repeat(paddingLength),
        });
    }

    it('rejects a body over 16 kB with 413', async () => {
      const response = await loginWithPadding(17 * 1024);

      expect(response.status).toBe(413);
    });

    it('lets a body under 16 kB through to validation', async () => {
      const response = await loginWithPadding(15 * 1024);

      // Parsed and rejected by the DTO: the password is over its max length.
      expect(response.status).toBe(400);
    });
  });
});
