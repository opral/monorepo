import type { LixEngine } from "../../engine/boot.js";

/**
 * Tests whether a given path matches a SQLite `GLOB` pattern.
 *
 * Uses SQLite's matcher so plugin patterns behave identically in tests and in
 * the database.
 *
 * @example
 * ```ts
 * matchesGlob({ engine, path: "/docs/readme.md", pattern: "*.md" });
 * ```
 */
export function matchesGlob(args: {
	engine: Pick<LixEngine, "executeSync">;
	pattern: string;
	path: string;
}): boolean {
	const rows = args.engine.executeSync({
		sql: `SELECT CASE WHEN ? GLOB ? THEN 1 ELSE 0 END AS matches`,
		parameters: [args.path, args.pattern],
	}).rows;

	const first = rows?.[0];
	if (first == null) return false;
	if (typeof first === "object" && first !== null) {
		const value = (first as Record<string, unknown>).matches;
		return value === 1 || value === "1";
	}
	return first === 1 || first === "1";
}
