/*
Test 7
- Test adding langugaes without messages and metadata
- messages in single file
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
			paths: ["./dist", "./examples/example08"],
		},
	})

	const module = await import("../../examples/example08/inlang.config.js")
	const config = await setupConfig({ module, env })

	expect(config).toBeDefined()

	//custom test
	const resources = await config.readResources({ config })
	expect(JSON.stringify(resources) === JSON.stringify(referenceResources)).toBe(true)

	//add langugae
	await config.writeResources({ config, resources: referenceResourcesNew as ast.Resource[] })
	const resourcesNew = await config.readResources({ config })
	expect(JSON.stringify(resourcesNew) === JSON.stringify(referenceResourcesNewExpected)).toBe(true)
})

// reference resources ----------------------------------------------

const referenceResources = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { keyName: "message01" },
				id: { type: "Identifier", name: "message01" },
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "first" }],
				},
			},
		],
	},
]

const referenceResourcesNew = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { keyName: "message01" },
				id: { type: "Identifier", name: "message01" },
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

const referenceResourcesNewExpected = [
	{
		type: "Resource",
		metadata: { space: 2 },
		languageTag: { type: "LanguageTag", name: "en" },
		body: [
			{
				type: "Message",
				metadata: { keyName: "message01" },
				id: { type: "Identifier", name: "message01" },
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
