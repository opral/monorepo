import { createInlang } from "./app/createInlang.js"
import type { InlangConfig } from "./config/schema.js"
import type { MessageLintRule } from "./lint/api.js"
import type { Plugin_Proposal_2 } from "./plugin/api.js"

// --------------------- LINT RULE ---------------------

const missingMessage: MessageLintRule = {
	id: "inlang.missingMessage",
	displayName: {
		en: "Missing message",
		de: "Fehlende Nachricht",
	},
	defaultLevel: "error",
	message: ({ message, inlang, report }) => {
		for (const languageTag of inlang.config.languageTags) {
			const translation = message.body[languageTag]
			if (!translation) {
				report({
					languageTag,
					messageId: message.id,
					body: {
						'en':`Message "${message.id}" is missing in language tag "${languageTag}".`,
						'de':`Nachricht "${message.id}" fehlt für Sprachtag "${languageTag}".`,
					}
				})
			}
		}
	},
}

// --------------------- PLUGIN ---------------------

export const myPlugin: Plugin_Proposal_2<{ pathPattern: string }> = {
	meta: {
		id: "inlang.myPlugin",
		displayName: "My Plugin",
	},
	setup: () => {
		return {
			extendLanguageTags: () => {
				return ["de"]
			},
			// OMG really nice API. Just pass an array of lint rule objects <3
			addLintRules: () => [missingMessage],
		}
	},
}

// --------------------- APP ---------------------

// --- SETUP ---

// 0. Example config on disk
//   "/hello/inlang.config.json"
const exampleInlangConfig: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	plugins: [
		{ module: "https://example.com/myPlugin.js", options: { pathPattern: "src/**/*.{ts,tsx}" } },
	],
	lint: {
		rules: {
			"inlang.missingMessage": "warning",
		},
	},
}

// 1. Create the app instance
//    - env needs be created
const inlang = createInlang({
	configPath: "/hello/inlang.config.json",
	env: { fs: undefined as any, import: undefined as any },
})

// --- CRUD ---
inlang.messages.query.create({
	data: {
		id: "myMessageId",
		body: {
			en: { pattern: { type: "Pattern", elements: [{ type: "Text", value: "Hello World" }] } },
		},
	},
})

// assuming that get is reactive
const message = inlang.messages.query.get({ where: { id: "myMessageId" } })!

message.body["en-US"] = {
	pattern: {
		type: "Pattern",
		elements: [
			{
				type: "Text",
				value: "Hello World",
			},
		],
	},
}

inlang.messages.query.update({
	where: { id: "myMessageId" },
	data: message,
})

inlang.messages.query.delete({ where: { id: "myMessageId" } })

// --- CONFIG ACCESS ---

inlang.config.sourceLanguageTag
inlang.config.languageTags

// --- LINT ---
inlang.lint.reports.filter((report) => report.level === "error")
inlang.lint.exceptions
