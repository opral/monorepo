interface LanguagePriority {
	language: string
	priority: number
}

export const parseAcceptLanguageHeader = (acceptLanguageHeader: string): LanguagePriority[] => {
	const languagePriorities: LanguagePriority[] = []

	if (!acceptLanguageHeader) {
		return languagePriorities
	}

	const languagePriorityStrings = acceptLanguageHeader.split(",")
	for (const languagePriorityString of languagePriorityStrings) {
		const [language, priorityString] = languagePriorityString.trim().split(";q=")
		const priority = priorityString ? parseFloat(priorityString) : 1
		languagePriorities.push({ language, priority })
	}

	return languagePriorities
}

export const getPreferredLanguage = (
	languagePriorities: LanguagePriority[],
): string | undefined => {
	let preferredLanguage: string | undefined
	let highestPriority = 0

	for (const languagePriority of languagePriorities) {
		if (languagePriority.priority > highestPriority) {
			highestPriority = languagePriority.priority
			preferredLanguage = languagePriority.language
		}
	}

	return preferredLanguage
}
