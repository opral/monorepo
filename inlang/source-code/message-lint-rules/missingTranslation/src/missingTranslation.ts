import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";

export const missingTranslationRule: MessageLintRule = {
  id: id as MessageLintRule["id"],
  displayName,
  description,
  run: ({ message, settings, report }) => {
    const translatedLanguageTags = settings.languageTags.filter(
      (languageTag) => languageTag !== settings.sourceLanguageTag,
    );

    for (const translatedLanguageTag of translatedLanguageTags) {
      const filteredVariants =
        message.variants.filter(
          (variant) => variant.languageTag === translatedLanguageTag,
        ) ?? [];
      if (!filteredVariants.length) {
        report({
          messageId: message.id,
          languageTag: translatedLanguageTag,
          body: {
            en: `Message with id '${message.id}' has a missing variant for language tag '${translatedLanguageTag}'.`,
          },
        });
      }
    }
    return;
  },
};
