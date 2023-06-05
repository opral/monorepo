import { it, expect } from "vitest"
import { missingTranslations } from "./missingTranslations.js"
import type * as ast from "@inlang/core/ast"
import { createMessage, createResource } from '@inlang/core/test'

it("should return 100% when no translation are missing", () => {
	const resources: ast.Resource[] = [
		createResource("en", createMessage("message-1", [])),
		createResource("de", createMessage("message-1", [])),
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(100)
	expect(result.numberOfMissingTranslations).toBe(0)
})

it("should return 50% when half of the messages are missing", () => {
	const resources: ast.Resource[] = [
		createResource("en", createMessage("message-1", []), createMessage("message-2", [])),
		createResource("de", createMessage("message-1", []))
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(50)
	expect(result.numberOfMissingTranslations).toBe(1)
})

it("should round the percentages", () => {
	const resources: ast.Resource[] = [
		createResource("en", createMessage("message-1", []), createMessage("message-2", []), createMessage("message-3", [])),
		createResource("de", createMessage("message-1", []))
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(67)
	expect(result.numberOfMissingTranslations).toBe(2)
})

it("should work with multiple resources", () => {
	const resources: ast.Resource[] = [
		createResource("en", createMessage("message-1", []), createMessage("message-2", []), createMessage("message-3", [])),
		createResource("de", createMessage("message-1", [])),
		createResource("fr", createMessage("message-2", []))
	]
	const result = missingTranslations({ resources, referenceResource: resources[0]! })
	expect(result.percentage).toBe(67)
	expect(result.numberOfMissingTranslations).toBe(4)
})
