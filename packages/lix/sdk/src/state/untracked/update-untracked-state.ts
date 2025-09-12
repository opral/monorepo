import { sql, type Kysely } from "kysely";
import { executeSync } from "../../database/execute-sync.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { LixChangeRaw } from "../../change/schema.js";
import type { LixRuntime } from "../../runtime/boot.js";

/**
 * Change data for untracked state updates with optional ID.
 * Since untracked entities don't participate in change control,
 * the change ID is not required.
 */
export type UntrackedChangeData = Omit<LixChangeRaw, "id"> & {
	id?: string;
	/** target version for the untracked update (column maps to version_id) */
	lixcol_version_id: string;
};

/**
 * Updates untracked state with inheritance support.
 *
 * This function handles all untracked entity operations (insert, update, delete)
 * while maintaining inheritance behavior similar to tracked entities but completely
 * isolated from the change control cache system.
 *
 * Inheritance Logic:
 * - Direct entities: Stored with inherited_from_version_id: null
 * - Inherited entities: Visible through parent version queries
 * - Deletions:
 *   - Direct entities: Remove from untracked table
 *   - Inherited entities: Create tombstone with inheritance_delete_marker: 1
 *
 * @param args - Update parameters
 * @param args.lix - Lix instance with sqlite and db
 * @param args.change - Change object containing entity information (ID is optional since untracked entities don't participate in change control)
 * @param args.version_id - Version ID to update
 */
export function updateUntrackedState(args: {
	runtime: Pick<LixRuntime, "sqlite" | "db">;
	changes: UntrackedChangeData[];
}): void {
	const { runtime, changes } = args;
	if (!changes || changes.length === 0) return;

	const intDb = runtime.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Split into deletions and non-deletions
	const deletions = changes.filter((c) => c.snapshot_content == null);
	const inserts = changes.filter((c) => c.snapshot_content != null);

	// 1) Handle deletions first (delete direct or create tombstones for inherited)
	if (deletions.length > 0) {
		// Group by version for efficient lookups
		const byVersion = new Map<string, UntrackedChangeData[]>();
		for (const c of deletions) {
			const v = c.lixcol_version_id;
			if (!byVersion.has(v)) byVersion.set(v, []);
			byVersion.get(v)!.push(c);
		}

		for (const [versionId, list] of byVersion) {
			// Build compact IN filters and intersect in JS to find direct entries
			const desired = new Set<string>();
			const ent = new Set<string>();
			const sch = new Set<string>();
			const fil = new Set<string>();
			for (const c of list) {
				desired.add(`${c.entity_id}|${c.schema_key}|${c.file_id}`);
				ent.add(c.entity_id);
				sch.add(c.schema_key);
				fil.add(c.file_id);
			}

			let sel = intDb
				.selectFrom("internal_state_all_untracked")
				.where("version_id", "=", versionId);
			const entArr = Array.from(ent);
			const schArr = Array.from(sch);
			const filArr = Array.from(fil);
			if (entArr.length > 0) sel = sel.where("entity_id", "in", entArr);
			if (schArr.length > 0) sel = sel.where("schema_key", "in", schArr);
			if (filArr.length > 0) sel = sel.where("file_id", "in", filArr);

			const existing = executeSync({
				runtime,
				query: sel.select(["entity_id", "schema_key", "file_id"]),
			});
			const existingSet = new Set<string>(
				existing.map((r) => `${r.entity_id}|${r.schema_key}|${r.file_id}`)
			);

			// Direct deletes (per-row to keep selection precise)
			for (const c of list) {
				const key = `${c.entity_id}|${c.schema_key}|${c.file_id}`;
				if (existingSet.has(key)) {
					executeSync({
						runtime,
						query: intDb
							.deleteFrom("internal_state_all_untracked")
							.where("entity_id", "=", c.entity_id)
							.where("schema_key", "=", c.schema_key)
							.where("file_id", "=", c.file_id)
							.where("version_id", "=", versionId),
					});
				}
			}

			// Tombstones for inherited (non-existing) entries via batched upsert
			const tombstoneValues = list
				.filter(
					(c) => !existingSet.has(`${c.entity_id}|${c.schema_key}|${c.file_id}`)
				)
				.map((c) => ({
					entity_id: c.entity_id,
					schema_key: c.schema_key,
					file_id: c.file_id,
					version_id: versionId,
					plugin_key: c.plugin_key,
					snapshot_content: null as null,
					schema_version: c.schema_version,
					created_at: c.created_at,
					updated_at: c.created_at,
					inherited_from_version_id: null as null,
					inheritance_delete_marker: 1,
				}));

			if (tombstoneValues.length > 0) {
				executeSync({
					runtime,
					query: intDb
						.insertInto("internal_state_all_untracked")
						.values(tombstoneValues)
						.onConflict((oc) =>
							oc
								.columns(["entity_id", "schema_key", "file_id", "version_id"])
								.doUpdateSet((eb) => ({
									snapshot_content: eb.val(null),
									updated_at: eb.ref("excluded.updated_at"),
									inheritance_delete_marker: eb.val(1),
									plugin_key: eb.ref("excluded.plugin_key"),
									schema_version: eb.ref("excluded.schema_version"),
								}))
						),
				});
			}
		}
	}

	// 2) Handle non-deletions: upsert actual content rows in batch using a prepared stmt
	if (inserts.length > 0) {
		for (const c of inserts) {
			const content: any = c.snapshot_content as any;
			executeSync({
				runtime,
				query: intDb
					.insertInto("internal_state_all_untracked")
					.values({
						entity_id: c.entity_id,
						schema_key: c.schema_key,
						file_id: c.file_id,
						version_id: c.lixcol_version_id,
						plugin_key: c.plugin_key,
						snapshot_content: sql`jsonb(${content})`,
						schema_version: c.schema_version,
						created_at: c.created_at,
						updated_at: c.created_at,
						inherited_from_version_id: null,
						inheritance_delete_marker: 0,
					})
					.onConflict((oc) =>
						oc
							.columns(["entity_id", "schema_key", "file_id", "version_id"])
							.doUpdateSet({
								plugin_key: c.plugin_key,
								snapshot_content: sql`jsonb(${content})`,
								schema_version: c.schema_version,
								updated_at: c.created_at,
								inheritance_delete_marker: 0,
							})
					),
			});
		}
	}
}
