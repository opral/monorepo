import { createApp } from "./app/createApp.js"
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
	type: "Message",
	message: ({ message, inlang }) => {
		if (message.languageTag !== inlang.config.sourceLanguageTag) {
			return
		}
		// TODO pain to make reports typesafe...
		// - MessageLintReport has a lot of duplicate information
		const reports = []
		for (const languageTag of inlang.config.languageTags) {
			const translation = inlang.messages.query.get({ where: { id: message.id, languageTag } })
			if (!translation) {
				reports.push({
					languageTag,
					messageId: message.id,
					content: `Message "${message.id}" is missing in language tag "${languageTag}".`,
				})
			}
		}
		return reports
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

// 1. The JSON config needs to be read manually.  
//    - an app instance can't know where a config is located
//    - gives apps more freedom to load different configs if desired (testing, etc.)
const config = fs.readFile("./inlang.config.json")

// 2. Create the app instance
//    - env needs be created
const inlang = createApp({
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
//   - config is static. adjusting the config requires a re-initialization of the app.
//     IMHO (@samuelstroschein) that okay. 

inlang.config.sourceLanguageTag
inlang.config.languageTags

// --- LINT ---
inlang.lint.reports.filter((report) => report.level === "error")
inlang.lint.exceptions

