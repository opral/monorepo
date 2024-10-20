import { describe, expect, it } from "vitest";
import { lintMessages } from "@inlang/sdk/lint";
import validJsIdentifier from "./index.js";
import { createMessage } from "@inlang/sdk/test-utilities";

describe("validJsIdentifier", () => {
  it("should not report if no messageId is a valid JS Identifier", async () => {
    const messages = [
      createMessage("someId", { en: "some text" }),
      createMessage("some_id", { en: "some text" }),
      createMessage("some_id_0", { en: "some text" }),
      createMessage("_some_id_$", { en: "some text" }),
      createMessage("你好", { en: "some text" }),
    ];

    const result = await lintMessages({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        messageLintRuleLevels: {
          [validJsIdentifier.id]: "warning",
        },
      },
      messages,
      rules: [validJsIdentifier],
    });

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(0);
  });

  it("should report if messageId is a javascript keyword", async () => {
    const testKeywords = ["delete", "void", "instanceof", "enum"];
    const messages = testKeywords.map((keyword) =>
      createMessage(keyword, { en: "some text" }),
    );

    const result = await lintMessages({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        messageLintRuleLevels: {
          [validJsIdentifier.id]: "warning",
        },
      },
      messages,
      rules: [validJsIdentifier],
    });

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(testKeywords.length);
  });

  it("should report if messageId is not a valid JS Identifier", async () => {
    const messages = [
      createMessage("0some_message", { en: "some text" }),
      createMessage("void", { en: "some text" }),
      createMessage("#some_message", { en: "some text" }),
      createMessage("@some_message", { en: "some text" }),
      createMessage("S O M E M E S S A G E", { en: "some text" }),
      createMessage("    some_message    ", { en: "some text" }),
    ];

    const result = await lintMessages({
      settings: {
        sourceLanguageTag: "en",
        languageTags: ["en"],
        modules: [],
        messageLintRuleLevels: {
          [validJsIdentifier.id]: "warning",
        },
      },
      messages,
      rules: [validJsIdentifier],
    });

    expect(result.errors).toHaveLength(0);
    expect(result.data).toHaveLength(messages.length);
  });
});
