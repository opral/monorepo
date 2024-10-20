import type { MessageLintRule } from "@inlang/message-lint-rule";
import { id, displayName, description } from "../marketplace-manifest.json";
import { isValidJSIdentifier } from "./isValidJSIdentifier.js";

const validJsIdentifier: MessageLintRule = {
  id: id as MessageLintRule["id"],
  displayName,
  description,
  run: ({ message, settings, report }) => {
    // There are some keywords that _are_ valid variable names in certain contexts.
    // To be safe we always disallow them.
    if (!isValidJSIdentifier(message.id)) {
      report({
        messageId: message.id,
        languageTag: settings.sourceLanguageTag,
        body: {
          en: `The message ID '${message.id}' is not a valid javascript identifier.`,
        },
      });
    }

    return;
  },
};

export default validJsIdentifier;
