/**
 * Utility function for working with JSON data in the database
 */

import { type RawBuilder, sql } from "kysely";

/**
 * Converts a JavaScript object to a JSONB representation for storage
 *
 * This function serves as an abstraction over how JSON is stored in the database.
 * Currently, it converts to JSONB format, but the implementation details are
 * encapsulated within this function.
 *
 * @param value The value to convert to JSONB
 * @returns A SQL expression that will convert the value to JSONB
 */
export function jsonb<T>(value: T): RawBuilder<unknown> {
	if (value === null || value === undefined) {
		return sql`NULL`;
	}

	return sql`jsonb(${JSON.stringify(value)})`;
}
