import { TypeCompiler } from "@sinclair/typebox/compiler";
import { ZettelJsonSchema, type Zettel } from "./schema.js";

const Z = TypeCompiler.Compile(ZettelJsonSchema);

/**
 * Validates a Zettel AST without throwing an error.
 *
 * @example
 *   const result = validate(zettel);
 *   if (!result.success) {
 *     console.error(result.errors);
 *   } else {
 *     console.log(result.data);
 *   }
 */
export function validate(zettel: unknown):
	| {
			success: true;
			data: Zettel;
			errors: undefined;
	  }
	| {
			success: false;
			data: undefined;
			errors: Error[];
	  } {
	const result = Z.Check(zettel);
	if (!result) {
		const errors = [...Z.Errors(zettel)];
		return {
			success: false,
			data: undefined,
			errors: errors.map((error) => new Error(error.message)),
		};
	}
	return {
		success: true,
		data: zettel as Zettel,
		errors: undefined,
	};
}
