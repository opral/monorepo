import { safeState } from "../state.js"
import * as vscode from "vscode"
import { getSelectedBundleByBundleIdOrAlias } from "../helper.js"
import { logger } from "../logger.js"

export interface LintResult {
	bundleId: string
	messageId?: string
	messageLocale?: string
	code: string
	description: string
	severity?: vscode.DiagnosticSeverity
}

/**
 * Lint rule: Checks if any message in a bundle is missing a translation (empty variants).
 */
export const missingMessage = async (bundleId: string): Promise<LintResult[]> => {
	const activeProject = safeState()?.project
	if (!activeProject) {
		logger.warn("missingMessage rule executed without an active project")
		return []
	}
	const locales = (await activeProject.settings.get()).locales

	const bundle = await getSelectedBundleByBundleIdOrAlias(bundleId)

	if (!bundle) return []

	// Check if for every locales defined in the settings, ther is a message with a corresponding locale

	const bundleWithMissingMessage = bundle.messages.filter((message) => {
		return !locales.includes(message.locale) || message.variants.length === 0
	})

	return bundleWithMissingMessage.map((message: any) => ({
		bundleId: bundle.id,
		messageId: message.id,
		messageLocale: message.locale,
		code: "missingMessage",
		description: `Message with locale ${message.locale} is missing the bundle with id ${bundle.id}`,
	}))
}

/**
 * Lint rule: Checks if any message in a bundle is missing the message with the baseLocale
 */
export const bundleWithoutMessageWithBaseLocale = async (
	bundleId: string
): Promise<LintResult[]> => {
	const activeProject = safeState()?.project
	if (!activeProject) {
		logger.warn("bundleWithoutMessageWithBaseLocale rule executed without an active project")
		return []
	}
	const baseLocale = (await activeProject.settings.get()).baseLocale

	const bundle = await getSelectedBundleByBundleIdOrAlias(bundleId)

	if (!bundle) return []

	const bundleWithoutMessageWithBaseLocale = bundle.messages.filter(
		(message) => message.locale === baseLocale && message.variants.length === 0
	)

	return bundleWithoutMessageWithBaseLocale.map((message: any) => ({
		bundleId: bundle.id,
		messageId: message.id,
		messageLocale: message.locale,
		code: "bundleWithoutMessageWithBaseLocale",
		description: `Bundle with id ${bundle.id} is missing a message with the base locale ${baseLocale}`,
	}))
}

/**
 * Lint rule: Checks if any variant in a bundle has an empty pattern.
 */
export const variantWithEmptyPattern = async (bundleId: string): Promise<LintResult[]> => {
	const bundle = await getSelectedBundleByBundleIdOrAlias(bundleId)

	if (!bundle) return []

	const variantWithEmptyPattern = bundle.messages.filter((message) => {
		return message.variants.some((variant) => variant.pattern.length === 0)
	})

	return variantWithEmptyPattern.map((message: any) => ({
		bundleId: bundle.id,
		messageId: message.id,
		messageLocale: message.locale,
		code: "variantWithEmptyPattern",
		description: `Variant with empty pattern in message with id ${message.id} and locale ${message.locale}`,
	}))
}

/**
 * Utility function to check if the bundle id is a valid JS identifier.
 */
export const invalidJSIdentifier = async (bundleId: string): Promise<LintResult[]> => {
	const isValidJsIdentifier = (id: string) => {
		try {
			new Function(`var ${id};`)
			return true
		} catch (e) {
			return false
		}
	}

	const bundle = await getSelectedBundleByBundleIdOrAlias(bundleId)

	if (!bundle) return []

	const bundleIdIsValid = isValidJsIdentifier(bundle.id)

	return bundleIdIsValid
		? []
		: [
				{
					bundleId,
					code: "invalidJSIdentifier",
					description: `Bundle id ${bundleId} is not a valid JS identifier`,
				},
			]
}

/**
 * Utility function to find identical patterns in messages.
 */
export const identicalPattern = async (bundleId: string): Promise<LintResult[]> => {
	const bundle = await getSelectedBundleByBundleIdOrAlias(bundleId)

	if (!bundle) return []

	const identicalPatterns = bundle.messages.filter((message) => {
		const patterns = message.variants.map((variant) => variant.pattern)
		return new Set(patterns).size !== patterns.length
	})

	return identicalPatterns.map((message: any) => ({
		bundleId: bundle.id,
		messageId: message.id,
		messageLocale: message.locale,
		code: "identicalPattern",
		description: `Message with id ${message.id} and locale ${message.locale} has identical patterns`,
	}))
}
