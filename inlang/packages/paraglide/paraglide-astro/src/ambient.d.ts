/**
 * The compiled paraglide runtime module.
 * (e.g. "paraglide/runtime.js")
 */
declare module "virtual:paraglide-astro:runtime" {
	export const defineGetLocale: (fn: () => string) => void;
	export const defineSetLocale: (fn: (locale: string) => void) => void;
	export const getLocale: () => string;
	export const isAvailableLocale: (locale: unknown) => locale is string;
	export const locales: readonly string[];
	export const baseLocale: string;
}

declare module "astro:i18n" {
	export const getLocaleByPath: (path: string) => string;
	export const getPathByLocale: (locale: string) => string;
}

declare namespace App {
	interface Locals {
		paraglide: {
			lang: string;
			dir: "ltr" | "rtl";
		};
	}
}
