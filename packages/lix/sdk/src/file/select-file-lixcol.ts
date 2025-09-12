import type { LixRuntime } from "../runtime/boot.js";

export interface FileLixcol {
	latest_change_id: string | null;
	latest_commit_id: string | null;
	created_at: string | null;
	updated_at: string | null;
}

/**
 * Selects file lixcol metadata with caching support.
 *
 * First checks the cache, and if not found, computes the metadata
 * and updates the cache for future reads.
 *
 * @example
 * const lixcol = selectFileLixcol({
 *   lix,
 *   fileId: "file_123",
 *   versionId: "version_456"
 * });
 */
export function selectFileLixcol(args: {
	runtime: Pick<LixRuntime, "sqlite">;
	fileId: string;
	versionId: string;
}): FileLixcol {
	// Check cache first
	const cached = args.runtime.sqlite.exec({
		sql: `
			SELECT 
				latest_change_id,
				latest_commit_id,
				created_at,
				updated_at
			FROM internal_file_lixcol_cache 
			WHERE file_id = ? AND version_id = ?
		`,
		bind: [args.fileId, args.versionId],
		returnValue: "resultRows",
	});

	if (cached.length > 0) {
		// Cache hit!
		const row = cached[0];
		if (row) {
			return {
				latest_change_id: row[0] as string | null,
				latest_commit_id: row[1] as string | null,
				created_at: row[2] as string | null,
				updated_at: row[3] as string | null,
			};
		}
	}

	// Cache miss - compute the metadata

	// Get the commit_id directly from the version - this is always the source of truth
	const versionCommit = args.runtime.sqlite.exec({
		sql: `SELECT commit_id FROM version WHERE id = ?`,
		bind: [args.versionId],
		returnValue: "resultRows",
	});

	const commitId = versionCommit[0]?.[0] as string | null;

	// Get the latest change and timestamps
	const metadata = args.runtime.sqlite.exec({
		sql: `
			WITH file_metadata AS (
				SELECT 
					-- Get the latest change for this file
					(SELECT s.change_id 
					 FROM state_all s 
					 WHERE s.file_id = ?
					   AND s.version_id = ?
					 ORDER BY s.updated_at DESC 
					 LIMIT 1) as latest_change_id
			)
			SELECT 
				fm.latest_change_id,
				-- Get timestamps from the change
				(SELECT created_at FROM change WHERE id = fm.latest_change_id) as created_at,
				(SELECT created_at FROM change WHERE id = fm.latest_change_id) as updated_at
			FROM file_metadata fm
		`,
		bind: [args.fileId, args.versionId],
		returnValue: "resultRows",
	});

	const row = metadata[0];

	// If no metadata found (file doesn't exist or has no changes), return nulls
	// Don't cache non-existent files
	if (!row || !row[0]) {
		return {
			latest_change_id: null,
			latest_commit_id: null,
			created_at: null,
			updated_at: null,
		};
	}

	const result = {
		latest_change_id: row[0] as string,
		latest_commit_id: commitId!,
		created_at: row[1] as string,
		updated_at: row[2] as string,
	};

	// Only cache if we have valid data (file exists)
	args.runtime.sqlite.exec({
		sql: `
			INSERT OR REPLACE INTO internal_file_lixcol_cache 
			(file_id, version_id, latest_change_id, latest_commit_id, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?)
		`,
		bind: [
			args.fileId,
			args.versionId,
			result.latest_change_id,
			result.latest_commit_id,
			result.created_at,
			result.updated_at,
		],
		returnValue: "resultRows",
	});

	return result;
}
