import { beforeEach, describe, expect, type MockContext, test, vi } from "vitest"
import type { Identifier, LanguageTag, Message } from "../ast/schema.js"
import type { LintedMessage, LintedResource, LintReport } from "./rule.js"
import { print, printReport } from "./output.js"

const report: LintReport = {
	id: "lint.rule",
	level: "error",
	message: "Something went wrong",
}

const reportWithMetadata: LintReport = {
	id: "lint.rule2",
	level: "warn",
	message: "Something went wrong again",
}

vi.spyOn(console, "warn").mockImplementation(vi.fn)
vi.spyOn(console, "error").mockImplementation(vi.fn)
vi.spyOn(console, "info").mockImplementation(vi.fn)

beforeEach(() => {
	vi.resetAllMocks()
})

describe("printReport", async () => {
	test("should not print anything if no report get's passed", async () => {
		printReport(undefined as unknown as LintReport)

		expect(console.warn).not.toHaveBeenCalled()
		expect(console.error).not.toHaveBeenCalled()
	})

	describe("information should include", async () => {
		test("level", async () => {
			printReport(report)

			expect((console.error as unknown as MockContext<string[], void>).calls[0]![0]).toContain(
				"[error]",
			)
		})

		test("id", async () => {
			printReport(report)

			expect((console.error as unknown as MockContext<string[], void>).calls[0]![0]).toContain(
				`(${report.id})`,
			)
		})

		test("message", async () => {
			printReport(reportWithMetadata)

			expect((console.warn as unknown as MockContext<string[], void>).calls[0]![0]).toContain(
				`${reportWithMetadata.message}`,
			)
		})
	})

	describe("level", async () => {
		test("should use `console.error` on 'error'", async () => {
			printReport(report)

			expect(console.warn).not.toHaveBeenCalled()
			expect(console.error).toHaveBeenCalledOnce()
		})

		test("should use `console.warn` on 'warn'", async () => {
			printReport(reportWithMetadata)

			expect(console.error).not.toHaveBeenCalled()
			expect(console.warn).toHaveBeenCalledOnce()
		})

		test("should allow to override the log level", async () => {
			printReport(report, "info")

			expect(console.warn).not.toHaveBeenCalled()
			expect(console.error).not.toHaveBeenCalled()
			expect(console.info).toHaveBeenCalledOnce()
		})
	})
})

// --------------------------------------------------------------------------------------------------------------------

const lintedResource: LintedResource = {
	type: "Resource",
	languageTag: { name: "en" } as LanguageTag,
	lint: [report],
	body: [
		{
			type: "Message",
			id: { name: "message-1" } as Identifier,
			lint: [reportWithMetadata],
			pattern: {
				type: "Pattern",
				lint: [report],
				elements: [],
			},
		},
	],
}

describe("print", async () => {
	describe("Resource", async () => {
		test("should not proceed if resource has no lint reports", async () => {
			print({ type: "Resource", body: [] as Message[] } as LintedResource)

			expect(console.info).toHaveBeenCalledTimes(0)
		})

		test("should print a separator for a resource", async () => {
			print(lintedResource)

			expect((console.info as unknown as MockContext<string[], void>).calls[0]![0]).toContain(
				"Resource",
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[0]![0]).toContain(
				lintedResource.languageTag.name,
			)
		})

		test("should print all reports for the current node", async () => {
			print(lintedResource)

			expect((console.info as unknown as MockContext<string[], void>).calls[1]![0]).toContain(
				`[${lintedResource.lint![0]!.level}]`,
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[1]![0]).toContain(
				`(${lintedResource.lint![0]!.id})`,
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[1]![0]).toContain(
				lintedResource.lint![0]!.message,
			)
		})
	})

	describe("Message", async () => {
		test("should not proceed if message has no lint reports", async () => {
			print({
				type: "Resource",
				languageTag: { name: "en" } as LanguageTag,
				lint: [{}],
				body: [{ type: "Message", pattern: {} }] as LintedMessage[],
			} as LintedResource)

			expect(console.info).toHaveBeenCalledTimes(2)
		})

		test("should print a separator for a message", async () => {
			print(lintedResource)

			expect((console.info as unknown as MockContext<string[], void>).calls[2]![0]).toContain(
				"Resource",
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[2]![0]).toContain(
				lintedResource.languageTag.name,
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[2]![0]).toContain(
				"Message",
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[2]![0]).toContain(
				lintedResource.body[0]!.id.name,
			)
		})

		test("should print all reports for the current node", async () => {
			print(lintedResource)

			expect((console.info as unknown as MockContext<string[], void>).calls[3]![0]).toContain(
				`[${lintedResource.body[0]!.lint![0]!.level}]`,
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[3]![0]).toContain(
				`(${lintedResource.body[0]!.lint![0]!.id})`,
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[3]![0]).toContain(
				lintedResource.body[0]!.lint![0]!.message,
			)
		})
	})

	describe("Pattern", async () => {
		test("should not proceed if pattern has no lint reports", async () => {
			print({
				type: "Resource",
				languageTag: { name: "en" } as LanguageTag,
				body: [
					{ type: "Message", id: {}, lint: [{}], pattern: { type: "Pattern" } },
				] as LintedMessage[],
			} as LintedResource)

			expect(console.info).toHaveBeenCalledTimes(3)
		})

		test("should print all reports for the current node", async () => {
			print(lintedResource)

			expect((console.info as unknown as MockContext<string[], void>).calls[4]![0]).toContain(
				`[${lintedResource.body[0]!.pattern.lint![0]!.level}]`,
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[4]![0]).toContain(
				`(${lintedResource.body[0]!.pattern.lint![0]!.id})`,
			)
			expect((console.info as unknown as MockContext<string[], void>).calls[4]![0]).toContain(
				lintedResource.body[0]!.pattern.lint![0]!.message,
			)
		})
	})
})
