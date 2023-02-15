import { describe, expect, test } from "vitest";
import type { LintedMessage, LintedPattern, LintedResource, LintLevel, LintReport } from './context.js';
import { getAllLintErrors, getAllLintErrorsWithId, getAllLintReports, getAllLintReportsByLevel, getAllLintReportsWithId, getAllLintWarnings, getAllLintWarningsWithId, hasLintErrors, hasLintErrorsWithId, hasLintReports, hasLintReportsWithId, hasLintWarnings, hasLintWarningsWithId } from './query.js';
import type { LintableNode, LintRuleId } from './rule.js';

const createReport = (id: LintRuleId, level: LintLevel) => ({
	id,
	level,
	message: '',
} satisfies LintReport)

const createLintedResource = (language: string, lint: LintReport[] | undefined, ...messages: LintedMessage[]) => ({
	type: "Resource",
	languageTag: {
		type: "LanguageTag",
		name: language,
	},
	body: messages,
	lint,
} satisfies LintedResource)

const createLintedMessage = (id: string, lint: LintReport[] | undefined, pattern: LintedPattern) => ({
	type: "Message",
	id: { type: "Identifier", name: id },
	pattern: pattern,
	lint,
} satisfies LintedMessage)

const createLintedPattern = (lint: LintReport[] | undefined) => ({
	type: "Pattern",
	elements: [],
	lint,
} satisfies LintedPattern)

const pattern = createLintedPattern([
	createReport('id.1', 'error'),
	createReport('id.2', 'warn'),
	createReport('id.4', 'warn'),
])

const pattern2 = createLintedPattern([
	createReport('id.2', 'warn'),
])

const pattern3 = createLintedPattern(undefined)

const message = createLintedMessage(
	'message-1',
	[
		createReport('id.3', 'error'),
		createReport('id.1', 'warn'),
		createReport('id.4', 'warn'),
	],
	pattern,
)

const message2 = createLintedMessage(
	'message-2',
	[
		createReport('id.3', 'error'),
		createReport('id.5', 'error'),
	],
	pattern2,
)

const message3 = createLintedMessage(
	'message-3',
	undefined,
	pattern3,
)

const resource = createLintedResource(
	'de',
	[
		createReport('id.3', 'error'),
		createReport('id.1', 'warn'),
		createReport('id.4', 'error'),
	],
	message,
	message2,
	message3,
)

const resource2 = createLintedResource(
	'de',
	undefined,
	message3,
)

// --------------------------------------------------------------------------------------------------------------------

