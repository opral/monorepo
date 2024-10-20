import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";

export const messageWithoutSourceRule: MessageLintRule = {
  id: id as MessageLintRule["id"],
  displayName,
  description,
  run: ({ message, settings, report }) => {
    if (
      !message.variants.some(
        (variant) => variant.languageTag === settings.sourceLanguageTag,
      )
    ) {
      report({
        messageId: message.id,
        languageTag: settings.sourceLanguageTag,
        body: {
          en: `Message with id '${message.id}' is specified, but missing in the source.`,
        },
      });
    }
  },
};
