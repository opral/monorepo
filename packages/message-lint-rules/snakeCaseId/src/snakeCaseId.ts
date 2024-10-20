import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";
import { isSnakeCase } from "./isSnakeCase.js";

export const snakeCaseId: MessageLintRule = {
  id: id as MessageLintRule["id"],
  displayName,
  description,
  run: ({ message, settings, report }) => {
    if (!isSnakeCase(message.id)) {
      report({
        messageId: message.id,
        languageTag: settings.sourceLanguageTag,
        body: {
          en: `Message with id '${message.id}' should use the message id format of snake_case (all lowercase with underscores).`,
        },
      });
    }
  },
};
