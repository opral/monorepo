import type { ResolveModuleFunction } from "./types.js";
import { InlangModule } from "@inlang/module";
import {
  ModuleError,
  ModuleImportError,
  ModuleHasNoExportsError,
  ModuleExportIsInvalidError,
  ModuleSettingsAreInvalidError,
} from "./errors.js";
import { tryCatch } from "@inlang/result";
import { resolveMessageLintRules } from "./message-lint-rules/resolveMessageLintRules.js";
import { createImport } from "./import.js";
import { resolvePlugins } from "./plugins/resolvePlugins.js";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { validatedModuleSettings } from "./validatedModuleSettings.js";
import type { Plugin } from "@inlang/plugin";
import type { MessageLintRule } from "@inlang/message-lint-rule";

const ModuleCompiler = TypeCompiler.Compile(InlangModule);

export const resolveModules: ResolveModuleFunction = async (args) => {
  const _import =
    args._import ?? createImport(args.projectPath, args.nodeishFs);

  const allPlugins: Array<Plugin> = [];
  const allMessageLintRules: Array<MessageLintRule> = [];
  const meta: Awaited<ReturnType<ResolveModuleFunction>>["meta"] = [];
  const moduleErrors: Array<ModuleError> = [];

  async function resolveModule(module: string) {
    const importedModule = await tryCatch<InlangModule>(() => _import(module));

    // -- FAILED TO IMPORT --
    if (importedModule.error) {
      moduleErrors.push(
        new ModuleImportError({
          module: module,
          cause: importedModule.error as Error,
        }),
      );
      return;
    }

    // -- MODULE DOES NOT EXPORT ANYTHING --
    if (importedModule.data?.default === undefined) {
      moduleErrors.push(
        new ModuleHasNoExportsError({
          module: module,
        }),
      );
      return;
    }

    // -- CHECK IF MODULE IS SYNTACTIALLY VALID
    const isValidModule = ModuleCompiler.Check(importedModule.data);
    if (isValidModule === false) {
      const errors = [...ModuleCompiler.Errors(importedModule.data)];
      moduleErrors.push(
        new ModuleExportIsInvalidError({
          module: module,
          errors,
        }),
      );

      return;
    }

    // -- VALIDATE MODULE SETTINGS

    const result = validatedModuleSettings({
      settingsSchema: importedModule.data.default.settingsSchema,
      moduleSettings: args.settings[importedModule.data.default.id],
    });
    if (result !== "isValid") {
      moduleErrors.push(
        new ModuleSettingsAreInvalidError({ module: module, errors: result }),
      );
      return;
    }

    meta.push({
      module: module,
      id: importedModule.data.default.id,
    });

    if (importedModule.data.default.id.startsWith("plugin.")) {
      allPlugins.push(importedModule.data.default as Plugin);
    } else if (importedModule.data.default.id.startsWith("messageLintRule.")) {
      allMessageLintRules.push(importedModule.data.default as MessageLintRule);
    } else {
      moduleErrors.push(
        new ModuleError(
          `Unimplemented module type ${importedModule.data.default.id}.The module has not been installed.`,
          { module: module },
        ),
      );
    }
  }

  await Promise.all(args.settings.modules.map(resolveModule));
  const resolvedPlugins = await resolvePlugins({
    plugins: allPlugins,
    settings: args.settings,
    nodeishFs: args.nodeishFs,
  });

  const resolvedLintRules = resolveMessageLintRules({
    messageLintRules: allMessageLintRules,
  });

  return {
    meta,
    messageLintRules: allMessageLintRules,
    plugins: allPlugins,
    resolvedPluginApi: resolvedPlugins.data,
    errors: [
      ...moduleErrors,
      ...resolvedLintRules.errors,
      ...resolvedPlugins.errors,
    ],
  };
};
