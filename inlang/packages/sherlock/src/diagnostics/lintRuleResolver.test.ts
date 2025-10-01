/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
	resolveLintRules,
	mapSeverity,
	getModuleNameFromPath,
	wrapLintRuleWithSeverity,
} from "./lintRuleResolver.js"
import { state } from "../utilities/state.js"
import * as vscode from "vscode"

// mock vscode
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

// Mocking necessary utilities
vi.mock("../utilities/state.js", () => {
	const stateFn = vi.fn()
	return {
		state: stateFn,
		safeState: stateFn,
	}
})

vi.mock("../utilities/lint-rules/lintRules.js", () => ({
	missingMessage: vi.fn(() => Promise.resolve([])),
	bundleWithoutMessageWithBaseLocale: vi.fn(() => Promise.resolve([])),
	variantWithEmptyPattern: vi.fn(() => Promise.resolve([])),
	invalidJSIdentifier: vi.fn(() => Promise.resolve([])),
	identicalPattern: vi.fn(() => Promise.resolve([])),
}))

describe("mapSeverity", () => {
	it("should map 'error' to vscode.DiagnosticSeverity.Error", () => {
		expect(mapSeverity("error")).toBe(vscode.DiagnosticSeverity.Error)
	})

	it("should map 'warning' to vscode.DiagnosticSeverity.Warning", () => {
		expect(mapSeverity("warning")).toBe(vscode.DiagnosticSeverity.Warning)
	})

	it("should map unrecognized severity to vscode.DiagnosticSeverity.Information", () => {
		expect(mapSeverity("info")).toBe(vscode.DiagnosticSeverity.Information)
		expect(mapSeverity("unknown")).toBe(vscode.DiagnosticSeverity.Information)
	})
})

describe("getModuleNameFromPath", () => {
	it("should extract the module name from the path", () => {
		expect(
			getModuleNameFromPath("/source-code/message-lint-rules/missingTranslation/dist/index.js")
		).toBe("missingTranslation")
		expect(
			getModuleNameFromPath("/source-code/message-lint-rules/emptyPattern/dist/index.js")
		).toBe("emptyPattern")
	})

	it("should return an empty string if no file name is present", () => {
		expect(getModuleNameFromPath("")).toBe("")
	})
})

describe("wrapLintRuleWithSeverity", () => {
	it("should wrap a lint rule and inject severity", async () => {
		const mockLintRule = vi.fn(() =>
			Promise.resolve([{ bundleId: "1", code: "test", description: "Test" }])
		)
		const wrappedRule = wrapLintRuleWithSeverity(mockLintRule, "error")

		const results = await wrappedRule("1")

		expect(results).toEqual([
			{
				bundleId: "1",
				code: "test",
				description: "Test",
				severity: vscode.DiagnosticSeverity.Error,
			},
		])

		expect(mockLintRule).toHaveBeenCalledWith("1")
	})

	it("should handle severity as 'warning'", async () => {
		const mockLintRule = vi.fn(() =>
			Promise.resolve([{ bundleId: "2", code: "test-warning", description: "Test Warning" }])
		)
		const wrappedRule = wrapLintRuleWithSeverity(mockLintRule, "warning")

		const results = await wrappedRule("2")

		expect(results).toEqual([
			{
				bundleId: "2",
				code: "test-warning",
				description: "Test Warning",
				severity: vscode.DiagnosticSeverity.Warning,
			},
		])

		expect(mockLintRule).toHaveBeenCalledWith("2")
	})
})

describe("resolveLintRules", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should resolve lint rules with correct severities", async () => {
		// Mock settings to return valid modules and rule levels
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({
						modules: [
							"/source-code/message-lint-rules/missingTranslation/dist/index.js",
							"/source-code/message-lint-rules/emptyPattern/dist/index.js",
							"/source-code/message-lint-rules/identicalPattern/dist/index.js",
							"/source-code/message-lint-rules/messageWithoutSource/dist/index.js",
						],
						messageLintRuleLevels: {
							"messageLintRule.inlang.missingTranslation": "warning",
							"messageLintRule.inlang.identicalPattern": "error",
							"messageLintRule.inlang.messageWithoutSource": "warning",
						},
					}),
				},
			},
		})

		const lintRules = await resolveLintRules()

		expect(lintRules.length).toBe(4)
		expect(lintRules[0]!.name).toBe("missingMessage")
		expect(lintRules[1]!.name).toBe("variantWithEmptyPattern")
		expect(lintRules[2]!.name).toBe("identicalPattern")
		expect(lintRules[3]!.name).toBe("bundleWithoutMessageWithBaseLocale")
	})

	it("should return an empty array when no modules are provided", async () => {
		// Mock settings with no modules
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({}),
				},
			},
		})

		const lintRules = await resolveLintRules()

		expect(lintRules.length).toBe(0)
	})

	it("should wrap each rule function with the correct severity", async () => {
		// Mock settings to return valid modules and rule levels
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({
						modules: [
							"/source-code/message-lint-rules/missingTranslation/dist/index.js",
							"/source-code/message-lint-rules/emptyPattern/dist/index.js",
							"/source-code/message-lint-rules/identicalPattern/dist/index.js",
							"/source-code/message-lint-rules/messageWithoutSource/dist/index.js",
						],
						messageLintRuleLevels: {
							"messageLintRule.inlang.missingTranslation": "warning",
							"messageLintRule.inlang.identicalPattern": "error",
							"messageLintRule.inlang.messageWithoutSource": "warning",
						},
					}),
				},
			},
		})

		const lintRules = await resolveLintRules()

		// @ts-expect-error
		const wrappedRuleFn = vi.spyOn(lintRules[0], "ruleFn")

		await lintRules[0]!.ruleFn("bundleId")

		expect(wrappedRuleFn).toHaveBeenCalledWith("bundleId")
		await expect(wrappedRuleFn.mock.results[0]!.value).resolves.toEqual([])
	})
})
