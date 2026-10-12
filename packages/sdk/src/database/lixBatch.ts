import type { CompiledQuery, Kysely } from "kysely";
import type { Lix, StatementResult } from "@lix-js/sdk";
import type { InlangDatabaseSchema } from "./schema.js";
import { compileLixQuery } from "./lixDialect.js";

const lixByDatabase = new WeakMap<object, Lix>();

/**
 * Records the Lix behind an Lix-backed database, for operations Kysely has
 * no word for: atomic statement groups and reads of one pinned state.
 */
export function attachLix(db: Kysely<InlangDatabaseSchema>, lix: Lix): void {
	lixByDatabase.set(db, lix);
}

/** The Lix behind an Lix-backed database, if `db` is one. */
export function lixOf(db: Kysely<InlangDatabaseSchema>): Lix | undefined {
	return lixByDatabase.get(db);
}

/**
 * Executes already-compiled Kysely statements atomically in one Lix
 * transaction. A conflicting concurrent commit reruns the whole group on a
 * fresh transaction. A database without an attached Lix is rejected
 * explicitly; there is no sequential route hidden behind this API.
 */
export async function executeLixBatch(
	db: Kysely<InlangDatabaseSchema>,
	queries: readonly CompiledQuery[]
): Promise<readonly StatementResult[]> {
	if (queries.length === 0) {
		throw new Error("executeLixBatch requires at least one query");
	}
	const lix = lixByDatabase.get(db);
	if (!lix) {
		throw new Error("The database is not an Lix-backed batch database");
	}
	const statements = queries.map(compileLixQuery);
	const { value } = await lix.transaction(async (tx) => {
		const results: StatementResult[] = [];
		for (const statement of statements) {
			results.push(await tx.execute(statement.sql, statement.params));
		}
		return results;
	});
	return value;
}
