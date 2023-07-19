declare module "virtual:inlang-static" {
	export const referenceLanguage: import("@inlang/core/languageTag").BCP47LanguageTag
	export const languages: import("@inlang/core/languageTag").BCP47LanguageTag[]
	export const resources: import("@inlang/core/ast").Resource[]
}
