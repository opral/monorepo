/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, test } from "vitest";
import type { Message } from "@inlang/message";
import { emptyPatternRule } from "./emptyPattern.js";
import { lintSingleMessage } from "@inlang/sdk/lint";

const message1: Message = {
  id: "1",
  alias: {},
  selectors: [],
  variants: [
    {
      languageTag: "en",
      match: [],
      pattern: [{ type: "Text", value: "Inlang" }],
    },
    {
      languageTag: "de",
      match: [],
      pattern: [{ type: "Text", value: "Inlang" }],
    },
    { languageTag: "es", match: [], pattern: [] },
    { languageTag: "cn", match: [], pattern: [{ type: "Text", value: "" }] },
  ],
};

const messages = [message1];

test("should not report if all messages are present", async () => {
  const result = await lintSingleMessage({
    settings: {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
      messageLintRuleLevels: {
        [emptyPatternRule.id]: "warning",
      },
    },
    messages,
    message: message1,
    rules: [emptyPatternRule],
  });

  expect(result.errors).toHaveLength(0);
  expect(result.data).toHaveLength(0);
});

test("should report if no patterns are defined", async () => {
  const result = await lintSingleMessage({
    settings: {
      sourceLanguageTag: "en",
      languageTags: ["en", "es"],
      modules: [],
      messageLintRuleLevels: {
        [emptyPatternRule.id]: "warning",
      },
    },
    messages,
    message: message1,
    rules: [emptyPatternRule],
  });

  expect(result.errors).toHaveLength(0);
  expect(result.data).toHaveLength(1);
  expect(result.data[0]!.languageTag).toBe("es");
  expect(result.data[0]!.messageId).toBe(message1.id);
  expect(
    typeof result.data[0]!.body === "object"
      ? result.data[0]!.body.en
      : result.data[0]!.body,
  ).toContain(message1.id);
});

test("should report if a message has a pattern with only one text element that is an empty string", async () => {
  const result = await lintSingleMessage({
    settings: {
      sourceLanguageTag: "en",
      languageTags: ["en", "cn"],
      modules: [],
      messageLintRuleLevels: {
        [emptyPatternRule.id]: "warning",
      },
    },
    messages,
    message: message1,
    rules: [emptyPatternRule],
  });

  expect(result.errors).toHaveLength(0);
  expect(result.data).toHaveLength(1);
  expect(result.data[0]!.languageTag).toBe("cn");
});

describe("reported by missingTranslationRule", () => {
  test("should not report if a languageTag is not present", async () => {
    const result = await lintSingleMessage({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en", "it"],
        modules: [],
        messageLintRuleLevels: {
          [emptyPatternRule.id]: "warning",
        },
      },
      messages,
      message: message1,
      rules: [emptyPatternRule],
    });

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(0);
  });

  test("should not report if no variants are defined", async () => {
    const result = await lintSingleMessage({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en", "fr"],
        modules: [],
        messageLintRuleLevels: {
          [emptyPatternRule.id]: "warning",
        },
      },
      messages,
      message: message1,
      rules: [emptyPatternRule],
    });

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(0);
  });
});
