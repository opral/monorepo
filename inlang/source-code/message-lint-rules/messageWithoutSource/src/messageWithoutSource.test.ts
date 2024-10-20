/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest";
import { lintSingleMessage } from "@inlang/sdk/lint";
import type { Message } from "@inlang/message";
import { messageWithoutSourceRule } from "./messageWithoutSource.js";

const message1: Message = {
  id: "1",
  alias: {},
  selectors: [],
  variants: [
    { languageTag: "en", match: [], pattern: [] },
    { languageTag: "de", match: [], pattern: [] },
  ],
};

const messages = [message1];

test("should not report if source message present", async () => {
  const result = await lintSingleMessage({
    settings: {
      sourceLanguageTag: "en",
      languageTags: ["en"],
      modules: [],
      messageLintRuleLevels: {
        [messageWithoutSourceRule.id]: "warning",
      },
    },
    messages,
    message: message1,
    rules: [messageWithoutSourceRule],
  });

  expect(result.errors).toHaveLength(0);
  expect(result.data).toHaveLength(0);
});

test("should report if source message is missing", async () => {
  const result = await lintSingleMessage({
    settings: {
      sourceLanguageTag: "it",
      languageTags: ["it"],
      modules: [],
      messageLintRuleLevels: {
        [messageWithoutSourceRule.id]: "warning",
      },
    },
    messages,
    message: message1,
    rules: [messageWithoutSourceRule],
  });

  expect(result.errors).toHaveLength(0);
  expect(result.data).toHaveLength(1);
  expect(result.data[0]!.languageTag).toBe("it");
  expect(result.data[0]!.messageId).toBe(message1.id);
  expect(
    typeof result.data[0]!.body === "object"
      ? result.data[0]!.body.en
      : result.data[0]!.body,
  ).toContain(message1.id);
});
