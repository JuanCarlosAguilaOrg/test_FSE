export type LearningState = 'MAIN' | 'THEORY' | 'REINFORCEMENT' | 'COMPLETED';

export interface PublicStep {
  state: LearningState;
  completed: boolean;
  topic: { code: string; title: string; position: number; total: number };
  activity?: {
    code: string;
    type: 'MAIN' | 'REINFORCEMENT';
    prompt: string;
    options: { key: string; text: string }[];
  };
  theory?: { content: string };
}

export interface ProgressSummary {
  state: LearningState;
  currentTopic: { code: string; title: string; position: number };
  completedTopics: { code: string; title: string; completedAt: string }[];
  completedCount: number;
  totalTopics: number;
  percent: number;
  courseCompleted: boolean;
}

export interface AttemptRecord {
  id: number;
  activityCode: string;
  activityType: 'MAIN' | 'REINFORCEMENT';
  topicCode: string;
  selectedOption: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface AttemptResult {
  attempt: { id: number; activityCode: string; selectedOption: string; isCorrect: boolean; createdAt: string };
  step: PublicStep;
}
