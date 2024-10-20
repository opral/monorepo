import { Value } from "@sinclair/typebox/value";
import { LanguageTag } from "./interface.js";
import { describe, expect, it } from "vitest";

// see README.md for more information
describe("verify language tags", () => {
  it("should pass valid language tags", () => {
    const validLanguageTags: string[] = [
      "en",
      "de",
      "pt-BR",
      "en-US",
      "zh-Hans",
      "de-DE",
      "es-419",
      "de-DE-1991",
      "i-default",
    ];

    for (const tag of validLanguageTags) {
      const result = Value.Check(LanguageTag, tag);
      expect(result).toBe(true);
    }
  });

  it("should detect invalid language tags", () => {
    const invalidLanguageTags: string[] = [
      "invalid", // Too long
      "_US", // Starts with underscore
      "en.US", // Dot is not allowed
      "en–US", // Special hyphen is not allowed
      "en|US", // Pipe is not allowed
      "de-", // Missing region
      "enUS", // 4 characters are not allowed
      "en_US", // Underscore is not allowed
      "en-Testoooooo", // Too long variant
      "fr-CA-QUÉ", // Non-ASCII characters are not allowed
      "en-US-InvalidVariant-12345", // Invalid variant
    ];

    for (const tag of invalidLanguageTags) {
      const result = Value.Check(LanguageTag, tag);
      expect(result).toBe(false);
    }
  });
});
