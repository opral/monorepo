import { Translatable } from "@inlang/translatable"
import {
	Type,
	type Static,
	type TLiteral,
	type TObject,
	type TTemplateLiteral,
} from "@sinclair/typebox"
import type { JSONObject } from "@inlang/json-types"

// import type { MessageBundle } from "./message-bundle.js"
import { LanguageTag } from "./language-tag.js"
import type { ExternalProjectSettings, ProjectSettings2 } from "./project-settings.js"
import type { NestedBundle } from "./schema.js"

// export type LintResult = {
// 	// TODO SDK 2 add property for report type - if is not specific for lint results?
// 	[id: MessageBundle["id"]]: {
// 		hash: string
// 		reports: LintReport[]
// 	}
// }

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
	// TODO SDK-v2 LINT Rename to LintSettings
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

type LintFix = { key: string; title: string }
const LintFix = Type.Object({
	key: Type.String(),
	title: Type.String(),
})

/**
 * The basis of a lint report (required to contruct a lint report union type)
 */
export const LintReport = Type.Object({
	ruleId: Type.String(),

	// TODO SDK-v2 LINT check if we should provide a lint target
	target: Type.Object({
		bundleId: Type.String(),
		messageId: Type.Optional(Type.String()),
		variantId: Type.Optional(Type.String()),
	}),

	level: MessageLintLevel,
	body: Translatable(Type.String()),

	/**
	 * The available fixes that can be automatically applied
	 * Empty array = no automatic fixes
	 */
	fixes: Type.Array(LintFix),
})

export type LintReport<Fixes extends LintFix[] = LintFix[]> = {
	ruleId: MessageBundleLintRule["id"]

	// TODO SDK-v2 LINT check if we should provide a lint target
	target: {
		bundleId: string
		messageId: string | undefined
		variantId: string | undefined
	}
	// locale: LanguageTag | undefined

	level: MessageLintLevel
	body: Translatable<string>

	/**
	 * The available fixes that can be automatically applied
	 * Empty array = no automatic fixes
	 */
	fixes: Fixes
}

/**
 * Gets the allowed fixes type for a given report
 */
export type Fix<Report extends LintReport> = Report["fixes"][number]

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
		messageBundle: NestedBundle
		settings: ProjectSettings2 & ExternalSettings
		report: (args: Omit<LintReport, "ruleId" | "level">) => void
	}) => MaybePromise<void>

	fix?: <Report extends LintReport>(args: {
		report: Report
		fix: Fix<Report>
		settings: ProjectSettings2 & ExternalSettings
		messageBundle: NestedBundle
	}) => MaybePromise<NestedBundle>
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
