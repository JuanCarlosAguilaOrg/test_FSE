import { z } from 'zod';

export const attemptBodySchema = z
  .object({
    activityCode: z.string().trim().min(1).max(32),
    selectedOption: z.string().trim().min(1).max(16),
  })
  .strict();
