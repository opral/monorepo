import * as Path from "./path.js"
import { DATA_SUFFIX } from "../../constants.js"

/**
 * Serializes a path with the given options. Does **NOT** include the language.
 * @param param0
 * @returns
 */
export function serializePath({ path, base, isDataRequest }: SerializePathOptions): string {
	const parts: string[] = [base, path]
	if (isDataRequest) parts.push(DATA_SUFFIX)
	return Path.resolve(...parts)
}

type SerializePathOptions = {
	path: string
	lang: string
	base: string
	defaultLanguageTag: string
	isDataRequest: boolean
}
