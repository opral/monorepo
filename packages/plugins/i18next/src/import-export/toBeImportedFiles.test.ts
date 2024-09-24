import { test, expect } from "vitest"
import { toBeImportedFiles } from "./toBeImportedFiles.js"
import type { PluginSettings } from "../settings.js"
import { PLUGIN_KEY } from "../plugin.js"

test("it should work for a single namespace", async () => {
	const result = await toBeImportedFiles({
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
			"plugin.inlang.i18next": {
				pathPattern: "/translations/{locale}.json",
			},
		},
	})

	expect(result).toEqual([
		{
			locale: "en",
			path: "/translations/en.json",
		},
		{
			locale: "de",
			path: "/translations/de.json",
		},
	])
})

test("it should work for multiple namespaces", async () => {
	const result = await toBeImportedFiles({
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
			"plugin.inlang.i18next": {
				pathPattern: {
					common: "/resources/{locale}/common.json",
					vital: "/resources/{locale}/vital.json",
				},
			} satisfies PluginSettings,
		},
	})

	expect(result).toEqual(
		expect.arrayContaining([
			{
				locale: "en",
				path: "/resources/en/common.json",
				meta: {
					[PLUGIN_KEY]: {
						namespace: "common",
					},
				},
			},
			{
				locale: "de",
				path: "/resources/de/common.json",
				meta: {
					[PLUGIN_KEY]: {
						namespace: "common",
					},
				},
			},
			{
				locale: "en",
				path: "/resources/en/vital.json",
				meta: {
					[PLUGIN_KEY]: {
						namespace: "vital",
					},
				},
			},
			{
				locale: "de",
				path: "/resources/de/vital.json",
				meta: {
					[PLUGIN_KEY]: {
						namespace: "vital",
					},
				},
			},
		])
	)
})

test("returns [] if the pathPattern is not provided", async () => {
	const result = await toBeImportedFiles({
		nodeFs: {} as any,
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
			"plugin.inlang.i18next": {
				// @ts-expect-error - testing defined plugin settings without pathPattern
				"some-other-prop": "value",
				// pathPattern: "/translations/{locale}.json",
			},
		},
	})

	expect(result).toEqual([])
})

test("should work with languageTag as setting for backward compatibility", async () => {
	const result = await toBeImportedFiles({
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
			"plugin.inlang.i18next": {
				pathPattern: "/translations/{languageTag}.json",
			},
		},
	})

	expect(result).toEqual([
		{
			locale: "en",
			path: "/translations/en.json",
		},
		{
			locale: "de",
			path: "/translations/de.json",
		},
	])
})
