import { createInlang } from "./app/createInlang.js"
import type { InlangConfig } from "@inlang/config"
import type { MessageLintRule } from "./lint/api.js"
import { createVariant } from "./message/utilities.js"
import type { Plugin } from "./plugin/api.js"

// --------------------- LINT RULE ---------------------

const missingMessage: MessageLintRule = {
	id: "inlang.missingMessage",
	displayName: {
		en: "Missing message",
		de: "Fehlende Nachricht",
	},
	defaultLevel: "error",
	message: ({ message, inlang, report }) => {
		for (const languageTag of inlang.config.get().languageTags) {
			const translation = message.body[languageTag]
			if (!translation) {
				report({
					languageTag,
					messageId: message.id,
					body: {
						en: `Message "${message.id}" is missing in language tag "${languageTag}".`,
						de: `Nachricht "${message.id}" fehlt für Sprachtag "${languageTag}".`,
					},
				})
			}
		}
	},
}

// --------------------- PLUGIN ---------------------

export const myPlugin: Plugin<{ pathPattern: string }> = {
	meta: {
		id: "inlang.myPlugin",
		displayName: { en: "My Plugin" },
		description: { en: "My plugin description" },
		keywords: [],
		usedApis: ["addLintRules"],
	},
	setup: () => {
		return {
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
	env: { $fs: undefined as any, $import: undefined as any },
})

// --- CRUD ---
inlang.query.messages.create({
	data: {
		id: "myMessageId",
		expressions: [],
		selectors: [],
		body: {
			en: [{ match: {}, pattern: [{ type: "Text", value: "Hello World" }] }],
		},
	},
})

// assuming that get is reactive
const message = inlang.query.messages.get({ where: { id: "myMessageId" } })!

//add variant to existing message
const updatedMessage = createVariant(message, {
	languageTag: "en-US",
	data: { match: {}, pattern: [{ type: "Text", value: "Hello World" }] },
})

inlang.query.messages.update({
	where: { id: "myMessageId" },
	data: updatedMessage,
})

inlang.query.messages.delete({ where: { id: "myMessageId" } })

// --- CONFIG ACCESS ---

const config = inlang.config.get()

config.sourceLanguageTag
config.languageTags

// --- LINT ---
inlang.lint.reports().filter((report) => report.level === "error")
inlang.lint.exceptions()
