import * as Path from "./path.js"
import { DATA_SUFFIX } from "../constants.js"

/**
 * Serializes a path with the given options. Does **NOT** include the language.
 */
export function serializeRoute({ path, base, isDataRequest }: SerializePathOptions): string {
	const parts: string[] = [base, path]
	if (isDataRequest) parts.push(DATA_SUFFIX)
	return Path.resolve(...parts)
}

type SerializePathOptions = {
	path: string
	base: string
	isDataRequest: boolean
}
