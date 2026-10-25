export type DomainErrorCode =
  | 'THEORY_REQUIRED'
  | 'THEORY_NOT_PENDING'
  | 'COURSE_COMPLETED'
  | 'INVALID_TOPIC_INDEX';

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
