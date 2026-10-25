import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  test: {
    // Los tests SIEMPRE usan TEST_DATABASE_URL, nunca la base de desarrollo.
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? '', NODE_ENV: 'test' },
    globalSetup: ['./tests/globalSetup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
