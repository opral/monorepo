import type { Lix } from "../lix/open-lix.js";
import type { SelectQueryBuilder } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { executeSync as exec } from "../database/execute-sync.js";

/**
 * Returns a typed Kysely query builder for use in detectChanges.
 *
 * Why this is useful
 * - Lets plugins inspect current state (e.g., to reuse stable entity IDs) without preloading it.
 * - Provides the exact Kysely builder shape, so you compose select/where/order as usual.
 * - Keeps execution separate: pair with executeQuerySync to run synchronously during detect.
 *
 * Example (stable IDs)
 * ```ts
 * detectChanges: ({ after, query, executeSync }) => {
 *   // Load existing state for this file to reuse entity_id for unchanged blocks
 *   const qb = query('state')
 *     .where('file_id', '=', after.id)
 *     .where('plugin_key', '=', 'plugin_md')
 *     .select(['entity_id', 'schema_key', 'snapshot_content'])
 *
 *   const rows = executeSync(qb)
 *   const latestById = new Map(rows.map(r => [r.entity_id, r]))
 *   // ... use latestById to assign/reuse ids in emitted changes ...
 *   return detected
 * }
 * ```
 */
export function createQuery(args: {
	lix: Pick<Lix, "db">;
}): (table: "state") => SelectQueryBuilder<LixDatabaseSchema, "state", any> {
	const { lix } = args;
	return (
		table: "state"
	): SelectQueryBuilder<LixDatabaseSchema, "state", any> => {
		// Return the raw Kysely builder so callers decide select/where/execute
		return lix.db.selectFrom(table);
	};
}

// Execute a Kysely builder synchronously and parse JSON like Kysely's driver does.
export function executeQuerySync<
	QB extends { execute: () => Promise<any> },
>(args: {
	lix: Pick<Lix, "sqlite">;
	query: QB;
}): Awaited<ReturnType<QB["execute"]>> {
	const rows = exec({ lix: args.lix as any, query: args.query });
	// Parse JSON-like columns to mirror Kysely driver behavior
	return rows.map((row: any) => parseJsonColumns(row)) as any;
}

const JSON_LIKE_COLUMNS = new Set(["snapshot_content", "value"]);

function parseJsonColumns(row: any) {
	const out: any = {};
	for (const k of Object.keys(row)) {
		const v = (row as any)[k];
		if (JSON_LIKE_COLUMNS.has(k) && typeof v === "string") {
			out[k] = tryParse(v);
		} else {
			out[k] = v;
		}
	}
	return out;
}

function tryParse(s: string) {
	try {
		return JSON.parse(s);
	} catch {
		return s;
	}
}
