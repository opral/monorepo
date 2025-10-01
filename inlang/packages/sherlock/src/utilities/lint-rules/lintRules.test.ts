import { describe, it, expect, vi } from "vitest"
import {
	missingMessage,
	bundleWithoutMessageWithBaseLocale,
	variantWithEmptyPattern,
	invalidJSIdentifier,
	type LintResult,
} from "./lintRules.js"
import { selectBundleNested } from "@inlang/sdk"

// Mocking state and selectBundleNested
vi.mock("../state.js", () => {
	const mockStateValue = {
		project: {
			db: {},
			settings: {
				get: vi.fn(() =>
					Promise.resolve({
						locales: ["en", "fr"],
						baseLocale: "en",
					})
				),
			},
		},
	}

	const stateFn = vi.fn(() => mockStateValue)
	return {
		state: stateFn,
		safeState: stateFn,
	}
})

vi.mock("@inlang/sdk", () => ({
	selectBundleNested: vi.fn(),
}))

vi.mock("vscode", () => ({
	window: {
		createOutputChannel: vi.fn(),
	},
	DiagnosticSeverity: {
		Error: 1,
		Warning: 2,
		Information: 3,
		Hint: 4,
	},
}))

describe("Lint Rules", () => {
	// Test for missingMessage lint rule
	it("should return missing messages if no messages for some locales or variants are empty", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "bundle1",
					messages: [
						{ id: "msg1", locale: "en", variants: [] },
						{ id: "msg2", locale: "fr", variants: [{ pattern: "text" }] },
					],
				}),
			}),
		})

		const result = await missingMessage("bundle1")
		expect(result).toEqual<LintResult[]>([
			{
				bundleId: "bundle1",
				messageId: "msg1",
				messageLocale: "en",
				code: "missingMessage",
				description: "Message with locale en is missing the bundle with id bundle1",
			},
		])
	})

	it("should return an empty array if all messages have correct locales and variants", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "bundle1",
					messages: [
						{ id: "msg1", locale: "en", variants: [{ pattern: "text" }] },
						{ id: "msg2", locale: "fr", variants: [{ pattern: "text" }] },
					],
				}),
			}),
		})

		const result = await missingMessage("bundle1")
		expect(result).toEqual([])
	})

	// Test for bundleWithoutMessageWithBaseLocale lint rule
	it("should return missing baseLocale messages if no variants for baseLocale", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "bundle1",
					messages: [
						{ id: "msg1", locale: "en", variants: [] },
						{ id: "msg2", locale: "fr", variants: [{ pattern: "text" }] },
					],
				}),
			}),
		})

		const result = await bundleWithoutMessageWithBaseLocale("bundle1")
		expect(result).toEqual<LintResult[]>([
			{
				bundleId: "bundle1",
				messageId: "msg1",
				messageLocale: "en",
				code: "bundleWithoutMessageWithBaseLocale",
				description: "Bundle with id bundle1 is missing a message with the base locale en",
			},
		])
	})

	it("should return an empty array if baseLocale messages have variants", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "bundle1",
					messages: [
						{ id: "msg1", locale: "en", variants: [{ pattern: "text" }] },
						{ id: "msg2", locale: "fr", variants: [{ pattern: "text" }] },
					],
				}),
			}),
		})

		const result = await bundleWithoutMessageWithBaseLocale("bundle1")
		expect(result).toEqual([])
	})

	// Test for variantWithEmptyPattern lint rule
	it("should return messages with variants that have empty patterns", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "bundle1",
					messages: [
						{ id: "msg1", locale: "en", variants: [{ pattern: "" }] },
						{ id: "msg2", locale: "fr", variants: [{ pattern: "text" }] },
					],
				}),
			}),
		})

		const result = await variantWithEmptyPattern("bundle1")
		expect(result).toEqual<LintResult[]>([
			{
				bundleId: "bundle1",
				messageId: "msg1",
				messageLocale: "en",
				code: "variantWithEmptyPattern",
				description: "Variant with empty pattern in message with id msg1 and locale en",
			},
		])
	})

	it("should return an empty array if no variants have empty patterns", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "bundle1",
					messages: [
						{ id: "msg1", locale: "en", variants: [{ pattern: "text" }] },
						{ id: "msg2", locale: "fr", variants: [{ pattern: "text" }] },
					],
				}),
			}),
		})

		const result = await variantWithEmptyPattern("bundle1")
		expect(result).toEqual([])
	})

	// Test for invalidJSIdentifier lint rule
	it("should return issue if bundleId is not a valid JS identifier", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "1-invalid-id",
				}),
			}),
		})

		const result = await invalidJSIdentifier("bundle1")
		expect(result).toEqual<LintResult[]>([
			{
				bundleId: "bundle1",
				code: "invalidJSIdentifier",
				description: "Bundle id bundle1 is not a valid JS identifier",
			},
		])
	})

	it("should return an empty array if bundleId is a valid JS identifier", async () => {
		;(selectBundleNested as any).mockReturnValue({
			where: vi.fn().mockReturnValue({
				executeTakeFirst: vi.fn().mockResolvedValue({
					id: "validId",
				}),
			}),
		})

		const result = await invalidJSIdentifier("bundle1")
		expect(result).toEqual([])
	})
})
