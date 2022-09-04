import { Result } from "@inlang/result";
import { Message, ParseError, Pattern } from "@fluent/syntax";
import { parseEntry } from "./parseEntry";

/**
 * Takes a serialized pattern and returns a parsed pattern.
 *
 * @param {string} serializedPattern - the pattern to parse
 * @returns parsed pattern.
 */
export function parsePattern(
	serializedPattern: string
): Result<Pattern, ParseError | Error> {
	// wrapping the pattern as message to parse it
	const entry = parseEntry("placeholder-id = " + serializedPattern);
	if (entry.isErr) {
		return Result.err(entry.error);
	}
	const dummyMessage = entry.value as Message;
	if (dummyMessage.attributes.length > 0) {
		return Result.err(
			Error(`The pattern contains one or more attributes.
            'parsePattern()' only parses a pattern, not attributes.
        `)
		);
	}
	// return type is a message that contains a pattern (checked above)
	return Result.ok((entry.value as Message).value as Pattern);
}
