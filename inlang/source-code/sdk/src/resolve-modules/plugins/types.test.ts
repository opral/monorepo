import { ProjectSettings } from "@inlang/project-settings";
import { Value } from "@sinclair/typebox/value";
import { describe, test, expect } from "vitest";
import { expectType } from "tsd";
import { Plugin } from "@inlang/plugin";

describe("Plugin", () => {
  test("meta.id should enforce plugin.namespace.* patterns", () => {
    expectType<`plugin.${string}.${string}`>("" as Plugin["id"]);

    const mockPlugin: Plugin = {
      id: "plugin.namespace.placeholder",
      displayName: { en: "" },
      description: { en: "" },
    };

    const passCases = ["plugin.namespace.helloWorld", "plugin.namespace.i18n"];
    const failCases = [
      "namespace.hello_World",
      "plugin.namespace-HelloWorld",
      "lintRule.namespace.coolPlugin",
    ];

    for (const pass of passCases) {
      mockPlugin.id = pass as any;

      // @ts-ignore - type mismatch error. fix after refactor
      expect(Value.Check(Plugin, mockPlugin)).toBe(true);
    }

    for (const fail of failCases) {
      mockPlugin.id = fail as any;
      // @ts-ignore - type mismatch error. fix after refactor
      expect(Value.Check(Plugin, mockPlugin)).toBe(false);
    }
  });

  test("meta.id should be a valid inlang.config.setting key", () => {
    const settings: ProjectSettings = {
      sourceLanguageTag: "en",
      languageTags: ["en", "de"],
      modules: [],
    };
    const cases = ["plugin.namespace.helloWorld", "plugin.namespace.i18n"];

    for (const _case of cases) {
      const mergedSettings = { ...settings, [_case]: {} };
      expect(Value.Check(ProjectSettings, mergedSettings)).toBe(true);
      // @ts-ignore - type mismatch error. fix after refactor
      expect(Value.Check(Plugin["properties"]["id"], _case)).toBe(true);
    }
  });
});
