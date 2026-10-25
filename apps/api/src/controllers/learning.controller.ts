import { asyncHandler } from '../middleware/error';
import { attemptBodySchema } from '../schemas/learning.schema';
import * as service from '../services/learning.service';

export const getCurrent = asyncHandler(async (_req, res) => {
  res.json(await service.getCurrentStep());
});

export const getProgress = asyncHandler(async (_req, res) => {
  res.json(await service.getProgressSummary());
});

export const getAttempts = asyncHandler(async (_req, res) => {
  res.json({ attempts: await service.listAttempts() });
});

export const postAttempt = asyncHandler(async (req, res) => {
  const body = attemptBodySchema.parse(req.body);
  res.status(201).json(await service.submitAttempt(body));
});

// No lee body: el destino lo decide exclusivamente el dominio.
export const postContinueTheory = asyncHandler(async (_req, res) => {
  res.json({ step: await service.continueTheory() });
});
