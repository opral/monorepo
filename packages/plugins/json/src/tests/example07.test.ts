/*
Test 7
- Test adding langugaes without messages and metadata
- messages in multible files (like i18next)
*/

import { expect, test } from "vitest"
import { mockEnvironment } from "@inlang/core/test"
import { setupConfig } from "@inlang/core/config"
import fs from "node:fs/promises"
import type * as ast from "@inlang/core/ast"

test("inlang's config validation should pass", async () => {
	const env = await mockEnvironment({
		copyDirectory: {
			fs: fs,
			paths: ["./dist", "./examples/example07"],
		},
	})

	const module = await import("../../examples/example07/inlang.config.js")
	const config = await setupConfig({ module, env })

	expect(config).toBeDefined()

	//custom test
	const resources = await config.readResources({ config })
	expect(JSON.stringify(resources) === JSON.stringify(startResources)).toBe(true)

	//add langugae
	await config.writeResources({ config, resources: beforeAddingLanguage as ast.Resource[] })
	const ressourcesWithAddedLanguage = await config.readResources({ config })
	expect(JSON.stringify(ressourcesWithAddedLanguage) === JSON.stringify(afterAddingLanguage)).toBe(
		true,
	)

	//add message to new language
	await config.writeResources({ config, resources: beforeAddingMessage as ast.Resource[] })
	const ressourcesWithAddedMessage = await config.readResources({ config })
	expect(JSON.stringify(ressourcesWithAddedMessage) === JSON.stringify(afterAddingMessage)).toBe(
		true,
	)
})

// reference resources ----------------------------------------------

const startResources = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "translation", keyName: "message01" },
				id: { type: "Identifier", name: "translation.message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "first" }],
				},
			},
		],
	},
]

const beforeAddingLanguage = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "translation", keyName: "message01" },
				id: { type: "Identifier", name: "translation.message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "first" }],
				},
			},
		],
	},
	{
		type: "Resource",
		languageTag: { type: "LanguageTag", name: "de" },
		body: [],
	},
]

const afterAddingLanguage = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "translation", keyName: "message01" },
				id: { type: "Identifier", name: "translation.message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "first" }],
				},
			},
		],
	},
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "de" },
		body: [],
	},
]

const beforeAddingMessage = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "translation", keyName: "message01" },
				id: { type: "Identifier", name: "translation.message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "first" }],
				},
			},
		],
	},
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "de" },
		body: [
			{
				type: "Message",
				id: { type: "Identifier", name: "translation.message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "erster" }],
				},
			},
		],
	},
]

const afterAddingMessage = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "translation", keyName: "message01" },
				id: { type: "Identifier", name: "translation.message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "first" }],
				},
			},
		],
	},
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "de" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "translation", keyName: "message01" },
				id: { type: "Identifier", name: "translation.message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "erster" }],
				},
			},
		],
	},
]
