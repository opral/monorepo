import type { ProjectSettings } from "@inlang/project-settings";
import type { MessageLintRule } from "@inlang/message-lint-rule";
import type { Plugin } from "@inlang/plugin";
import type {
  NodeishFilesystemSubset,
  ResolvePluginsFunction,
  ResolvedPluginApi,
} from "./plugins/types.js";
import type { ModuleHasNoExportsError, ModuleImportError } from "./errors.js";
import type { ImportFunction } from "./import.js";
import type { resolveMessageLintRules } from "./message-lint-rules/resolveMessageLintRules.js";

/**
 * Function that resolves modules from the config.
 *
 * Pass a custom `_import` function to override the default import function.
 */
export type ResolveModuleFunction = (args: {
  projectPath: string;
  settings: ProjectSettings;
  nodeishFs: NodeishFilesystemSubset;
  _import?: ImportFunction;
}) => Promise<{
  /**
   * Metadata about the resolved module.
   *
   * @example
   * [{
   * 	  id: "plugin.inlang.json",
   * 	  module: "https://myplugin.com/index.js"
   * }]
   */
  meta: Array<{
    /**
     * The module link.
     *
     * @example "https://myplugin.com/index.js"
     */
    module: string;
    /**
     * The resolved item id of the module.
     */
    id: Plugin["id"] | MessageLintRule["id"];
  }>;
  /**
   * The resolved plugins.
   */
  plugins: Array<Plugin>;
  /**
   * The resolved message lint rules.
   */
  messageLintRules: Array<MessageLintRule>;
  /**
   * The resolved api provided by plugins.
   */
  resolvedPluginApi: ResolvedPluginApi;
  /**
   * Errors during the resolution process.
   *
   * This includes errors from:
   * - importing module
   * - resolving plugins
   * - resolving lint rules
   * - resolving the runtime plugin api
   */
  errors: Array<
    | ModuleHasNoExportsError
    | ModuleImportError
    | Awaited<ReturnType<ResolvePluginsFunction>>["errors"][number]
    | Awaited<ReturnType<typeof resolveMessageLintRules>>["errors"][number]
  >;
}>;
