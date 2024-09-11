import { selectBundleNested } from "@inlang/sdk2"
import { state } from "../state.js"

export interface LintResult {
	bundleId: string
	messageId?: string
	messageLocale?: string
	code: string
	description: string
}

/**
 * Lint rule: Checks if any message in a bundle is missing a translation (empty variants).
 */
export const missingMessage = async (bundleId: string): Promise<LintResult[]> => {
	const db = state().project.db
	const locales = (await state().project.settings.get()).locales

	const bundle = await selectBundleNested(db).where("bundle.id", "=", bundleId).executeTakeFirst()

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
	const db = state().project.db
	const baseLocale = (await state().project.settings.get()).baseLocale

	const bundle = await selectBundleNested(db).where("bundle.id", "=", bundleId).executeTakeFirst()

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
	const db = state().project.db

	const bundle = await selectBundleNested(db).where("bundle.id", "=", bundleId).executeTakeFirst()

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

	const db = state().project.db

	const bundle = await selectBundleNested(db).where("bundle.id", "=", bundleId).executeTakeFirst()

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
