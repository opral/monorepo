import type { Message, PathTranslations, UserPathTranslations } from "./pathTranslations.js"

/**
 * Fully resolves all path translations.
 * If a path translation is a message-function, it will be evaluated for each language.
 *
 * Does NOT perform any validation.
 *
 * @param userTranslations The user-provided path translation configuration.
 * @param availableLanguageTags The available language tags.
 * @returns The resolved path translations.
 */
export function resolvePathTranslations<T extends string>(
	userTranslations: UserPathTranslations<T>,
	availableLanguageTags: readonly T[]
): PathTranslations<T> {
	const translations: PathTranslations<T> = {}
	for (const path in userTranslations) {
		const translation = userTranslations[path as `/${string}`]
		if (!translation) continue
		if (typeof translation === "object") {
			translations[path as `/${string}`] = userTranslations[path as `/${string}`] as Record<
				T,
				`/${string}`
			>
			continue
		}
		translations[path as `/${string}`] = fromMessage(translation, availableLanguageTags)
	}

	return translations
}

function fromMessage<T extends string>(
	message: Message<T>,
	availableLanguageTags: readonly T[]
): Record<T, `/${string}`> {
	const entries = availableLanguageTags.map(
		(languageTag) => [languageTag, message({}, { languageTag })] as const
	)
	return Object.fromEntries(entries) as Record<T, `/${string}`>
}
