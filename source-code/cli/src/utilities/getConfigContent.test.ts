import { expect, test } from "vitest"
import { getConfigContent } from "./getConfigContent.js"
import type { SupportedLibrary } from "./getSupportedLibrary.js"

type TestArgs = {
	plugin: SupportedLibrary
	pathPattern: string
}

test("getConfigContent - plugin 'json'", async () => {
	const args: TestArgs = {
		plugin: "json",
		pathPattern: "/path/to/json",
	}

	const configContent = await getConfigContent(args)

	expect(configContent).toContain("jsonPlugin({ pathPattern: '/path/to/json' }),")
	expect(configContent).toContain("standardLintRules()")
})

test("getConfigContent - plugin 'i18next'", async () => {
	const args: TestArgs = {
		plugin: "i18next",
		pathPattern: "/path/to/i18next",
	}

	const configContent = await getConfigContent(args)

	expect(configContent).toContain("i18nextPlugin({ pathPattern: '/path/to/i18next' }),")
	expect(configContent).toContain("standardLintRules()")
})

test("getConfigContent - plugin 'typesafe-i18n'", async () => {
	const args: TestArgs = {
		plugin: "typesafe-i18n",
		pathPattern: "/path/to/typesafe-i18n",
	}

	const configContent = await getConfigContent(args)

	expect(configContent).toContain("typesafeI18nPlugin(),")
	expect(configContent).toContain("standardLintRules()")
})

test("getConfigContent - plugin '@inlang/sdk-js'", async () => {
	const args: TestArgs = {
		plugin: "@inlang/sdk-js",
		pathPattern: "/path/to/sdk-js",
	}

	const configContent = await getConfigContent(args)

	expect(configContent).toContain(
		'sdkPlugin({languageNegotiation: { strategies: [{ type: "localStorage" }]}}),',
	)
	expect(configContent).toContain("standardLintRules()")
})
