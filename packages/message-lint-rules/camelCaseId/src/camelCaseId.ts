import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";
import { isCamelCaseId } from "./isCamelCaseId.js";

export const camelCaseId: MessageLintRule = {
  id: id as MessageLintRule["id"],
  displayName,
  description,
  run: ({ message, settings, report }) => {
    if (!isCamelCaseId(message.id)) {
      return report({
        messageId: message.id,
        languageTag: settings.sourceLanguageTag,
        body: {
          en: `Message with id '${message.id}' should be in camel case format.`,
        },
      });
    }
  },
};
