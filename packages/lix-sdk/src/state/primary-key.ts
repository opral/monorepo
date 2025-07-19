/**
 * Utilities for encoding/decoding composite primary keys for the resolved state virtual table.
 *
 * The composite key format is: tag~file_id~entity_id~version_id
 * Using ~ as delimiter since it's URL-safe and unlikely to appear in identifiers
 *
 * Tag meanings:
 *
 * - U: Untracked direct (from internal_state_all_untracked in child version)
 * - UI: Untracked inherited (from internal_state_all_untracked in parent version)
 * - C: Cache-tracked direct (from internal_state_cache in child version)
 * - CI: Cache-tracked inherited (from internal_state_cache in parent version)
 */

export type StatePkTag = "U" | "UI" | "C" | "CI";

/**
 * Build primary key string from components.
 *
 * @param tag - The tag indicating the source and ownership
 * @param fileId - The file ID
 * @param entityId - The entity ID
 * @param versionId - The version ID
 * @returns The encoded composite key
 */
export function serializePk(
	tag: StatePkTag,
	fileId: string,
	entityId: string,
	versionId: string
): string {
	return `${tag}~${fileId}~${entityId}~${versionId}`;
}

/**
 * Parse primary key back into parts.
 *
 * @param pk - The encoded composite key
 * @returns The decoded components
 */
export function parsePk(pk: string): {
	tag: StatePkTag;
	fileId: string;
	entityId: string;
	versionId: string;
} {
	const parts = pk.split("~");

	if (parts.length !== 4) {
		throw new Error(
			`Invalid composite key: ${pk} - expected 4 parts separated by ~`
		);
	}

	return {
		tag: parts[0] as StatePkTag,
		fileId: parts[1] ?? "",
		entityId: parts[2] ?? "",
		versionId: parts[3] ?? "",
	};
}
