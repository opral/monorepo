/**
 * Error when a lint rule throws during the linting process.
 */
export class MessagedLintRuleThrowedError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MessagedLintRuleThrowedError";
  }
}
