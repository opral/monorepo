type Language = import("@inlang/core/ast").Language
type Resource = import("@inlang/core/ast").Resource

declare module "virtual:inlang-static" {
	export const referenceLanguage: Language
	export const languages: Language[]
	export const resources: Resource[]
}
