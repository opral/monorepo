import { isAvailableLanguageTag } from "$paraglide-adapter-next-internal/runtime.js"

export function getLocaleFromPath(path: string): string | undefined {
	const maybeLocale = path.split("/")[1]
	if (!isAvailableLanguageTag(maybeLocale)) return undefined
	return maybeLocale
}

export function getPathWithoutLocale(path: string): string {
	const locale = getLocaleFromPath(path)
	if (!locale) return path
	const pathWithoutLocale = path.replace(`/${locale}`, "")
	return pathWithoutLocale
}

export function translatePath(path: string, newLocale: string): string {
	const pathWithoutLocale = getPathWithoutLocale(path)
	const newPath = `/${newLocale}${pathWithoutLocale}`
	return newPath
}
