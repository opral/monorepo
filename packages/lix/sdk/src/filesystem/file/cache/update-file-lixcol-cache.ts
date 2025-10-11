import type { LixEngine } from "../../../engine/boot.js";

/**
 * Updates the file lixcol metadata cache.
 *
 * This function computes and caches the expensive lixcol columns
 * (latest_change_id, latest_commit_id, created_at, updated_at, writer_key)
 * to avoid expensive subqueries in the file view.
 *
 * @example
 * updateFileLixcolCache({
 *   lix,
 *   fileId: "file_123",
 *   versionId: "version_456"
 * });
 */
export function updateFileLixcolCache(args: {
	engine: Pick<LixEngine, "sqlite">;
	fileId: string;
	versionId: string;
}): void {
	// Get the commit_id directly from the version
	const versionCommit = args.engine.sqlite.exec({
		sql: `SELECT commit_id FROM version WHERE id = ?`,
		bind: [args.versionId],
		returnValue: "resultRows",
	});

	const commitId = versionCommit[0]?.[0] as string | null;

	// Compute the expensive metadata once
	const metadata = args.engine.sqlite.exec({
		sql: `
			WITH latest_state AS (
				SELECT
					s.change_id AS latest_change_id,
					s.writer_key AS writer_key
				FROM state_all s
				WHERE s.file_id = ?
				  AND s.version_id = ?
				ORDER BY s.updated_at DESC, s.change_id DESC
				LIMIT 1
			)
			SELECT 
				ls.latest_change_id,
				ls.writer_key,
				(SELECT created_at FROM change WHERE id = ls.latest_change_id) AS created_at,
				(SELECT created_at FROM change WHERE id = ls.latest_change_id) AS updated_at
			FROM latest_state ls
		`,
		bind: [args.fileId, args.versionId],
		returnValue: "resultRows",
	});

	if (metadata.length === 0) {
		return;
	}

	const row = metadata[0];
	if (!row) {
		return;
	}

	// Insert or update the cache entry, preserving created_at on updates
	args.engine.sqlite.exec({
		sql: `
			INSERT INTO lix_internal_file_lixcol_cache 
			(file_id, version_id, latest_change_id, latest_commit_id, created_at, updated_at, writer_key)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT (file_id, version_id) DO UPDATE SET
				latest_change_id = excluded.latest_change_id,
				latest_commit_id = excluded.latest_commit_id,
				updated_at = excluded.updated_at,
				writer_key = excluded.writer_key
				-- Don't update created_at to preserve the original
		`,
		bind: [
			args.fileId,
			args.versionId,
			row[0], // latest_change_id
			commitId, // latest_commit_id from version table
			row[2], // created_at
			row[3], // updated_at
			row[1], // writer_key
		],
		returnValue: "resultRows",
	});
}
