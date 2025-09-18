import type { LixEngine } from "../../engine/boot.js";

export interface FileLixcol {
	latest_change_id: string | null;
	latest_commit_id: string | null;
	created_at: string | null;
	updated_at: string | null;
	writer_key: string | null;
}

/**
 * Selects file lixcol metadata with caching support.
 *
 * First checks the cache, and if not found, computes the metadata
 * and updates the cache for future reads.
 *
 * @example
 * const lixcol = selectFileLixcol({
 *   engine: lix.engine!,
 *   fileId: "file_123",
 *   versionId: "version_456"
 * });
 */
export function selectFileLixcol(args: {
	engine: Pick<LixEngine, "sqlite">;
	fileId: string;
	versionId: string;
}): FileLixcol {
	// Check cache first
	const cached = args.engine.sqlite.exec({
		sql: `
			SELECT 
				latest_change_id,
				latest_commit_id,
				created_at,
				updated_at,
				writer_key
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
				writer_key: (row[4] as string | null) ?? null,
			};
		}
	}

	// Cache miss - compute the metadata

	// Get the commit_id directly from the version - this is always the source of truth
	const versionCommit = args.engine.sqlite.exec({
		sql: `SELECT commit_id FROM version WHERE id = ?`,
		bind: [args.versionId],
		returnValue: "resultRows",
	});

	const commitId = versionCommit[0]?.[0] as string | null;

	// Get the latest change and timestamps
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

	const row = metadata[0];
	const writerKey = normalizeWriterKey(row?.[1]);

	// If no metadata found (file doesn't exist or has no changes), return nulls
	// Don't cache non-existent files
	if (!row || !row[0]) {
		return {
			latest_change_id: null,
			latest_commit_id: null,
			created_at: null,
			updated_at: null,
			writer_key: writerKey,
		};
	}

	const result = {
		latest_change_id: row[0] as string,
		latest_commit_id: commitId!,
		created_at: row[2] as string,
		updated_at: row[3] as string,
		writer_key: writerKey,
	};

	// Only cache if we have valid data (file exists)
	args.engine.sqlite.exec({
		sql: `
			INSERT OR REPLACE INTO internal_file_lixcol_cache 
			(file_id, version_id, latest_change_id, latest_commit_id, created_at, updated_at, writer_key)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`,
		bind: [
			args.fileId,
			args.versionId,
			result.latest_change_id,
			result.latest_commit_id,
			result.created_at,
			result.updated_at,
			result.writer_key,
		],
		returnValue: "resultRows",
	});

	return result;
}

function normalizeWriterKey(value: unknown): string | null {
	if (value === null || value === undefined) {
		return null;
	}
	return String(value);
}
