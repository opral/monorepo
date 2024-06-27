import { Translatable } from "@inlang/translatable"
import {
	Type,
	type Static,
	type TLiteral,
	type TObject,
	type TTemplateLiteral,
} from "@sinclair/typebox"
import type { JSONObject } from "@inlang/json-types"

import type { MessageBundle } from "./message-bundle.js"
import { LanguageTag } from "./language-tag.js"
import type { ExternalProjectSettings, ProjectSettings2 } from "./project-settings.js"

/**
 * ---------------- AVOIDING CIRCULAR DEPENDENCIES ----------------
 *
 * The types beneath belong to other packages that depent on project settings
 * and must therefore be declared here to avoid circular dependencies.
 *
 */
// TODO check if we need to add properties to lints like missing-pattern-de or missing-pattern-en or
export const _MessageBundleLintRuleId = Type.String({
	description: "The key must be conform to `messageBundleLintRule.{namespace}.{id}` pattern.",
	examples: [
		"messageBundleLintRule.namespace.patternInvalid",
		"messageBundleLintRule.namespace.missingTranslation",
	],
	pattern: "^messageBundleLintRule\\.([a-z][a-zA-Z0-9]*)\\.([a-z][a-zA-Z0-9]*(?:[A-Z][a-z0-9]*)*)$",
}) as unknown as TTemplateLiteral<[TLiteral<`messageBundleLintRule.${string}.${string}`>]>

export const _MessageLintRuleLevel = Type.Union([
	Type.Literal("error"),
	Type.Literal("warning"),
	Type.Literal("off"),
])

export type MessageLintLevel = Static<typeof MessageLintLevel>
export const MessageLintLevel = _MessageLintRuleLevel

/**
 * Lint configuration for a given bundle/message/variant
 */
export const LintConfig = Type.Object({
	// TODO SDK2 Rename to LintSettings
	id: Type.Optional(Type.String({ description: "id of the lint config entry" })),
	ruleId: _MessageBundleLintRuleId,
	// TODO disable this for now - to only reach feature parity for now - this is purly experimental
	bundleId: Type.Optional(Type.String()),
	messageId: Type.Optional(Type.String()),
	messageLocale: Type.Optional(LanguageTag),
	variantId: Type.Optional(Type.String()),
	level: MessageLintLevel,
})
export type LintConfig = Static<typeof LintConfig>

export type LintFix = {
	title: string
}

/**
 * The basis of a lint report (required to contruct a lint report union type)
 */
export type LintReport = {
	ruleId: MessageBundleLintRule["id"]
	// TODO SDK2 check if we should provide a lint target

	messageBundleId: string // TODO replace with reference to message
	messageId: string | undefined
	variantId: string | undefined
	locale: LanguageTag
	// TODO add matcher expression somehow - we want to deactivate lints on a message for a nonexisting variant...
	level: MessageLintLevel
	body: Translatable<string>

	/**
	 * The available fixes that can be automatically applied
	 * Empty array = no automatic fixes
	 */
	fixes: LintFix[]
}

/**
 * The message bundle lint rule API.
 *
 * You can use your own settings by extending the type with a generic:
 *
 * ```ts
 * 	type RuleSettings = {
 *  	filePath: string
 * 	}
 *
 * 	const messageLintRule: MessageLintRule<{
 * 		"messageLintRule.your.id": RuleSettings
 * 	}>
 * ```
 */

export type MessageBundleLintRule<
	ExternalSettings extends Record<keyof ExternalProjectSettings, JSONObject> | unknown = unknown
> = Omit<Static<typeof MessageBundleLintRule>, "settingsSchema"> & {
	settingsSchema?: TObject

	run: (args: {
		messageBundle: MessageBundle
		settings: ProjectSettings2 & ExternalSettings
		report: (args: Omit<LintReport, "ruleId" | "level">) => void
	}) => MaybePromise<void>

	fix?: (args: {
		report: LintReport
		fix: LintFix
		settings: ProjectSettings2 & ExternalSettings
		messageBundle: MessageBundle
	}) => MaybePromise<MessageBundle>
}
export const MessageBundleLintRule = Type.Object({
	id: _MessageBundleLintRuleId,
	displayName: Translatable(Type.String()),
	description: Translatable(Type.String()),

	/*
	for: Type.Union([
		Type.Literal("messageBundle"),
		Type.Literal("message"),
		Type.Literal("variant"),
	]),
	*/

	/**
	 * Tyepbox is must be used to validate the Json Schema.
	 * Github discussion to upvote a plain Json Schema validator and read the benefits of Typebox
	 * https://github.com/opral/monorepo/discussions/1503
	 */
	settingsSchema: Type.Optional(Type.Object({}, { additionalProperties: true })),
})

/**
 * ---------------- UTILITIES ----------------
 */

type MaybePromise<T> = T | Promise<T>
