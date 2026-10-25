import { Router } from 'express';
import * as c from '../controllers/learning.controller';

export const learningRouter = Router();
learningRouter.get('/current', c.getCurrent);
learningRouter.get('/progress', c.getProgress);
learningRouter.get('/attempts', c.getAttempts);
learningRouter.post('/attempts', c.postAttempt);
learningRouter.post('/theory/continue', c.postContinueTheory);
