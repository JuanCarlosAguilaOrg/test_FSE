import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.string().default('development'),
});

const env = schema.parse(process.env);
export const config = {
  port: env.PORT,
  corsOrigins: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
  isProduction: env.NODE_ENV === 'production',
};
