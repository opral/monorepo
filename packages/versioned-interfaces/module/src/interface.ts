import { MessageLintRule } from "@inlang/message-lint-rule"
import { Plugin } from "@inlang/plugin"
import { type Static, Type } from "@sinclair/typebox"

/**
 * An inlang module.
 */
export type InlangModule = Static<typeof InlangModule>
export const InlangModule = Type.Object({
	default: Type.Union([Plugin, MessageLintRule]),
})
