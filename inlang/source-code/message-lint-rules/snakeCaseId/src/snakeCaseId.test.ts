/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest";
import { lintSingleMessage } from "@inlang/sdk/lint";
import type { Message } from "@inlang/message";
import { snakeCaseId } from "./snakeCaseId.js";

const messageValid: Message = {
  id: "message_with_valid_id",
  alias: {},
  selectors: [],
  variants: [
    { languageTag: "en", match: [], pattern: [] },
    { languageTag: "de", match: [], pattern: [] },
  ],
};

const messageInvalid: Message = {
  id: "messageWithInvalidId",
  alias: {},
  selectors: [],
  variants: [
    { languageTag: "en", match: [], pattern: [] },
    { languageTag: "de", match: [], pattern: [] },
  ],
};

const messages = [messageValid, messageInvalid];

test("should not report if message id is in snake case format", async () => {
  const result = await lintSingleMessage({
    settings: {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      messageLintRuleLevels: {
        [snakeCaseId.id]: "error",
      },
    },
    messages,
    message: messageValid,
    rules: [snakeCaseId],
  });

  expect(result.errors).toHaveLength(0);
  expect(result.data).toHaveLength(0);
});

test("should report if message id is not in the format of snake case", async () => {
  const result = await lintSingleMessage({
    settings: {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      messageLintRuleLevels: {
        [snakeCaseId.id]: "error",
      },
    },
    messages,
    message: messageInvalid,
    rules: [snakeCaseId],
  });

  expect(result.errors).toHaveLength(0);
  expect(result.data).toHaveLength(1);
  expect(result.data[0]!.messageId).toBe(messageInvalid.id);
  expect(result.data[0]!.languageTag).toBe("en");
  // @ts-ignore
  expect(result.data[0]!.body.en).toBe(
    `Message with id '${messageInvalid.id}' should use the message id format of snake_case (all lowercase with underscores).`,
  );
});
