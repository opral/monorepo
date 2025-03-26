/**
 * Utility functions for working with JSON data in the database
 */

import { type RawBuilder, sql } from "kysely";

// Define our own interface for Kysely query builder expressions
interface QueryBuilderExpression {
  toOperationNode: () => any;
}

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

/**
 * Creates a JSON object
 * 
 * This function has two modes:
 * 1. When given a JavaScript object, it converts the object to JSONB
 * 2. When given a Kysely subquery, it converts the first row of results into a JSON object
 *
 * @param input Either a JavaScript object or a Kysely subquery
 * @returns A SQL expression that will create a JSON object
 */
export function jsonObjectFrom<T extends Record<string, unknown>>(
	input: T | QueryBuilderExpression
): RawBuilder<unknown> {
	// Check if input is a Kysely query expression (has toOperationNode method)
	if (input && typeof input === 'object' && 'toOperationNode' in input && typeof input.toOperationNode === 'function') {
		// This is a Kysely query expression - use SQLite's json_object to create an object from the first row
		// Then wrap it with jsonb() to ensure consistent JSONB format
		return sql`jsonb((select json_object(*) from ${input} as obj))`;
	}
	
	// This is a regular JavaScript object - convert to JSONB
	return sql`jsonb(${JSON.stringify(input)})`;
}

/**
 * Creates a JSON array
 * 
 * This function has two modes:
 * 1. When given a JavaScript array, it converts it to a JSONB array
 * 2. When given a Kysely subquery, it aggregates the results into a JSON array
 *
 * @param input Either an array of values or a Kysely subquery
 * @returns A SQL expression that will create a JSON array
 */
export function jsonArrayFrom<T>(input: T[] | QueryBuilderExpression): RawBuilder<unknown> {
	// Check if input is a Kysely query expression (has toOperationNode method)
	if (input && typeof input === 'object' && 'toOperationNode' in input && typeof input.toOperationNode === 'function') {
		// This is a Kysely query expression - use SQLite's json_group_array to aggregate results
		// Then wrap it with jsonb() to ensure consistent JSONB format
		return sql`jsonb((select coalesce(json_group_array(json_object(*)), '[]') from ${input} as agg))`;
	}
	
	// This is a regular JavaScript array - convert to JSONB
	return sql`jsonb(${JSON.stringify(input)})`;
}
