/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest";
import { Plugin, MessageLintRule } from "../index.js";
// import { createNodeishMemoryFs } from "@lix-js/fs"
import { Type } from "@sinclair/typebox";
import { validatedModuleSettings } from "./validatedModuleSettings.js";

const mockPluginSchema: Plugin["settingsSchema"] = Type.Object({
  pathPattern: Type.Union([
    Type.String({
      pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
      description:
        "The pathPattern must contain `{languageTag}` and end with `.json`.",
    }),
    Type.Record(
      Type.String({
        pattern: "^[^.]+$",
        description: "Dots are not allowd ",
        examples: ["website", "app", "homepage"],
      }),
      Type.String({
        pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
        description:
          "The pathPattern must contain `{languageTag}` and end with `.json`.",
      }),
    ),
  ]),
  variableReferencePattern: Type.Array(Type.String()),
});

const mockMessageLintRuleSchema: MessageLintRule["settingsSchema"] =
  Type.Object({
    ignore: Type.Array(
      Type.String({
        pattern: '([^"]*)',
        description:
          "All items in the array need quotaion marks at the end and beginning",
      }),
    ),
  });

test("if PluginSchema does match with the moduleSettings", async () => {
  const isValid = await validatedModuleSettings({
    settingsSchema: mockPluginSchema,
    moduleSettings: {
      pathPattern: "./examples/example01/{languageTag}.json",
      variableReferencePattern: ["{", "}"],
    },
  });

  expect(isValid).toBe("isValid");
});

test("if namespace settings are valide", async () => {
  const isValid = validatedModuleSettings({
    settingsSchema: mockPluginSchema,
    moduleSettings: {
      pathPattern: {
        website: "./{languageTag}examplerFolder/ExampleFile.json",
        app: "../{languageTag}examplerFolder/ExampleFile.json",
        footer: "./{languageTag}examplerFolder/ExampleFile.json",
      },
      variableReferencePattern: ["{", "}"],
    },
  });
  expect(isValid).toBe("isValid");
});

test(" if MessageLintRuleSchema  match with the settings", async () => {
  const isValid = await validatedModuleSettings({
    settingsSchema: mockMessageLintRuleSchema,
    moduleSettings: {
      ignore: ["example", "warning"],
    },
  });

  expect(isValid).toBe("isValid");
});

test("if  messageLintRule settings are not matching to the settingsSchema would pass ", async () => {
  const isValid = validatedModuleSettings({
    settingsSchema: mockMessageLintRuleSchema,
    moduleSettings: {
      ignore: "example",
    },
  });

  expect(isValid).not.toBe("isValid");
});
