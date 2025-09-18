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
	engine: Pick<LixEngine, "sqlite">;
	pattern: string;
	path: string;
}): boolean {
	const result = args.engine.sqlite.exec({
		sql: `SELECT CASE WHEN ? GLOB ? THEN 1 ELSE 0 END AS matches`,
		bind: [args.path, args.pattern],
		returnValue: "resultRows",
	});

	return result[0]?.[0] === 1;
}
