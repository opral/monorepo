import { Result } from "@inlang/result";
import { parse, ParseError } from "@fluent/syntax";
import { Resource } from "../classes/index.js";

/**
 * Takes a serialized resource and returns a parsed resource.
 */
export function parseResource(
	serializedResource: string,
	options?: { withJunk?: boolean }
): Result<Resource, ParseError | Error> {
	const _options = { withJunk: true, ...options };
	const fluentResource = parse(serializedResource, { withSpans: false });
	const junk = fluentResource.body.filter((entry) => entry.type === "Junk");
	if (_options.withJunk === false && junk.length > 0) {
		return Result.err(
			Error(
				"Couldn't parse the following entries:\n" +
					junk.map((junk) => junk.content)
			)
		);
	}
	return Result.ok(new Resource(fluentResource.body));
}
