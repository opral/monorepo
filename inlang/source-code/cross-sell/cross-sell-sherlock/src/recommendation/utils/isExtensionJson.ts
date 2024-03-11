import type { ExtensionsJson } from "./types.js"

export function isExtensionsJson(object: any): object is ExtensionsJson {
	return (
		object !== null &&
		typeof object === "object" &&
		Array.isArray(object.recommendations) &&
		object.recommendations.every((item: any) => typeof item === "string")
	)
}
