import type { InlangApp } from "../app/api.js"
import type { LanguageTag } from "../languageTag.js"
import type { LintRule } from "../lint/api.js"
import type { Message } from "../messages/schema.js"

/**
 * Proposal 1
 *
 * Setup function everything in one.
 *
 * + simple to use
 * - no access to static props.
 *   if a plugin crashes during setup -> complicated to show plugin with "id" crashed.
 */
export type Plugin_Proposal_1<Options extends Record<string, string> = Record<string, never>> =
	(args: { options: Options; inlang: InlangApp }) => {
		id: `${string}.${string}`
		displayName: string
		extendLanguageTags?: () => LanguageTag[]
		loadMessages?: () => Message[]
		saveMessages?: (args: { messages: Message[] }) => void
		addLintRules?: () => LintRule[]
	}

export const example1: Plugin_Proposal_1<{ pathPattern: string }> = ({ options, inlang }) => {
	return {
		id: "inlang.myPlugin",
		displayName: "My Plugin",
		extendLanguageTags: () => {
			return ["en-US"]
		},
		loadMessages: () => {
			for (const languageTag of inlang.config.languageTags) {
				console.log(languageTag + options.pathPattern)
			}
			return []
		},
		saveMessages: ({ messages }) => {
			console.log(messages)
		},
	}
}

/**
 * Proposal 2
 *
 * Split static meta data from setup function.
 *
 * + access to static without crash chance
 * - arguably not so nice API.
 */
export type Plugin_Proposal_2<Options extends Record<string, string> = Record<string, never>> = {
	meta: {
		id: `${string}.${string}`
		displayName: string
	}
	setup: (args: { options: Options; inlang: InlangApp }) => {
		extendLanguageTags?: () => LanguageTag[]
		loadMessages?: () => Message[]
		saveMessages?: (args: { messages: Message[] }) => void
		addLintRules?: () => LintRule[]
	}
}

export const example2: Plugin_Proposal_2<{ pathPattern: string }> = {
	meta: {
		id: "inlang.myPlugin",
		displayName: "My Plugin",
	},
	setup: ({ inlang, options }) => {
		return {
			extendLanguageTags: () => {
				return ["en-US"]
			},
			loadMessages: () => {
				for (const languageTag of inlang.config.languageTags) {
					console.log(languageTag + options.pathPattern)
				}
				return []
			},
			saveMessages: ({ messages }) => {
				console.log(messages)
			},
		}
	},
}
