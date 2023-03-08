import { describe, expect, test } from "vitest"
import type {
	LintedMessage,
	LintedPattern,
	LintedResource,
	LintLevel,
	LintReport,
} from "./context.js"
import {
	getLintErrors,
	getLintErrorsWithId,
	getLintReports,
	getLintReportsByLevel,
	getLintReportsWithId,
	getLintWarnings,
	getLintWarningsWithId,
	hasLintErrors,
	hasLintErrorsWithId,
	hasLintReports,
	hasLintReportsWithId,
	hasLintWarnings,
	hasLintWarningsWithId,
} from "./query.js"
import type { LintableNode, LintRuleId } from "./rule.js"

const createReport = (id: LintRuleId, level: LintLevel) =>
	({
		id,
		level,
		message: "",
	} satisfies LintReport)

const createLintedResource = (
	language: string,
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

const resource2 = createLintedResource("de", undefined, message3)

// --------------------------------------------------------------------------------------------------------------------

describe("getLintReports", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getLintReports(resource, true)

			expect(reports).toHaveLength(12)
		})

		test("not nested", async () => {
			const reports = getLintReports(resource, false)

			expect(reports).toHaveLength(3)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getLintReports(message, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getLintReports(message, false)

			expect(reports).toHaveLength(3)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getLintReports(pattern, true)

			expect(reports).toHaveLength(3)
		})

		test("not nested", async () => {
			const reports = getLintReports(pattern, false)

			expect(reports).toHaveLength(3)
		})
	})

	test("should support an array of nodes", async () => {
		const reports = getLintReports([resource, message, pattern])

		expect(reports).toHaveLength(21)
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getLintReports({ type: "unknown" } as unknown as LintableNode)).toThrow()
	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("getLintReportsByLevel", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getLintReportsByLevel("error", resource, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getLintReportsByLevel("error", resource, false)

			expect(reports).toHaveLength(2)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getLintReportsByLevel("error", message, true)

			expect(reports).toHaveLength(2)
		})

		test("not nested", async () => {
			const reports = getLintReportsByLevel("error", message, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getLintReportsByLevel("error", pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintReportsByLevel("error", pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() =>
			getLintReportsByLevel("warn", {
				type: "unknown",
			} as unknown as LintableNode),
		).toThrow()
	})
})

describe("getLintErrors", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getLintErrors(resource, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getLintErrors(resource, false)

			expect(reports).toHaveLength(2)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getLintErrors(message, true)

			expect(reports).toHaveLength(2)
		})

		test("not nested", async () => {
			const reports = getLintErrors(message, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getLintErrors(pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintErrors(pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getLintErrors({ type: "unknown" } as unknown as LintableNode)).toThrow()
	})
})

describe("getLintWarnings", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getLintWarnings(resource, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getLintWarnings(resource, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getLintWarnings(message2, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintWarnings(message2, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getLintWarnings(pattern, true)

			expect(reports).toHaveLength(2)
		})

		test("not nested", async () => {
			const reports = getLintWarnings(pattern, false)

			expect(reports).toHaveLength(2)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getLintWarnings({ type: "unknown" } as unknown as LintableNode)).toThrow()
	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("getLintReportsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getLintReportsWithId("id.3", resource, true)

			expect(reports).toHaveLength(3)
		})

		test("not nested", async () => {
			const reports = getLintReportsWithId("id.3", resource, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getLintReportsWithId("id.2", message, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintReportsWithId("id.2", message, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getLintReportsWithId("id.1", pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintReportsWithId("id.1", pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() =>
			getLintReportsWithId("some.id", {
				type: "unknown",
			} as unknown as LintableNode),
		).toThrow()
	})
})

describe("getLintErrorsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getLintErrorsWithId("id.3", resource, true)

			expect(reports).toHaveLength(3)
		})

		test("not nested", async () => {
			const reports = getLintErrorsWithId("id.3", resource, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getLintErrorsWithId("id.2", message, true)

			expect(reports).toHaveLength(0)
		})

		test("not nested", async () => {
			const reports = getLintErrorsWithId("id.2", message, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getLintErrorsWithId("id.1", pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintErrorsWithId("id.1", pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() =>
			getLintErrorsWithId("some.id", {
				type: "unknown",
			} as unknown as LintableNode),
		).toThrow()
	})
})

describe("getLintWarningsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getLintWarningsWithId("id.5", resource, true)

			expect(reports).toHaveLength(0)
		})

		test("not nested", async () => {
			const reports = getLintWarningsWithId("id.5", resource, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getLintWarningsWithId("id.2", message, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintWarningsWithId("id.2", message, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getLintWarningsWithId("id.2", pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getLintWarningsWithId("id.2", pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() =>
			getLintWarningsWithId("some.id", {
				type: "unknown",
			} as unknown as LintableNode),
		).toThrow()
	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("hasLintReports", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintReports(resource, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReports(resource, false)).toBe(true)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintReports(message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReports(message, false)).toBe(true)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintReports(pattern, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReports(pattern, false)).toBe(true)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => hasLintReports({ type: "unknown" } as unknown as LintableNode)).toThrow()
	})
})

describe("hasLintErrors", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintErrors(resource, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintErrors(resource, false)).toBe(true)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintErrors(message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintErrors(message, false)).toBe(true)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintErrors(pattern, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintErrors(pattern, false)).toBe(true)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => hasLintErrors({ type: "unknown" } as unknown as LintableNode)).toThrow()
	})
})

describe("hasLintWarnings", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintWarnings(resource, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintWarnings(resource, false)).toBe(true)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintWarnings(message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintWarnings(message, false)).toBe(true)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintWarnings(pattern, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintWarnings(pattern, false)).toBe(true)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => hasLintWarnings({ type: "unknown" } as unknown as LintableNode)).toThrow()
	})
})

describe("hasLintReportsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintReportsWithId("id.4", resource, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReportsWithId("id.4", resource, false)).toBe(true)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintReportsWithId("id.4", message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReportsWithId("id.4", message, false)).toBe(true)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintReportsWithId("id.4", pattern, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReportsWithId("id.4", pattern, false)).toBe(true)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() =>
			hasLintReportsWithId("id.1", {
				type: "unknown",
			} as unknown as LintableNode),
		).toThrow()
	})
})

describe("hasLintErrorsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintErrorsWithId("id.1", resource2, true)).toBe(false)
		})

		test("not nested", async () => {
			expect(hasLintErrorsWithId("id.1", resource2, false)).toBe(false)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintErrorsWithId("id.1", message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintErrorsWithId("id.1", message, false)).toBe(false)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintErrorsWithId("id.1", pattern, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintErrorsWithId("id.1", pattern, false)).toBe(true)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() =>
			hasLintErrorsWithId("id.1", {
				type: "unknown",
			} as unknown as LintableNode),
		).toThrow()
	})
})

describe("hasLintWarningsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintWarningsWithId("id.1", resource, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintWarningsWithId("id.1", resource, false)).toBe(true)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintWarningsWithId("id.1", message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintWarningsWithId("id.1", message, false)).toBe(true)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintWarningsWithId("id.1", pattern, true)).toBe(false)
		})

		test("not nested", async () => {
			expect(hasLintWarningsWithId("id.1", pattern, false)).toBe(false)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() =>
			hasLintWarningsWithId("id.1", {
				type: "unknown",
			} as unknown as LintableNode),
		).toThrow()
	})
})
