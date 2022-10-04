import { trim } from "lodash-es";
import { Identifier, Message, Pattern } from "@fluent/syntax";
import { serializeEntry } from "./serializeEntry.js";

/**
 * Serializes a `Pattern` to a fluent string.
 *
 * @example
 *      serializePattern(pattern)
 *      >> "Welcome, { $name }, to { -brand-name }!"

 */
export function serializePattern(pattern: Pattern): string {
	const serializedEntry = serializeEntry(
		new Message(new Identifier("dummy-id"), pattern)
	);
	return trim(serializedEntry.slice(serializedEntry.indexOf("=") + 1));
}
