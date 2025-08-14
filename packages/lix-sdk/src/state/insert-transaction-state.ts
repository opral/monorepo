import { sql, type Kysely } from "kysely";
import { executeSync } from "../database/execute-sync.js";
import { uuidV7 } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { NewStateAllRow, StateAllRow } from "./schema.js";
import { LixChangeAuthorSchema } from "../change-author/schema.js";

type NewTransactionStateRow = Omit<NewStateAllRow, "snapshot_content"> & {
	snapshot_content: string | null;
};

export type TransactionStateRow = Omit<StateAllRow, "snapshot_content"> & {
	snapshot_content: string | null;
};

/**
 * Inserts a state change into the transaction stage.
 *
 * This function handles the TRANSACTION stage of the state mutation flow, where
 * changes are temporarily stored in the transaction table before being committed
 * to permanent storage. All changes (both tracked and untracked) are stored
 * in the transaction table until commit time.
 *
 * @param args.lix - The Lix instance with SQLite database and Kysely query builder
 * @param args.data - The state data to insert, including entity details and snapshot
 * @param args.timestamp - Timestamp to use for the changes
 * @param args.createChangeAuthors - Whether to create change_author records (defaults to true)
 *
 * @returns The inserted state row with generated fields like change_id
 *
 * @example
 * // Insert a new entity state
 * insertTransactionState({
 *   lix: { sqlite, db },
 *   data: {
 *     entity_id: "user-123",
 *     schema_key: "user",
 *     file_id: "file1",
 *     plugin_key: "my-plugin",
 *     snapshot_content: JSON.stringify({ name: "John", email: "john@example.com" }),
 *     schema_version: "1.0",
 *     version_id: "version-abc",
 *     untracked: false
 *   }
 * });
 *
 * @example
 * // Delete an entity (null snapshot_content)
 * insertTransactionState({
 *   lix: { sqlite, db },
 *   data: {
 *     entity_id: "user-123",
 *     schema_key: "user",
 *     file_id: "file1",
 *     plugin_key: "my-plugin",
 *     snapshot_content: null, // Deletion
 *     schema_version: "1.0",
 *     version_id: "version-abc",
 *     untracked: false
 *   }
 * });
 */
