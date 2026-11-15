import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/e2e/global-setup.ts'],
    setupFiles: ['./test/e2e/setup-env.ts'],
    // One database per worker (see setup-env.ts): pin the count, so the set
    // of e2e databases is the same on every machine and in CI.
    maxWorkers: 4,
    // `beforeAll` boots the whole app, connects to Mongo and waits for the
    // index builds: the 10 s default is too tight on a cold CI runner.
    hookTimeout: 30_000,
  },
});
