export function guessTextDir(lang: string): "rtl" | "ltr" {
	// this is super unreliable across browsers, so we expect errors
	try {
		const locale = new Intl.Locale(lang)

		if ("textInfo" in locale) {
			// @ts-ignore - Chrome & Node only
			return locale.textInfo.direction === "rtl" ? "rtl" : "ltr"
		}

		// @ts-ignore - Safari only
		return locale.getTextInfo().direction === "rtl" ? "rtl" : "ltr"
	} catch (e) {
		//Firefox lmao
		return "ltr"
	}
}

export function guessTextDirMap<T extends string>(langs: readonly T[]): Record<T, "rtl" | "ltr"> {
	const entries: [T, "rtl" | "ltr"][] = langs.map((lang) => [lang, guessTextDir(lang)])
	return Object.fromEntries(entries) as Record<T, "rtl" | "ltr">
}
