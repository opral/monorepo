import { RawBuilder, sql } from "kysely";

export function json<T>(value: T): RawBuilder<T> {
	// NOTE we cant use jsonb for now since kisley
	// - couldn't find out how to return json instead of bytes in a selectFrom(...).select statment
	//  return sql`jsonb(${JSON.stringify(value)})`
	return sql`json(${JSON.stringify(value)})`;
}
