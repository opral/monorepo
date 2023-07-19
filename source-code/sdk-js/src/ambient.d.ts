declare module "virtual:inlang-static" {
	export const sourceLanguageTag: import("@inlang/core/languageTag").BCP47LanguageTag
	export const languageTags: import("@inlang/core/languageTag").BCP47LanguageTag[]
	export const resources: import("@inlang/core/ast").Resource[]
}
