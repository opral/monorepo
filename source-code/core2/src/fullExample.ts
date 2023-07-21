import { createInlang } from "./app/createInlang.js"
import type { InlangConfig } from "./config/schema.js"
import type {  MessageLintRule } from "./lint/api.js"
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
		if (message.languageTag !== inlang.config.sourceLanguageTag) {
			return
		}
		for (const languageTag of inlang.config.languageTags) {
			const translation = inlang.messages.query.get({ where: { id: message.id, languageTag } })
			if (!translation) {
				report({
					languageTag,
					messageId: message.id,
					content: `Message "${message.id}" is missing in language tag "${languageTag}".`,
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
	setup: ({ inlang, options }) => {
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
      "inlang.missingMessage": "warning"
    }
  }
}

// 1. Create the app instance
//    - env needs be created
const inlang = createInlang({
	config,
	env: { fs: undefined as any, import: undefined as any },
})

// --- CRUD ---
inlang.messages.query.create({ id: "myMessageId", languageTag: "en", pattern: [{"type": "Text", value:  "Hello World" }]})

// assuming that get is reactive
const message = inlang.messages.query.get({ where: { id: "myMessageId", languageTag: "en" })

inlang.messages.query.update({ where: { id: "myMessageId", languageTag: "en" }, data: { pattern: [{"type": "Text", value:  "Hello World" }] } })

inlang.messages.query.delete({ where: { id: "myMessageId", languageTag: "en" } })

// --- CONFIG ACCESS ---

inlang.config.sourceLanguageTag
inlang.config.languageTags

// adding a language tag via an app
inlang.config.languageTags = [...inlang.config.languageTags, "de-AT"]

// --- LINT ---
inlang.lint.reports.filter((report) => report.level === "error")
inlang.lint.exceptions

