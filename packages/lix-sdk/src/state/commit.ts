import { commitDeterministicSequenceNumber } from "../deterministic/sequence.js";
import { timestamp } from "../deterministic/timestamp.js";
import type { Lix } from "../lix/open-lix.js";
import { createChangesetForTransaction } from "./create-changeset-for-transaction.js";

export function commit(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
}): number {
	// Insert each row from internal_change_in_transaction into internal_snapshot and internal_change,
	// using the same id for snapshot_id in internal_change as in internal_snapshot.
	const changesWithoutChangeSets = args.lix.sqlite.exec({
		sql: `
      SELECT 
        id, 
        entity_id, 
        schema_key, 
        schema_version, 
        file_id, 
        plugin_key, 
        version_id, 
        CASE 
          WHEN snapshot_content IS NOT NULL THEN json(snapshot_content) 
          ELSE NULL 
        END as snapshot_content, 
        created_at 
      FROM internal_change_in_transaction 
      ORDER BY version_id
    `,
		returnValue: "resultRows",
	});

	// Group changes by version_id
	const changesByVersion = new Map<
		string,
		{
			id: string;
			entity_id: string;
			schema_key: string;
			schema_version: string;
			file_id: string;
			plugin_key: string;
			created_at: string;
			snapshot_content: string | null;
		}[]
	>();
	for (const changeWithoutChangeset of changesWithoutChangeSets) {
		const version_id = changeWithoutChangeset[6] as string;
		if (!changesByVersion.has(version_id)) {
			changesByVersion.set(version_id, []);
		}
		changesByVersion.get(version_id)!.push({
			id: changeWithoutChangeset[0] as string,
			entity_id: changeWithoutChangeset[1] as string,
			schema_key: changeWithoutChangeset[2] as string,
			schema_version: changeWithoutChangeset[3] as string,
			file_id: changeWithoutChangeset[4] as string,
			plugin_key: changeWithoutChangeset[5] as string,
			snapshot_content: changeWithoutChangeset[7] as string,
			created_at: changeWithoutChangeset[8] as string,
		});
	}

	// Process each version's changes to create changesets
	const changesetIdsByVersion = new Map<string, string>();
	for (const [version_id, versionChanges] of changesByVersion) {
		// Create changeset and edges for this version's transaction
		const changesetId = createChangesetForTransaction(
			args.lix.sqlite,
			args.lix.db as any,
			timestamp({ lix: args.lix }),
			version_id,
			versionChanges
		);
		changesetIdsByVersion.set(version_id, changesetId);
	}

	// Use the same changes we already queried at the beginning
	// Don't re-query the transaction table as it now contains additional changes
	// created by createChangesetForTransaction (like change_author records)
	for (const changeToRealize of changesWithoutChangeSets) {
		const [
			id,
			entity_id,
			schema_key,
			schema_version,
			file_id,
			plugin_key,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			version_id,
			snapshot_content,
			created_at,
		] = changeToRealize;

		let snapshot_id = "no-content";

		if (snapshot_content) {
			// Insert into internal_snapshot
			const result = args.lix.sqlite.exec({
				sql: `INSERT OR IGNORE INTO internal_snapshot (content) VALUES (jsonb(?)) RETURNING id`,
				bind: [snapshot_content],
				returnValue: "resultRows",
			});
			// Get the 'id' column of the newly created row
			if (result && result.length > 0) {
				snapshot_id = result[0]![0] as string; // assuming 'id' is the first column
			}
		}

		// Insert into internal_change
		args.lix.sqlite.exec({
			sql: `INSERT INTO internal_change (id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_id, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			bind: [
				id,
				entity_id,
				schema_key,
				schema_version,
				file_id,
				plugin_key,
				snapshot_id,
				created_at,
			],
			returnValue: "resultRows",
		});
	}

	args.lix.sqlite.exec({
		sql: "DELETE FROM internal_change_in_transaction",
		returnValue: "resultRows",
	});

	// Update cache entries with the changeset and change
	for (const [version_id, changesetId] of changesetIdsByVersion) {
		args.lix.sqlite.exec({
			sql: `UPDATE internal_state_cache 
                    SET change_set_id = ? 
                    WHERE version_id = ? AND change_set_id IS NULL`,
			bind: [changesetId, version_id],
		});
	}

	commitDeterministicSequenceNumber({ lix: args.lix });

	//* Emit state commit hook after transaction is successfully committed
	//* must come last to ensure that subscribers see the changes
	args.lix.hooks._emit("state_commit");
	return args.lix.sqlite.sqlite3.capi.SQLITE_OK;
}
