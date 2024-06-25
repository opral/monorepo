import { Translatable } from "@inlang/translatable"
import { Type, type Static, type TObject } from "@sinclair/typebox"
import type { JSONObject } from "@inlang/json-types"

import type { MessageBundle } from "./message-bundle.js"
import { LanguageTag } from "./language-tag.js"
import {
	ExternalProjectSettings,
	ProjectSettings2,
	_MessageLintRuleId,
	_MessageLintRuleLevel,
} from "./project-settings.js"

export type MessageLintLevel = Static<typeof MessageLintLevel>
export const MessageLintLevel = _MessageLintRuleLevel

/**
 * Lint configuration for a given bundle/message/variant
 */
export const LintConfig = Type.Object({
	id: Type.String({ description: "id of the lint config entry" }),
	ruleId: _MessageLintRuleId,
	bundleId: Type.Optional(Type.String()),
	messageId: Type.Optional(Type.String()),
	messageLocale: Type.Optional(LanguageTag),
	variantId: Type.Optional(Type.String()),
	level: MessageLintLevel,
})
export type LintConfig = Static<typeof LintConfig>

/**
 * The basis of a lint report (required to contruct a lint report union type)
 */
export type LintReport = {
	ruleId: MessageBundleLintRule["id"]
	messageBundleId: string // TODO replace with reference to message
	messageId: string
	variantId: string
	locale: LanguageTag
	// TODO add matcher expression somehow - we want to deactivate lints on a message for a nonexisting variant...
	level: MessageLintLevel
	body: Translatable<string>
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
}
export const MessageBundleLintRule = Type.Object({
	id: _MessageLintRuleId,
	displayName: Translatable(Type.String()),
	description: Translatable(Type.String()),
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
