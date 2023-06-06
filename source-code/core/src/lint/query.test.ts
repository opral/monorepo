import { describe, expect, test } from "vitest"
import type {
	LintedMessage,
	LintedPattern,
	LintedResource,
	LintRule,
	LintReport,
	LintableNode,
} from "./rule.js"
import { getLintReports, hasLintReports } from "./query.js"
import type { Language } from "../ast/schema.js"

const createReport = (id: LintRule["id"], level: LintRule["level"]) =>
	({
		id,
		level,
		message: "",
	} satisfies LintReport)

const createLintedResource = (
	language: Language,
	lint: LintReport[] | undefined,
	...messages: LintedMessage[]
) =>
	({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: language,
		},
		body: messages,
		lint,
	} satisfies LintedResource)

const createLintedMessage = (id: string, lint: LintReport[] | undefined, pattern: LintedPattern) =>
	({
		type: "Message",
		id: { type: "Identifier", name: id },
		pattern: pattern,
		lint,
	} satisfies LintedMessage)

const createLintedPattern = (lint: LintReport[] | undefined) =>
	({
		type: "Pattern",
		elements: [],
		lint,
	} satisfies LintedPattern)

const pattern = createLintedPattern([
	createReport("id.1", "error"),
	createReport("id.2", "warn"),
	createReport("id.4", "warn"),
])

const pattern2 = createLintedPattern([createReport("id.2", "warn")])

const pattern3 = createLintedPattern(undefined)

const message = createLintedMessage(
	"message-1",
	[createReport("id.3", "error"), createReport("id.1", "warn"), createReport("id.4", "warn")],
	pattern,
)

const message2 = createLintedMessage(
	"message-2",
	[createReport("id.3", "error"), createReport("id.5", "error")],
	pattern2,
)

const message3 = createLintedMessage("message-3", undefined, pattern3)

const resource = createLintedResource(
	"de",
	[createReport("id.3", "error"), createReport("id.1", "warn"), createReport("id.4", "error")],
	message,
	message2,
	message3,
)

describe("getLintReports", async () => {
	describe("'Resource'", async () => {
		test("recursive", async () => {
			const reports = getLintReports(resource)

			expect(reports).toHaveLength(12)
		})

		test("not recursive", async () => {
			const reports = getLintReports(resource, { recursive: false })

			expect(reports).toHaveLength(3)
		})

		test("by level recursive", async () => {
			const reports = getLintReports(resource, { level: "error" })
			expect(reports).toHaveLength(6)
		})

		test("by level not recursive", async () => {
			const reports = getLintReports(resource, { recursive: false, level: "error" })
			expect(reports).toHaveLength(2)
		})

		test("with id recursive", async () => {
			const reports = getLintReports(resource, { id: "id.3" })

			expect(reports).toHaveLength(3)
		})

		test("with id not recursive", async () => {
			const reports = getLintReports(resource, { recursive: false, id: "id.3" })

			expect(reports).toHaveLength(1)
		})

		test("should support an array of nodes", async () => {
			const reports = getLintReports([resource, message, pattern])

			expect(reports).toHaveLength(21)
		})

		test("should throw an error if node type does not get handled", async () => {
			expect(() => hasLintReports({ type: "unknown" } as unknown as LintableNode)).toThrow()
		})
	})

	test("Message", async () => {
		const reports = getLintReports(message)
		expect(reports).toHaveLength(6)
	})

	test("'Pattern'", async () => {
		const reports = getLintReports(pattern)
		expect(reports).toHaveLength(3)
	})
})

test("hasLintReports()", async () => {
	expect(hasLintReports(resource)).toBe(true)
})
