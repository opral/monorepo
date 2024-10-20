import { describe, expect, test } from "vitest";
import { isValidLanguageTag } from "./validate.js";

describe("validate language tags", () => {
  test("should pass valid language tags", () => {
    const validLanguageTags = [
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
      const result = isValidLanguageTag(tag);
      expect(result).toBe(true);
    }
  });
  test("should detect invalid language tags", () => {
    const invalidLanguageTags = [
      "invalid",
      "_US",
      "en.US",
      "en–US",
      "en|US",
      "de-",
      "enUS",
      "en_US",
      "en-Testoooooo",
      "fr-CA-QUÉ",
      "en-US-InvalidVariant-12345",
    ];
    for (const tag of invalidLanguageTags) {
      const result = isValidLanguageTag(tag);
      expect(result).toBe(false);
    }
  });
});
