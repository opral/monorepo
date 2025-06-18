import {
	createInMemoryDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { closeLix } from "./close-lix.js";
import { createBootstrapChanges } from "./create-bootstrap-changes.js";
import { INITIAL_VERSION_ID } from "../version/schema.js";

/**
 * Creates a new lix file.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newLixFile(): Promise<Blob> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	// applying the schema etc.
	const db = initDb({ sqlite });

	// Create bootstrap changes for initial data
	const bootstrapChanges = createBootstrapChanges();

	// Insert all bootstrap changes directly into the change tables
	for (const change of bootstrapChanges) {
		// Insert snapshot content if it exists
		let snapshotId = "no-content";
		if (change.snapshot_content) {
			const result = sqlite.exec({
				sql: `INSERT INTO internal_snapshot (content) VALUES (jsonb(?)) RETURNING id`,
				bind: [JSON.stringify(change.snapshot_content)],
				returnValue: "resultRows",
			});
			if (result && result.length > 0) {
				snapshotId = result[0]![0] as string;
			}
		}

		// Insert the change record
		sqlite.exec({
			sql: `INSERT INTO internal_change (id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_id, created_at)
				   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			bind: [
				change.id,
				change.entity_id,
				change.schema_key,
				change.schema_version,
				change.file_id,
				change.plugin_key,
				snapshotId,
				change.created_at,
			],
		});
	}

	sqlite.exec(`
		INSERT INTO active_version (version_id)
		SELECT '${INITIAL_VERSION_ID}'
		WHERE NOT EXISTS (SELECT 1 FROM active_version);
`);

	try {
		return new Blob([contentFromDatabase(sqlite)]);
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e });
	} finally {
		closeLix({ lix: { db } });
	}
}
