/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { MessageLintRule } from "@inlang/message-lint-rule";
import type { Plugin } from "@inlang/plugin";
import { expect, it } from "vitest";
import {
  ModuleError,
  ModuleExportIsInvalidError,
  ModuleHasNoExportsError,
  ModuleImportError,
  ModuleSettingsAreInvalidError,
} from "./errors.js";
import { resolveModules } from "./resolveModules.js";
import type { ProjectSettings } from "@inlang/project-settings";
import type { InlangModule } from "@inlang/module";
import { Type } from "@sinclair/typebox";

it("should return an error if a plugin cannot be imported", async () => {
  const settings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["de", "en"],
    modules: ["https://myplugin.com/index.js"],
  };

  const resolved = await resolveModules({
    projectPath: "/project.inlang",
    settings,
    nodeishFs: {} as any,
    _import: () => {
      throw new ModuleImportError({
        module: settings.modules[0]!,
        cause: new Error("Could not import"),
      });
    },
  });

  expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError);
});

it("should resolve plugins and message lint rules successfully", async () => {
  // Define mock data
  const mockPlugin: Plugin = {
    id: "plugin.namespace.mock",
    description: { en: "Mock plugin description" },
    displayName: { en: "Mock Plugin" },

    loadMessages: () => undefined as any,
    saveMessages: () => undefined as any,
    addCustomApi: () => ({
      "app.inlang.ideExtension": {
        messageReferenceMatcher: () => undefined as any,
      },
    }),
  };

  const mockMessageLintRule: MessageLintRule = {
    id: "messageLintRule.namespace.mock",
    description: { en: "Mock lint rule description" },
    displayName: { en: "Mock Lint Rule" },

    run: () => undefined,
  };

  const settings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["de", "en"],
    modules: ["lint-rule.js", "plugin.js"],
  };

  const _import = async (name: string) => {
    if (name === "lint-rule.js") {
      return {
        default: mockMessageLintRule,
      };
    } else {
      return {
        default: mockPlugin,
      };
    }
  };

  // Call the function
  const resolved = await resolveModules({
    projectPath: "/project.inlang",
    settings,
    _import,
    nodeishFs: {} as any,
  });

  // Assert results
  expect(resolved.errors).toHaveLength(0);
  // Check for the meta data of the plugin
  expect(
    resolved.plugins.some((module) => module.id === mockPlugin.id),
  ).toBeDefined();
  // Check for the app specific api
  expect(
    resolved.resolvedPluginApi["customApi"]?.["app.inlang.ideExtension"],
  ).toBeDefined();
  // Check for the lint rule
  expect(resolved.messageLintRules[0]?.id).toBe(mockMessageLintRule.id);
});

it("should return an error if a module cannot be imported", async () => {
  const settings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["de", "en"],
    modules: ["https://myplugin.com/index.js"],
  };

  const _import = async () => {
    throw new ModuleImportError({
      module: settings.modules[0]!,
      cause: new Error(),
    });
  };

  // Call the function
  const resolved = await resolveModules({
    projectPath: "/project.inlang",
    settings,
    _import,
    nodeishFs: {} as any,
  });

  // Assert results
  expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError);
});

it("should return an error if a module does not export anything", async () => {
  const settings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["de", "en"],
    modules: ["https://myplugin.com/index.js"],
  };

  const _import = async () => ({});

  // Call the function
  const resolved = await resolveModules({
    projectPath: "/project.inlang",
    settings,
    _import,
    nodeishFs: {} as any,
  });

  // Assert results
  expect(resolved.errors[0]).toBeInstanceOf(ModuleHasNoExportsError);
});

it("should return an error if a module exports an invalid plugin or lint rule", async () => {
  const settings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["de", "en"],
    modules: ["https://myplugin.com/index.js"],
  };
  const _import = async () =>
    ({
      // @ts-expect-error - invalid meta of a plugin
      default: {
        id: "plugin.namespace.mock",
        description: { en: "Mock plugin description" },
      },
    }) satisfies InlangModule;

  const resolved = await resolveModules({
    projectPath: "/project.inlang",
    settings,
    _import,
    nodeishFs: {} as any,
  });
  expect(resolved.errors[0]).toBeInstanceOf(ModuleExportIsInvalidError);
});

it("should handle other unhandled errors during plugin resolution", async () => {
  const errorMessage = "Unhandled error during plugin resolution";
  const settings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["de", "en"],
    modules: ["https://myplugin.com/index.js"],
  };

  const _import = async () => {
    throw new Error(errorMessage);
  };

  // Call the function
  const resolved = await resolveModules({
    projectPath: "/project.inlang",
    settings,
    _import,
    nodeishFs: {} as any,
  });

  // Assert results
  expect(resolved.errors[0]).toBeInstanceOf(ModuleError);
});
it("should return an error if a moduleSettings are invalid", async () => {
  const settings: ProjectSettings = {
    sourceLanguageTag: "en",
    languageTags: ["de", "en"],
    modules: ["plugin.js"],
    "plugin.namespace.mock": {
      ignore: ["invalid"],
    },
  };

  const _import = async () => ({
    default: {
      id: "plugin.namespace.mock",
      description: { en: "Mock plugin description" },
      displayName: { en: "Mock Plugin" },
      settingsSchema: Type.Object({
        ignore: Type.String(),
      }),
    },
  });

  // Call the function
  const resolved = await resolveModules({
    projectPath: "/project.inlang",
    settings,
    _import,
    nodeishFs: {} as any,
  });

  // Assert results
  expect(resolved.errors[0]).toBeInstanceOf(ModuleSettingsAreInvalidError);
});
