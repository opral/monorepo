import { it, expect } from "vitest";
import { migrate1to2 } from "./1-to-2.js";
import { Value } from "@sinclair/typebox/value";
import { ProjectSettings } from "../index.js";

it("should migrate $schema", () => {
  const config = {
    $schema: "https://inlang.com/schema/project-config",
    sourceLanguageTag: "en",
    languageTags: ["en", "de"],
    modules: [],
    settings: {},
  };
  const migrated = migrate1to2(config);
  expect(migrated.$schema).toBe("https://inlang.com/schema/project-settings");
  expect(Value.Check(ProjectSettings, migrated)).toBe(true);
});

it("should migrate messageLintRuleLevels", () => {
  const config = {
    sourceLanguageTag: "en",
    languageTags: ["en", "de"],
    modules: [],
    settings: {
      "project.messageLintRuleLevels": {
        "messageLintRule.placeholder.name": "error",
      },
    },
  };
  const migrated = migrate1to2(config);
  expect(migrated.messageLintRuleLevels).toStrictEqual({
    "messageLintRule.placeholder.name": "error",
  });
  expect(Value.Check(ProjectSettings, migrated)).toBe(true);
});

it("should migrate settings to the root level", () => {
  const config = {
    sourceLanguageTag: "en",
    languageTags: ["en", "de"],
    modules: [],
    settings: {
      "plugin.inlang.json": {
        "messageLintRule.placeholder.name": "error",
      },
    },
  };
  const migrated = migrate1to2(config);
  expect(migrated["plugin.inlang.json"]).toStrictEqual({
    "messageLintRule.placeholder.name": "error",
  });
  expect(Value.Check(ProjectSettings, migrated)).toBe(true);
});
