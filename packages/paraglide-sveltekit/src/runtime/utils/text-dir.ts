const RTL = "rtl"
const LTR = "ltr"

type TextDirection = "rtl" | "ltr"

export function guessTextDir<T extends string = string>(lang: T): TextDirection {
	// this is super unreliable across browsers, so we expect errors
	try {
		const locale = new Intl.Locale(lang)

		if ("textInfo" in locale) {
			// @ts-ignore - Chrome & Node
			return locale.textInfo.direction === RTL ? RTL : LTR
		}

		// @ts-ignore - Safari only
		return locale.getTextInfo().direction === RTL ? RTL : LTR
	} catch (e) {
		//Firefox lmao
		return LTR
	}
}

export function guessTextDirMap<T extends string>(langs: readonly T[]): Record<T, TextDirection> {
	const entries: [T, TextDirection][] = langs.map((lang) => [lang, guessTextDir(lang)])
	return Object.fromEntries(entries) as Record<T, TextDirection>
}
