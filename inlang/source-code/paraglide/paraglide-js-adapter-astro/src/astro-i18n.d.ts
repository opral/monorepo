declare module "astro:i18n" {
	export const getLocaleByPath: (path: string) => string
	export const getPathByLocale: (locale: string) => string
}
