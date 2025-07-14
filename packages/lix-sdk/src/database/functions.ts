import type { Lix } from "../lix/open-lix.js";

/**
 * Returns a timestamp that is deterministic in deterministic mode.
 * In deterministic mode, returns a fixed timestamp.
 * Otherwise returns the current ISO timestamp.
 */
export function timestamp(args: { lix: Pick<Lix, "sqlite"> }): string {
	const result = args.lix.sqlite.exec({
		sql: "SELECT lix_timestamp() as timestamp",
		returnValue: "resultRows",
	});

	return result[0]?.[0] as string;
}

/**
 * Returns a UUID v7 that is deterministic in deterministic mode.
 * In deterministic mode, returns deterministic IDs.
 * Otherwise returns a random UUID v7.
 */
export function uuidV7(args: { lix: Pick<Lix, "sqlite"> }): string {
	const result = args.lix.sqlite.exec({
		sql: "SELECT lix_uuid_v7() as id",
		returnValue: "resultRows",
	});

	return result[0]?.[0] as string;
}

/**
 * Returns a nanoid that is deterministic in deterministic mode.
 * In deterministic mode, returns deterministic IDs.
 * Otherwise returns a random nanoid.
 */
export function nanoId(args: { lix: Pick<Lix, "sqlite"> }): string {
	const result = args.lix.sqlite.exec({
		sql: "SELECT lix_nano_id() as id",
		returnValue: "resultRows",
	});

	return result[0]?.[0] as string;
}