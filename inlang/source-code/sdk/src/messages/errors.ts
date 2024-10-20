export class MessageVariantDoesNotExistError extends Error {
  readonly #id = "MessageVariantDoesNotExistError";

  constructor(messageId: string, languageTag: string) {
    super(
      `For message '${messageId}' and '${languageTag}', there doesn't exist a variant for this specific matchers.`,
    );
  }
}
export class MessageVariantAlreadyExistsError extends Error {
  readonly #id = "MessageVariantAlreadyExistsError";

  constructor(messageId: string, languageTag: string) {
    super(
      `For message '${messageId}' and '${languageTag}', there already exists a variant for this specific matchers.`,
    );
  }
}
export class MessagePatternsForLanguageTagDoNotExistError extends Error {
  readonly #id = "MessagePatternsForLanguageTagDoNotExistError";

  constructor(messageId: string, languageTag: string) {
    super(
      `For message '${messageId}' there are no patterns with the languageTag '${languageTag}'.`,
    );
  }
}
