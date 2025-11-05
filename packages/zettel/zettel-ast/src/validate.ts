import { TypeCompiler } from "@sinclair/typebox/compiler";
import { ZettelDocJsonSchema, type ZettelDoc } from "./schema.js";

const Z = TypeCompiler.Compile(ZettelDocJsonSchema);

export type SerializableError = { message: string };

export type ValidationResult<T> =
	| {
			success: true;
			data: T;
			errors: undefined;
	  }
	| {
			success: false;
			data: undefined;
			errors: SerializableError[];
	  };

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
export function validate(zettel: unknown): ValidationResult<ZettelDoc> {
	const result = Z.Check(zettel);
	if (!result) {
		const errors = [...Z.Errors(zettel)];
		return {
			success: false,
			data: undefined,
			errors: errors.map((error) => ({ message: error.message })),
		};
	}
	return {
		success: true,
		data: zettel as ZettelDoc,
		errors: undefined,
	};
}
