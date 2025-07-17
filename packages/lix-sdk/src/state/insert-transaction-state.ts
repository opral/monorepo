import { sql, type Kysely } from "kysely";
import { executeSync } from "../database/execute-sync.js";
import { timestamp, uuidV7 } from "../deterministic/index.js";
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
 * changes are temporarily stored before being committed to permanent storage.
 * It supports both tracked and untracked entities, manages the state cache for
 * immediate consistency, and automatically creates change_author records to
 * track who made each change.
 *
 * @param args.lix - The Lix instance with SQLite database and Kysely query builder
 * @param args.data - The state data to insert, including entity details and snapshot
 * @param args.timestamp - Optional timestamp to use (defaults to current time)
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
	lix: { sqlite: Lix["sqlite"]; db: Kysely<LixInternalDatabaseSchema> };
	data: NewTransactionStateRow;
	timestamp?: string;
	createChangeAuthors?: boolean;
}): {
	data: TransactionStateRow;
} {
	const _timestamp = args.timestamp || timestamp({ lix: args.lix as any });
	if (args.data.untracked == true) {
		// Untracked entities cannot have null snapshot_content (that would be a deletion)
		if (args.data.snapshot_content === null) {
			throw new Error("Untracked entities cannot have null snapshot_content");
		}
		// Insert into untracked state table
		executeSync({
			lix: { sqlite: args.lix.sqlite },
			query: args.lix.db
				.insertInto("internal_state_all_untracked")
				.values({
					entity_id: args.data.entity_id,
					schema_key: args.data.schema_key,
					file_id: args.data.file_id,
					plugin_key: args.data.plugin_key,
					snapshot_content: args.data.snapshot_content,
					schema_version: args.data.schema_version,
					version_id: args.data.version_id,
				})
				.onConflict((oc) =>
					oc
						.columns(["entity_id", "schema_key", "file_id", "version_id"])
						.doUpdateSet({
							snapshot_content: args.data.snapshot_content!,
							updated_at: _timestamp,
						})
				),
		});
		return {
			data: {
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				snapshot_content: args.data.snapshot_content,
				schema_version: args.data.schema_version,
				version_id: args.data.version_id,
				created_at: _timestamp,
				updated_at: _timestamp,
				untracked: true,
				inherited_from_version_id: null,
				change_id: "untracked",
				change_set_id: "pending",
			},
		};
	} else {
		const changeId = uuidV7({ lix: args.lix as any });

		// Insert into internal_change_in_transaction
		executeSync({
			lix: args.lix,
			query: args.lix.db.insertInto("internal_change_in_transaction").values({
				id: changeId,
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				snapshot_content: args.data.snapshot_content
					? sql`jsonb(${args.data.snapshot_content})`
					: null,
				schema_version: args.data.schema_version,
				version_id: args.data.version_id,
				created_at: _timestamp,
			}),
		});

		// Create change_author records if enabled (default true)
		if (args.createChangeAuthors !== false) {
			// Query from internal_underlying_state_all to get active accounts
			const activeAccounts = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("internal_underlying_state_all")
					.where("schema_key", "=", "lix_active_account")
					.where("version_id", "=", "global")
					.select(["entity_id as account_id"]),
			});

			if (activeAccounts && activeAccounts.length > 0) {
				for (const activeAccount of activeAccounts) {
					const accountId = activeAccount.account_id as string;

					// Get account details from internal_underlying_state_all
					const [accountDetails] = executeSync({
						lix: args.lix,
						query: args.lix.db
							.selectFrom("internal_underlying_state_all")
							.where("entity_id", "=", accountId)
							.where("schema_key", "=", "lix_account")
							.where("version_id", "=", args.data.version_id)
							.select(["snapshot_content"]),
					});

					// If account doesn't exist in this version, create it
					if (!accountDetails) {
						// Get account from global version
						const [globalAccount] = executeSync({
							lix: args.lix,
							query: args.lix.db
								.selectFrom("internal_underlying_state_all")
								.where("entity_id", "=", accountId)
								.where("schema_key", "=", "lix_account")
								.where("version_id", "=", "global")
								.select(["snapshot_content"]),
						});

						if (globalAccount) {
							// Recursively insert account without creating change authors for it
							insertTransactionState({
								lix: args.lix,
								data: {
									entity_id: accountId,
									schema_key: "lix_account",
									file_id: "lix",
									plugin_key: "lix",
									snapshot_content: globalAccount.snapshot_content!,
									schema_version: "1.0",
									version_id: args.data.version_id,
									untracked: false,
								},
								timestamp: _timestamp,
								createChangeAuthors: false, // Avoid infinite recursion
							});
						}
					}

					// Create change_author record
					const changeAuthorSnapshot = {
						change_id: changeId,
						account_id: accountId,
					};

					// Recursively insert change_author without creating change authors for it
					insertTransactionState({
						lix: args.lix,
						data: {
							entity_id: `${changeId}::${accountId}`,
							schema_key: LixChangeAuthorSchema["x-lix-key"],
							file_id: "lix",
							plugin_key: "lix",
							snapshot_content: JSON.stringify(changeAuthorSnapshot),
							schema_version: LixChangeAuthorSchema["x-lix-version"],
							version_id: args.data.version_id,
							untracked: false,
						},
						timestamp: _timestamp,
						createChangeAuthors: false, // Avoid infinite recursion
					});
				}
			}
		}

		// Update the cache - handle deletions
		if (args.data.snapshot_content === null) {
			// For deletions, remove from cache
			executeSync({
				lix: args.lix,
				query: args.lix.db
					.deleteFrom("internal_state_cache")
					.where("entity_id", "=", args.data.entity_id)
					.where("schema_key", "=", args.data.schema_key)
					.where("file_id", "=", args.data.file_id)
					.where("version_id", "=", args.data.version_id),
			});
		} else {
			// For inserts/updates, update cache
			executeSync({
				lix: args.lix,
				query: args.lix.db
					.insertInto("internal_state_cache")
					.values({
						entity_id: args.data.entity_id,
						schema_key: args.data.schema_key,
						file_id: args.data.file_id,
						plugin_key: args.data.plugin_key,
						snapshot_content: args.data.snapshot_content,
						schema_version: args.data.schema_version,
						version_id: args.data.version_id,
						change_id: changeId,
						inheritance_delete_marker: 0,
						created_at: _timestamp,
						updated_at: _timestamp,
						inherited_from_version_id: null,
					})
					.onConflict((oc) =>
						oc
							.columns(["entity_id", "schema_key", "file_id", "version_id"])
							.doUpdateSet({
								plugin_key: args.data.plugin_key,
								snapshot_content: args.data.snapshot_content,
								schema_version: args.data.schema_version,
								updated_at: _timestamp,
								change_id: changeId,
								inheritance_delete_marker: 0,
								inherited_from_version_id: null,
							})
					),
			});
		}
		return {
			data: {
				entity_id: args.data.entity_id,
				schema_key: args.data.schema_key,
				file_id: args.data.file_id,
				plugin_key: args.data.plugin_key,
				snapshot_content: args.data.snapshot_content,
				schema_version: args.data.schema_version,
				version_id: args.data.version_id,
				created_at: _timestamp,
				updated_at: _timestamp,
				untracked: false,
				inherited_from_version_id: null,
				change_id: changeId,
				change_set_id: "pending",
			},
		};
	}
}
