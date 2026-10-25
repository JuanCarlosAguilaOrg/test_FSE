import { execSync } from 'node:child_process';

// Aplica migraciones SOLO a la base de pruebas y se niega a correr contra otra.
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !/\/[^/?]*_test(\?|$)/.test(url)) {
    throw new Error('TEST_DATABASE_URL debe apuntar a una base cuyo nombre termine en _test.');
  }
  execSync('npx prisma migrate deploy --schema ../../prisma/schema.prisma', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
}