export function insertTransactionState(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
	data: NewTransactionStateRow[];
	timestamp: string;
	createChangeAuthors?: boolean;
}): TransactionStateRow[] {
	const _timestamp = args.timestamp;

	if (args.data.length === 0) {
		return [];
	}

	// Generate change IDs for all entities upfront
	const dataWithChangeIds = args.data.map((data) => ({
		...data,
		change_id: uuidV7({ lix: args.lix as any }),
	}));

	// Batch insert into internal_change_in_transaction
	const transactionRows = dataWithChangeIds.map((data) => ({
		id: data.change_id,
		entity_id: data.entity_id,
		schema_key: data.schema_key,
		file_id: data.file_id,
		plugin_key: data.plugin_key,
		snapshot_content: data.snapshot_content
			? sql`jsonb(${data.snapshot_content})`
			: null,
		schema_version: data.schema_version,
		version_id: data.version_id,
		created_at: _timestamp,
		untracked: data.untracked === true ? 1 : 0,
	}));

	executeSync({
		lix: args.lix,
		query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_change_in_transaction")
			.values(transactionRows)
			.onConflict((oc) =>
				oc
					.columns(["entity_id", "file_id", "schema_key", "version_id"])
					.doUpdateSet((eb) => ({
						id: eb.ref("excluded.id"),
						plugin_key: eb.ref("excluded.plugin_key"),
						snapshot_content: eb.ref("excluded.snapshot_content"),
						schema_version: eb.ref("excluded.schema_version"),
						created_at: eb.ref("excluded.created_at"),
						untracked: eb.ref("excluded.untracked"),
					}))
			),
	});

	// Handle change authors for tracked entities (if enabled)
	const trackedData = dataWithChangeIds.filter((data) => data.untracked !== true);
	if (args.createChangeAuthors !== false && trackedData.length > 0) {
		// Step 1: Get all active accounts once
		const activeAccounts = executeSync({
			lix: args.lix,
			query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
				.selectFrom("internal_resolved_state_all")
				.where("schema_key", "=", "lix_active_account")
				.where("version_id", "=", "global")
				.select(["snapshot_content"]),
		});

		if (activeAccounts && activeAccounts.length > 0) {
			// Extract all account IDs
			const accountIds = activeAccounts.map(
				(acc) =>
					JSON.parse(acc.snapshot_content as string).account_id as string
			);

			// Get all unique version IDs we need to check
			const uniqueVersionIds = [
				...new Set(trackedData.map((d) => d.version_id)),
			];

			// Step 2: Batch query to check account states across all versions
			const accountStates = executeSync({
				lix: args.lix,
				query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
					.selectFrom("internal_resolved_state_all")
					.where("entity_id", "in", accountIds)
					.where("schema_key", "=", "lix_account")
					.where("version_id", "in", uniqueVersionIds)
					.select([
						"entity_id",
						"version_id",
						"snapshot_content",
						"untracked",
					]),
			});

			// Create a Map for quick lookups: "accountId:versionId" -> state
			const accountStateMap = new Map<string, any>();
			for (const state of accountStates) {
				accountStateMap.set(`${state.entity_id}:${state.version_id}`, state);
			}

			// Step 3: Identify missing/untracked accounts that need to be imported
			const accountsToImport: Array<{
				accountId: string;
				versionId: string;
			}> = [];

			for (const versionId of uniqueVersionIds) {
				for (const accountId of accountIds) {
					const state = accountStateMap.get(`${accountId}:${versionId}`);
					if (!state || state.untracked) {
						accountsToImport.push({ accountId, versionId });
					}
				}
			}

			// Step 4: Batch fetch missing accounts from global version if needed
			if (accountsToImport.length > 0) {
				const uniqueAccountIds = [
					...new Set(accountsToImport.map((a) => a.accountId)),
				];

				const globalAccounts = executeSync({
					lix: args.lix,
					query: (args.lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
						.selectFrom("internal_resolved_state_all")
						.where("entity_id", "in", uniqueAccountIds)
						.where("schema_key", "=", "lix_account")
						.where("version_id", "=", "global")
						.select(["entity_id", "snapshot_content"]),
				});

				// Create a Map for global accounts
				const globalAccountMap = new Map<string, string>();
				for (const acc of globalAccounts) {
					globalAccountMap.set(acc.entity_id, acc.snapshot_content!);
				}

				// Step 5: Batch insert all missing accounts as tracked
				const accountsToTrack = accountsToImport
					.filter((item) => globalAccountMap.has(item.accountId))
					.map((item) => ({
						entity_id: item.accountId,
						schema_key: "lix_account",
						file_id: "lix",
						plugin_key: "lix_own_entity",
						snapshot_content: globalAccountMap.get(item.accountId)!,
						schema_version: "1.0",
						version_id: item.versionId,
						untracked: false,
					}));

				if (accountsToTrack.length > 0) {
					insertTransactionState({
						lix: args.lix,
						data: accountsToTrack,
						timestamp: _timestamp,
						createChangeAuthors: false,
					});
				}
			}

			// Step 6: Batch create all change_author records
			const changeAuthorData = [];
			for (const data of trackedData) {
				for (const accountId of accountIds) {
					changeAuthorData.push({
						entity_id: `${data.change_id}~${accountId}`,
						schema_key: LixChangeAuthorSchema["x-lix-key"],
						file_id: "lix",
						plugin_key: "lix_own_entity",
						snapshot_content: JSON.stringify({
							change_id: data.change_id,
							account_id: accountId,
						}),
						schema_version: LixChangeAuthorSchema["x-lix-version"],
						version_id: data.version_id,
						untracked: false,
					});
				}
			}

			if (changeAuthorData.length > 0) {
				insertTransactionState({
					lix: args.lix,
					data: changeAuthorData,
					timestamp: _timestamp,
					createChangeAuthors: false,
				});
			}
		}
	}

	// Return results for all data
	return dataWithChangeIds.map((data) => ({
		entity_id: data.entity_id,
		schema_key: data.schema_key,
		file_id: data.file_id,
		plugin_key: data.plugin_key,
		snapshot_content: data.snapshot_content,
		schema_version: data.schema_version,
		version_id: data.version_id,
		created_at: _timestamp,
		updated_at: _timestamp,
		untracked: data.untracked === true,
		inherited_from_version_id: null,
		change_id: data.change_id,
		commit_id: "pending",
	}));
}
