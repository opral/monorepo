import { parsePathDefinition } from "./parse.js"
import * as Path from "../../utils/path.js"

export function resolvePath(pathDefinition: string, params: Record<string, string>): string {
	const parts = parsePathDefinition(pathDefinition)

	const segments: string[] = []
	for (const part of parts) {
		if (part.type === "static") {
			segments.push(part.value)
		} else {
			const param = params[part.name]
			if (!param) throw new Error(`Missing param ${part.name}`)
			segments.push(param)
		}
	}

	return Path.resolve(...segments)
}
