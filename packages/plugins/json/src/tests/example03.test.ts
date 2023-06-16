/*
Test 3
- flattened keys without prefix
- two languages
- ignored 'test.json' file
- parse @: as placeholder
- spacing 4
*/

import { expect, test } from "vitest"
import { mockEnvironment } from "@inlang/core/test"
import { setupConfig } from "@inlang/core/config"
import fs from "node:fs/promises"

test("inlang's config validation should pass", async () => {
	const env = await mockEnvironment({
		copyDirectory: {
			fs: fs,
			paths: ["./dist", "./examples/example03"],
		},
	})

	const module = await import("../../examples/example03/inlang.config.js")
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
				metadata: { keyName: "nav.home" },
				id: { type: "Identifier", name: "nav.home" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Startseite" }],
				},
			},
			{
				type: "Message",
				metadata: { keyName: "nav.about" },
				id: { type: "Identifier", name: "nav.about" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Ueber uns" }],
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
				metadata: { keyName: "nav.home" },
				id: { type: "Identifier", name: "nav.home" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Home" }],
				},
			},
			{
				type: "Message",
				metadata: { keyName: "nav.about" },
				id: { type: "Identifier", name: "nav.about" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "About" }],
				},
			},
		],
	},
]
