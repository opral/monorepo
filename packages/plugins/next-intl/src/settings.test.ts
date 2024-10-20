/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest";
// import { Message, ProjectSettings, Variant, createVariant, getVariant } from "@inlang/sdk"
import { plugin } from "./plugin.js";
// import { createNodeishMemoryFs } from "@lix-js/fs"
import { Value } from "@sinclair/typebox/value";

// const pluginId = "plugin.inlang.json"

test("valid path patterns", async () => {
  const validPathPatterns = [
    "/folder/{languageTag}.json",
    "./{languageTag}/file.json",
    "../folder/{languageTag}/file.json",
    "./{languageTag}.json",
    "./{languageTag}/folder/file.json",
  ];

  for (const pathPattern of validPathPatterns) {
    const isValid = Value.Check(plugin.settingsSchema!, {
      pathPattern,
    });
    expect(isValid).toBe(true);
  }
});

test("it should fail if the path pattern does not start as a ralaitve path with a /,./ or ../", async () => {
  const pathPattern = "{languageTag}.json";

  const isValid = Value.Check(plugin.settingsSchema!, {
    pathPattern,
  });
  expect(isValid).toBe(false);
});
test("if path patter does include the word `{languageTag}`", async () => {
  const pathPattern = "./examplePath.json";

  const isValid = Value.Check(plugin.settingsSchema!, {
    pathPattern,
  });
  expect(isValid).toBe(false);
});
test("if path patte end with .json", async () => {
  const pathPattern = "./{languageTag}.";

  const isValid = Value.Check(plugin.settingsSchema!, {
    pathPattern,
  });
  expect(isValid).toBe(false);
});
test("if curly brackets {} does to cointain the word languageTag", async () => {
  const pathPattern = "./{en}.json";

  const isValid = Value.Check(plugin.settingsSchema!, {
    pathPattern,
  });
  expect(isValid).toBe(false);
});
test("if pathPattern doesn't includes a '*' wildcard. This was deprecated in version 3.0.0.", async () => {
  const pathPattern = "./{languageTag}/*.json";
  const isValid = Value.Check(plugin.settingsSchema!, {
    pathPattern,
  });
  expect(isValid).toBe(false);
});
