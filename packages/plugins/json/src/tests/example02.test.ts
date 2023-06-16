/*
Test 2
- prefixed json files (i18next structure)
- two languages
- ignored '.eslintrc.json' file
- parse {{}} as placeholder
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
			paths: ["./dist", "./examples/example02"],
		},
	})

	const module = await import("../../examples/example02/inlang.config.js")
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
		metadata: { space: 4 },
		languageTag: { type: "LanguageTag", name: "de" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "common", keyName: "title" },
				id: { type: "Identifier", name: "common.title" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Wow" }],
				},
			},
			{
				type: "Message",
				metadata: { fileName: "vital", keyName: "title" },
				id: { type: "Identifier", name: "vital.title" },
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
				metadata: { fileName: "vital", parentKeys: ["nav"], keyName: "home" },
				id: { type: "Identifier", name: "vital.nav.home" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Startseite" }],
				},
			},
		],
	},
	{
		type: "Resource",
		metadata: { space: 4 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { fileName: "common", keyName: "title" },
				id: { type: "Identifier", name: "common.title" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Wow" }],
				},
			},
			{
				type: "Message",
				metadata: { fileName: "vital", keyName: "title" },
				id: { type: "Identifier", name: "vital.title" },
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
				metadata: { fileName: "vital", parentKeys: ["nav"], keyName: "home" },
				id: { type: "Identifier", name: "vital.nav.home" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "Home" }],
				},
			},
		],
	},
]
