import { describe, it, expect } from "vitest";
import { negotiateLanguagePreferences } from "./language.js";

describe("preferredLanguages", () => {
  it("should return the acceptable languages", () => {
    expect(negotiateLanguagePreferences("de-CH", ["de", "de-CH"])).toEqual([
      "de-CH",
      "de",
    ]);
  });

  it("should return an empty array if there are no acceptable languages", () => {
    expect(negotiateLanguagePreferences("de-CH", [])).toEqual([]);
  });

  it("should sort the matches by quality", () => {
    const headerValue = "fr-CH, fr;q=0.6, en;q=0.8, de;q=0.7, *;q=0.5";
    expect(
      negotiateLanguagePreferences(headerValue, ["fr-CH", "fr", "en", "de"]),
    ).toEqual(["fr-CH", "en", "de", "fr"]);
  });

  it("should return the available languages if the accept header is missing", () => {
    expect(
      negotiateLanguagePreferences(undefined, ["en-US", "en-GB", "de"]),
    ).toEqual(["en-US", "en-GB", "de"]);
  });

  it("should use the index of the language as a tie-breaker if the quality is the same", () => {
    const headerValue = "fr-CH, fr;q=0.8, en;q=0.8, de;q=0.7, *;q=0.5";
    expect(
      negotiateLanguagePreferences(headerValue, ["fr-CH", "fr", "en", "de"]),
    ).toEqual(["fr-CH", "fr", "en", "de"]);
  });
});
