import { beforeEach, describe, expect, type MockContext, test, vi } from "vitest";
import type { LintReport } from './context.js';
import { printReport } from './output.js';

const report: LintReport = {
	id: 'lint.rule',
	level: 'error',
	message: 'Something went wrong',
}

const reportWithMetadata: LintReport = {
	id: 'lint.rule2',
	level: 'warn',
	message: 'Something went wrong again',
	metadata: { foo: 'bar', }
}

vi.spyOn(console, 'warn').mockImplementation(vi.fn)
vi.spyOn(console, 'error').mockImplementation(vi.fn)

describe("printReport", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	test("should not print anything if no report get's passed", async () => {
		printReport(undefined as unknown as LintReport)

		expect(console.warn).not.toHaveBeenCalled()
		expect(console.error).not.toHaveBeenCalled()
	})

	describe("information should include", async () => {
		test("level", async () => {
			printReport(report)

			expect((console.error as unknown as MockContext<string[], void>).calls[0][0])
				.toContain('[error]')
		})

		test("id", async () => {
			printReport(report)

			expect((console.error as unknown as MockContext<string[], void>).calls[0][0])
				.toContain(`(${report.id})`)
		})

		test("message", async () => {
			printReport(reportWithMetadata)

			expect((console.warn as unknown as MockContext<string[], void>).calls[0][0])
				.toContain(`${reportWithMetadata.message}`)
		})

		test("no metadata if not present", async () => {
			printReport(report)

			expect((console.error as unknown as MockContext<string[], void>).calls[0][0])
				.not.toContain(`foo`)
		})

		test("metadata if present", async () => {
			printReport(reportWithMetadata)

			expect((console.warn as unknown as MockContext<string[], void>).calls[0][1])
				.toContain(reportWithMetadata.metadata)
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
	})
})
