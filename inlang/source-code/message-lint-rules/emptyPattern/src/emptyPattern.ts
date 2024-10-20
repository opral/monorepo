import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";

export const emptyPatternRule: MessageLintRule = {
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
      if (filteredVariants.length === 0) return;
      const patterns = filteredVariants.flatMap(({ pattern }) => pattern);
      if (!patterns.length) {
        report({
          messageId: message.id,
          languageTag: translatedLanguageTag,
          body: {
            en: `Message with id '${message.id}' has no patterns for language tag '${translatedLanguageTag}'.`,
          },
        });
      } else if (
        patterns.length === 1 &&
        patterns[0]?.type === "Text" &&
        patterns[0]?.value === ""
      ) {
        report({
          messageId: message.id,
          languageTag: translatedLanguageTag,
          body: {
            en: `Message with id '${message.id}' has no content for language tag '${translatedLanguageTag}'.`,
          },
        });
      }
    }
  },
};
