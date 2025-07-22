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

const DELIM = "~"; // still our global separator
const DELIM_ENC = "%7E"; // RFC 3986 percent-encoding for '~'

/** Encode one segment so it cannot contain the delimiter or raw '%' */
export function encodeStatePkPart(part: string): string {
	// encodeURIComponent protects '%' and other reserved chars,
	// then we additionally escape the delimiter itself.
	return encodeURIComponent(part).replace(/~/g, DELIM_ENC);
}

/** Reverse of encodeStatePkPart */
function decodeStatePkPart(encoded: string): string {
	// decodeURIComponent happily turns %7E → ~ and %25 → %
	return decodeURIComponent(encoded);
}

/**
 * Build primary key string from components.
 *
 * @param tag - The tag indicating the source and ownership
 * @param fileId - The file ID
 * @param entityId - The entity ID
 * @param versionId - The version ID
 * @returns The encoded composite key
 */
export function serializeStatePk(
	tag: StatePkTag,
	fileId: string,
	entityId: string,
	versionId: string
): string {
	return [
		tag,
		encodeStatePkPart(fileId),
		encodeStatePkPart(entityId),
		encodeStatePkPart(versionId),
	].join(DELIM);
}

/**
 * Parse primary key back into parts.
 *
 * @param pk - The encoded composite key
 * @returns The decoded components
 */
export function parseStatePk(pk: string): {
	tag: StatePkTag;
	fileId: string;
	entityId: string;
	versionId: string;
} {
	const parts = pk.split(DELIM);

	if (parts.length !== 4) {
		throw new Error(`Invalid composite key: ${pk} - expected 4 parts`);
	}

	return {
		tag: parts[0] as StatePkTag,
		fileId: decodeStatePkPart(parts[1] ?? ""),
		entityId: decodeStatePkPart(parts[2] ?? ""),
		versionId: decodeStatePkPart(parts[3] ?? ""),
	};
}
