import { it, expect } from "vitest";
import { lookup } from "./lookup.js";

it("doesn't end in the default language tag if it was already included", () => {
  expect(
    lookup("en-US", {
      languageTags: ["en-US", "en"],
      defaultLanguageTag: "en-US",
    }),
  ).toEqual("en-US");
  expect(
    lookup("en-GB", {
      languageTags: ["en-US", "en"],
      defaultLanguageTag: "en-US",
    }),
  ).toEqual("en");
  expect(
    lookup("fr", {
      languageTags: ["en-US", "en"],
      defaultLanguageTag: "en-US",
    }),
  ).toEqual("en-US");
});

it("returns the correct fallback for a language with no region", () => {
  expect(
    lookup("de", {
      languageTags: ["en", "de", "de-CH"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("de");
});

it("returns the correct fallbacks for a language tag with a region", () => {
  expect(
    lookup("de-CH-ZH", {
      languageTags: ["en", "fr", "de-CH", "de"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("de-CH");
  expect(
    lookup("de-CH-ZH", {
      languageTags: ["en", "fr", "de-CH-ZH", "de"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("de-CH-ZH");
  expect(
    lookup("de-CH-ZH", {
      languageTags: ["en", "fr", "de"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("de");
  expect(
    lookup("de-CH-ZH", {
      languageTags: ["en", "fr"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("en");
});

it("returns the correct fallbacks for a language tag with a region and variant", () => {
  expect(
    lookup("de-CH-x-private1-private2", {
      languageTags: ["en", "fr", "de-CH", "de"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("de-CH");
  expect(
    lookup("de-CH-x-private1-private2", {
      languageTags: ["en", "fr", "de-CH-x-private1-private2", "de"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("de-CH-x-private1-private2");
  expect(
    lookup("de-CH-x-private1-private2", {
      languageTags: ["en", "fr", "de"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("de");
  expect(
    lookup("de-CH-x-private1-private2", {
      languageTags: ["en", "fr"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("en");
});

it("returns the correct fallbacks for a language tag with a region and a script", () => {
  expect(
    lookup("zh-Hans-CN", {
      languageTags: ["en", "zh-Hans-CN", "zh-Hans", "zh"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("zh-Hans-CN");
  expect(
    lookup("zh-Hans-CN", {
      languageTags: ["en", "zh-Hans", "zh"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("zh-Hans");
  expect(
    lookup("zh-Hans-CN", {
      languageTags: ["en", "zh"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("zh");
  expect(
    lookup("zh-Hans-CN", { languageTags: ["en"], defaultLanguageTag: "en" }),
  ).toEqual("en");
});

it("does not get confused by the x separator", () => {
  expect(
    lookup("zh-Hans-CN-x-private1-private2", {
      languageTags: ["en", "zh-Hans-CN", "zh-Hans", "zh"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("zh-Hans-CN");
  expect(
    lookup("zh-Hans-CN-x-private1-private2", {
      languageTags: ["en", "zh-Hans", "zh"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("zh-Hans");
  expect(
    lookup("zh-Hans-CN-x-private1-private2", {
      languageTags: ["en", "zh"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("zh");
  expect(
    lookup("zh-Hans-CN-x-private1-private2", {
      languageTags: ["en"],
      defaultLanguageTag: "en",
    }),
  ).toEqual("en");
});
