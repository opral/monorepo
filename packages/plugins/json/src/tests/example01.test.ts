/*
Test 1
- nested json files
- two languages
- ignored '.eslintrc.json' file
- parse {} as placeholder
- spacing 2
- ignore dot in the end of key
*/

import { expect, test } from "vitest"
import { mockEnvironment } from "@inlang/core/test"
import { setupConfig } from "@inlang/core/config"
import fs from "node:fs/promises"

test("inlang's config validation should pass", async () => {
	const env = await mockEnvironment({
		copyDirectory: {
			fs: fs,
			paths: ["./dist", "./examples/example01"],
		},
	})

	const module = await import("../../examples/example01/inlang.config.js")
	const config = await setupConfig({ module, env })

	expect(config).toBeDefined()

	//custom test
	const resources = await config.readResources({ config })
	expect(JSON.stringify(resources) === JSON.stringify(referenceResources)).toBe(true)
})

// reference resources ----------------------------------------------

const referenceResources = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "de" },
		body: [
			{
				type: "Message",
				metadata: { keyName: "title" },
				id: { type: "Identifier", name: "title" },
				pattern: {
					type: "Pattern",
					elements: [
						{
							type: "Placeholder",
							body: { type: "VariableReference", name: "appName" },
						},
					],
				},
			},
			{
				type: "Message",
				metadata: { keyName: "description" },
				id: { type: "Identifier", name: "description" },
				pattern: {
					type: "Pattern",
					elements: [
						{
							type: "Placeholder",
							body: { type: "VariableReference", name: "appName" },
						},
						{ type: "Text", value: " ist cool." },
					],
				},
			},
			{
				type: "Message",
				metadata: { parentKeys: ["nav"], keyName: "home" },
				id: { type: "Identifier", name: "nav.home" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Startseite" }],
				},
			},
			{
				type: "Message",
				metadata: { parentKeys: ["nav"], keyName: "about" },
				id: { type: "Identifier", name: "nav.about" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Ueber uns" }],
				},
			},
			{
				type: "Message",
				metadata: { keyName: "dumpKey_is_with_dot." },
				id: { type: "Identifier", name: "dumpKey_is_with_dot." },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Der Schluessel hat einen Punkt." }],
				},
			},
		],
	},
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { keyName: "title" },
				id: { type: "Identifier", name: "title" },
				pattern: {
					type: "Pattern",
					elements: [
						{
							type: "Placeholder",
							body: { type: "VariableReference", name: "appName" },
						},
					],
				},
			},
			{
				type: "Message",
				metadata: { keyName: "description" },
				id: { type: "Identifier", name: "description" },
				pattern: {
					type: "Pattern",
					elements: [
						{
							type: "Placeholder",
							body: { type: "VariableReference", name: "appName" },
						},
						{ type: "Text", value: " is cool." },
					],
				},
			},
			{
				type: "Message",
				metadata: { parentKeys: ["nav"], keyName: "home" },
				id: { type: "Identifier", name: "nav.home" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Home" }],
				},
			},
			{
				type: "Message",
				metadata: { parentKeys: ["nav"], keyName: "about" },
				id: { type: "Identifier", name: "nav.about" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "About" }],
				},
			},
			{
				type: "Message",
				metadata: { keyName: "dumpKey_is_with_dot." },
				id: { type: "Identifier", name: "dumpKey_is_with_dot." },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "The key has a dot." }],
				},
			},
		],
	},
]
