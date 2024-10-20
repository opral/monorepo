import { MessageLintRule } from "@inlang/message-lint-rule";
import { Plugin } from "@inlang/plugin";
import { Type } from "@sinclair/typebox";

/**
 * An inlang module has a default export that is either a plugin or a message lint rule.
 *
 * @example
 *   export default myPlugin
 */
// not using Static<infer T> here because the type is not inferred correctly
// due to type overwrites in modules.
export type InlangModule = { default: Plugin | MessageLintRule };
export const InlangModule = Type.Object({
  default: Type.Union([Plugin, MessageLintRule]),
});
