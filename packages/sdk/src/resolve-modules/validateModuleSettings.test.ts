/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest"
import { Plugin, MessageLintRule } from "@inlang/sdk"
// import { createNodeishMemoryFs } from "@lix-js/fs"
import { Type } from "@sinclair/typebox"
import { validatedModuleSettings } from "./validatedModuleSettings.js"
import { ModuleSettingsAreInvalidError } from "./errors.js"
// TODO  validae tyebox and normal setting schema

const mockPluginSchema: Plugin["settingsSchema"] = Type.Object({
	pathPattern: Type.Union([
		Type.String({
			pattern: "^[^*]*\\{languageTag\\}[^*]*\\.json",
			description: "The PluginSettings must contain `{languageTag}` and end with `.json`.",
		}),
		Type.Record(
			Type.String({}),
			Type.String({
				pattern: "^[^*]*\\{languageTag\\}[^*]*\\.json",
				description: "The PluginSettings must contain `{languageTag}` and end with `.json`.",
			})
		),
	]),
	variableReferencePattern: Type.Array(Type.String()),
})

const mockMessageLintRuleSchema: MessageLintRule["settingsSchema"] = Type.Object({
	ignore: Type.Array(
		Type.String({
			pattern: '([^"]*)',
			description: "All items in the array need quotaion marks at the end and beginning",
		})
	),
})

test("should throw if PluginSchema doesn't match with the Settings", async () => {
	const isValid = await validatedModuleSettings({
		settingsSchema: mockPluginSchema,
		moduleSettings: {
			pathPattern: "./examples/example01/{languageTag}.json",
			variableReferencePattern: ["{", "}"],
		},
	})

	expect(isValid).toBe("isValid")
})

test("should return an error if settings file is does not match plugin Schema", async () => {
	const isValid = validatedModuleSettings({
		settingsSchema: mockPluginSchema,
		moduleSettings: {
			pathPattern: "./examples/example01/{languageTag}.json",
		},
	})

	// TODO we epect an array like this array with objekts
	// [ { type: 6,                                                                                                                                                                                                                 11:19:55 PM
	//     schema:
	//      { type: 'array',
	//        items: [Object],
	//        [Symbol(TypeBox.Kind)]: 'Array',
	//        [Symbol(TypeBox.Optional)]: 'Optional' },
	//     path: '/ignore',
	//     value: 'error',
	//     message: 'Expected array' } ]
	expect(isValid).toBeInstanceOf(ModuleSettingsAreInvalidError)
})

test("should throw if MessageLintRuleSchema doesn't match with the Settiings", async () => {
	const isValid = await validatedModuleSettings({
		settingsSchema: mockMessageLintRuleSchema,
		moduleSettings: {
			ignore: ["example", "warning"],
		},
	})

	expect(isValid).toBe("isValid")
})

test("should return an error if settings file is does not match messageLintRule Schema", async () => {
	const isValid = validatedModuleSettings({
		settingsSchema: mockMessageLintRuleSchema,
		moduleSettings: {
			ignore: "example",
		},
	})

	expect(isValid).toBeInstanceOf(ModuleSettingsAreInvalidError)
})