describe("getAllLintReports", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getAllLintReports(resource, true)

			expect(reports).toHaveLength(12)
		})

		test("not nested", async () => {
			const reports = getAllLintReports(resource, false)

			expect(reports).toHaveLength(3)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getAllLintReports(message, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getAllLintReports(message, false)

			expect(reports).toHaveLength(3)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getAllLintReports(pattern, true)

			expect(reports).toHaveLength(3)
		})

		test("not nested", async () => {
			const reports = getAllLintReports(pattern, false)

			expect(reports).toHaveLength(3)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getAllLintReports({ type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("getAllLintReportsByLevel", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getAllLintReportsByLevel('error', resource, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getAllLintReportsByLevel('error', resource, false)

			expect(reports).toHaveLength(2)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getAllLintReportsByLevel('error', message, true)

			expect(reports).toHaveLength(2)
		})

		test("not nested", async () => {
			const reports = getAllLintReportsByLevel('error', message, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getAllLintReportsByLevel('error', pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintReportsByLevel('error', pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getAllLintReportsByLevel('warn', { type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

describe("getAllLintErrors", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getAllLintErrors(resource, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getAllLintErrors(resource, false)

			expect(reports).toHaveLength(2)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getAllLintErrors(message, true)

			expect(reports).toHaveLength(2)
		})

		test("not nested", async () => {
			const reports = getAllLintErrors(message, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getAllLintErrors(pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintErrors(pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getAllLintErrors({ type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

describe("getAllLintWarnings", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getAllLintWarnings(resource, true)

			expect(reports).toHaveLength(6)
		})

		test("not nested", async () => {
			const reports = getAllLintWarnings(resource, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getAllLintWarnings(message2, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintWarnings(message2, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getAllLintWarnings(pattern, true)

			expect(reports).toHaveLength(2)
		})

		test("not nested", async () => {
			const reports = getAllLintWarnings(pattern, false)

			expect(reports).toHaveLength(2)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getAllLintWarnings({ type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

// --------------------------------------------------------------------------------------------------------------------

describe("getAllLintReportsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getAllLintReportsWithId('id.3', resource, true)

			expect(reports).toHaveLength(3)
		})

		test("not nested", async () => {
			const reports = getAllLintReportsWithId('id.3', resource, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getAllLintReportsWithId('id.2', message, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintReportsWithId('id.2', message, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getAllLintReportsWithId('id.1', pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintReportsWithId('id.1', pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getAllLintReportsWithId('some.id', { type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

describe("getAllLintErrorsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getAllLintErrorsWithId('id.3', resource, true)

			expect(reports).toHaveLength(3)
		})

		test("not nested", async () => {
			const reports = getAllLintErrorsWithId('id.3', resource, false)

			expect(reports).toHaveLength(1)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getAllLintErrorsWithId('id.2', message, true)

			expect(reports).toHaveLength(0)
		})

		test("not nested", async () => {
			const reports = getAllLintErrorsWithId('id.2', message, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getAllLintErrorsWithId('id.1', pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintErrorsWithId('id.1', pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getAllLintErrorsWithId('some.id', { type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

describe("getAllLintWarningsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			const reports = getAllLintWarningsWithId('id.5', resource, true)

			expect(reports).toHaveLength(0)
		})

		test("not nested", async () => {
			const reports = getAllLintWarningsWithId('id.5', resource, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			const reports = getAllLintWarningsWithId('id.2', message, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintWarningsWithId('id.2', message, false)

			expect(reports).toHaveLength(0)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			const reports = getAllLintWarningsWithId('id.2', pattern, true)

			expect(reports).toHaveLength(1)
		})

		test("not nested", async () => {
			const reports = getAllLintWarningsWithId('id.2', pattern, false)

			expect(reports).toHaveLength(1)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => getAllLintWarningsWithId('some.id', { type: 'unknown' } as unknown as LintableNode)).toThrow()
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
		expect(() => hasLintReports({ type: 'unknown' } as unknown as LintableNode)).toThrow()
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
		expect(() => hasLintErrors({ type: 'unknown' } as unknown as LintableNode)).toThrow()
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
		expect(() => hasLintWarnings({ type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

describe("hasLintReportsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintReportsWithId('id.4', resource, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReportsWithId('id.4', resource, false)).toBe(true)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintReportsWithId('id.4', message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReportsWithId('id.4', message, false)).toBe(true)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintReportsWithId('id.4', pattern, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintReportsWithId('id.4', pattern, false)).toBe(true)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => hasLintReportsWithId('id.1', { type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

describe("hasLintErrorsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintErrorsWithId('id.1', resource2, true)).toBe(false)
		})

		test("not nested", async () => {
			expect(hasLintErrorsWithId('id.1', resource2, false)).toBe(false)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintErrorsWithId('id.1', message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintErrorsWithId('id.1', message, false)).toBe(false)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintErrorsWithId('id.1', pattern, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintErrorsWithId('id.1', pattern, false)).toBe(true)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => hasLintErrorsWithId('id.1', { type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})

describe("hasLintWarningsWithId", async () => {
	describe("'Resource'", async () => {
		test("nested", async () => {
			expect(hasLintWarningsWithId('id.1', resource, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintWarningsWithId('id.1', resource, false)).toBe(true)
		})
	})

	describe("'Message'", async () => {
		test("nested", async () => {
			expect(hasLintWarningsWithId('id.1', message, true)).toBe(true)
		})

		test("not nested", async () => {
			expect(hasLintWarningsWithId('id.1', message, false)).toBe(true)
		})
	})

	describe("'Pattern'", async () => {
		test("nested", async () => {
			expect(hasLintWarningsWithId('id.1', pattern, true)).toBe(false)
		})

		test("not nested", async () => {
			expect(hasLintWarningsWithId('id.1', pattern, false)).toBe(false)
		})
	})

	test("should throw an error if node type does not get handled", async () => {
		expect(() => hasLintWarningsWithId('id.1', { type: 'unknown' } as unknown as LintableNode)).toThrow()
	})
})
