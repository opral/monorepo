import type { LixEngine } from "../../boot.js";

interface SqlInterface extends Pick<LixEngine, "sqlite"> {
	sqlite: Pick<LixEngine, "sqlite">["sqlite"];
}

/**
 * Returns the current SQLite schema_version value for the attached database.
 */
export function getSchemaVersion(sqlite: SqlInterface["sqlite"]): number {
	const result = sqlite.exec({
		sql: "PRAGMA schema_version;",
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});
	const rows = result as Array<Record<string, unknown>>;
	const value = rows[0]?.schema_version;
	if (typeof value === "number") return value;
	if (typeof value === "bigint") return Number(value);
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
}

/**
 * Normalises an identifier by trimming and unquoting double-quoted names, then
 * lowercasing the result.
 */
export function normalizeIdentifier(value: string): string {
	const trimmed = value.trim();
	if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
		return trimmed.slice(1, -1).replace(/""/g, '"').toLowerCase();
	}
	return trimmed.toLowerCase();
}
