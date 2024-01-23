import { parsePathDefinition } from "./parse.js"

export function resolvePath(pathDefinition: string, params: Record<string, string>): string {
	const parts = parsePathDefinition(pathDefinition)

	let path = ""
	for (const part of parts) {
		if (part.type === "static") {
			path += part.value
		} else {
			const param = params[part.name]
			if (!param) throw new Error(`Missing param ${part.name}`)
			path += param
		}
	}

	return path
}
