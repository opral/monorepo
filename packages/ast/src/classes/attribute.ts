import { Attribute as FluentAttribute, Identifier } from "@fluent/syntax";
import { Result } from "@inlang/result";
import { parsePattern } from "../utils/index.js";

export class Attribute extends FluentAttribute {
	static from(args: { id: string; value: string }): Result<Attribute, Error> {
		try {
			return Result.ok(
				new Attribute(
					new Identifier(args.id),
					parsePattern(args.value).unwrap()
				)
			);
		} catch (error) {
			return Result.err(error as Error);
		}
	}
}
