import { it, expect } from "vitest"
import { missingTranslations } from "./missingTranslations.js"
import type * as ast from "@inlang/core/ast"

it("should return 100% when no translation are missing", () => {
	const resources: ast.Resource[] = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "de",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(100)
	expect(result.numberOfMissingTranslations).toBe(0)
})

it("should return 50% when half of the messages are missing", () => {
	const resources: ast.Resource[] = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-2",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "de",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(50)
	expect(result.numberOfMissingTranslations).toBe(1)
})

it("should round the percentages", () => {
	const resources: ast.Resource[] = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-2",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-3",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "de",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(67)
	expect(result.numberOfMissingTranslations).toBe(2)
})

it("should work with multiple resources", () => {
	const resources: ast.Resource[] = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-2",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-3",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "de",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-1",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "fr",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "message-2",
					},
					pattern: {
						type: "Pattern",
						elements: [],
					},
				},
			],
		},
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(67)
	expect(result.numberOfMissingTranslations).toBe(4)
})
