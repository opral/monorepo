import {
	bundleWithoutMessageWithBaseLocale,
	missingMessage,
	variantWithEmptyPattern,
	invalidJSIdentifier,
	type LintResult,
	identicalPattern,
} from "../utilities/lint-rules/lintRules.js"
import { safeState } from "../utilities/state.js"
import * as vscode from "vscode"
import { logger } from "../utilities/logger.js"

export interface LintRule {
	name: string // The name of the lint rule (e.g., "missingMessage", "bundleWithoutMessageWithBaseLocale")
	ruleFn: (bundleId: string) => Promise<LintResult[]> // The linting function that runs on a bundle and returns lint results
}

// Map of available custom lint rules with updated names
const customLintRules: Record<string, LintRule> = {
	emptyPattern: {
		name: "variantWithEmptyPattern",
		ruleFn: variantWithEmptyPattern,
	},
	identicalPattern: {
		name: "identicalPattern",
		ruleFn: identicalPattern,
	},
	missingTranslation: {
		name: "missingMessage",
		ruleFn: missingMessage,
	},
	messageWithoutSource: {
		name: "bundleWithoutMessageWithBaseLocale",
		ruleFn: bundleWithoutMessageWithBaseLocale,
	},
	isValidJsIdentifier: {
		name: "invalidJSIdentifier",
		ruleFn: invalidJSIdentifier,
	},
}

export async function resolveLintRules() {
	const currentState = safeState()
	if (!currentState?.project) {
		logger.warn("resolveLintRules invoked without a loaded project")
		return []
	}

	const settings = await currentState.project.settings.get()
	const lintRuleLevels = settings.messageLintRuleLevels || {}
	const activeRules: LintRule[] = []

	if (!settings.modules) return activeRules

	for (const modulePath of settings.modules) {
		const moduleName = getModuleNameFromPath(modulePath)

		if (!moduleName) continue

		const customRule = customLintRules[moduleName]

		if (customRule) {
			const severity = lintRuleLevels[`messageLintRule.inlang.${moduleName}`] || "error" // Default to error if not specified
			const wrappedRuleFn = wrapLintRuleWithSeverity(customRule.ruleFn, severity)

			// Ensure that 'name' is present and not undefined
			activeRules.push({
				...customRule,
				ruleFn: wrappedRuleFn,
				name: customRule.name,
			})
		}
	}

	return activeRules
}

export function wrapLintRuleWithSeverity(
	ruleFn: (bundleId: string) => Promise<LintResult[]>,
	severity: string
) {
	return async (bundleId: string) => {
		const results = await ruleFn(bundleId)
		return results.map((result) => ({
			...result,
			severity: mapSeverity(severity),
		}))
	}
}

// Maps the severity string to a vscode.DiagnosticSeverity
export function mapSeverity(severity: string): vscode.DiagnosticSeverity {
	switch (severity.toLowerCase()) {
		case "error":
			return vscode.DiagnosticSeverity.Error
		case "warning":
			return vscode.DiagnosticSeverity.Warning
		default:
			return vscode.DiagnosticSeverity.Information // Default to 'Information' if severity is unrecognized
	}
}

export function getModuleNameFromPath(modulePath: string): string | undefined {
	const parts = modulePath.split("/") // Split the path by "/"
	const distIndex = parts.indexOf("dist") // Find where "dist" is in the path

	if (distIndex > 1) {
		return parts[distIndex - 1] // Get the part two levels above "dist"
	}

	return "" // Return empty string if path doesn't follow the expected format
}
