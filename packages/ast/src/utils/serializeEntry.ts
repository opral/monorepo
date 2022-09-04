import { Entry, Resource, serialize } from "@fluent/syntax";
import { trim } from "lodash-es";

/**
 * Serializes an `Entry` to a fluent string.
 *
 * @example
 *      serializeEntry(message)
 *      >> "login-hello = Welcome, { $name }, to { -brand-name }!"

 */
export function serializeEntry(entry: Entry): string {
	const asResource = new Resource([entry]);
	// `serialize` serializes the entry as resource. Therefore,
	// whitespace is included (fluent is whitespace sensitive)
	// which needs to be trimmed.
	const serialized = trim(serialize(asResource, {}));
	return serialized;
}
