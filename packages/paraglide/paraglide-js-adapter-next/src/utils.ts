import {
	isAvailableLanguageTag,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"

export function getLocaleFromPath(path: string): string {
	const maybeLocale = path.split("/")[1]
	if (!isAvailableLanguageTag(maybeLocale)) return sourceLanguageTag
	return maybeLocale
}

export function getPathWithoutLocale(path: string): string {
	const locale = getLocaleFromPath(path)
	if (locale === sourceLanguageTag) return path

	const pathWithoutLocale = path.replace(`/${locale}`, "")
	if (pathWithoutLocale === "") return "/"
	return pathWithoutLocale
}

export function translatePath(path: string, newLocale: string): string {
	const pathWithoutLocale = getPathWithoutLocale(path)
	if (newLocale === sourceLanguageTag) return pathWithoutLocale
	const newPath = `/${newLocale}${pathWithoutLocale}`
	return newPath
}
