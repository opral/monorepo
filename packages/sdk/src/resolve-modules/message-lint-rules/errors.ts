import type { MessageLintRule } from "@inlang/message-lint-rule";
import type { ValueError } from "@sinclair/typebox/errors";

export class MessageLintRuleIsInvalidError extends Error {
  constructor(options: { id: MessageLintRule["id"]; errors: ValueError[] }) {
    super(
      `The message lint rule "${options.id}" is invalid:\n\n${options.errors.join("\n")}`,
    );
    this.name = "MessageLintRuleIsInvalidError";
  }
}
