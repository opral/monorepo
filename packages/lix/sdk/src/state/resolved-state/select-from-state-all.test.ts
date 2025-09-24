import { sql } from "kysely";
import { describe, expect, it } from "vitest";
import { selectFromStateAll } from "./select-from-state-all.js";

describe("selectFromStateAll", () => {
	it("routes to the schema-specific materialized tables", () => {
		const compiled = selectFromStateAll("lix_change_set")
			.selectAll()
			.compile();

		expect(compiled.sql).toContain("internal_state_cache_lix_change_set");
		expect(compiled.sql).toContain("internal_state_cache_lix_version_descriptor");
		expect(compiled.sql).not.toMatch(/internal_state_cache\b(?!_)/);
	});

	it("passes the schema key as a parameterised filter", () => {
		const schemaKey = "lix_key_value";
		const compiled = selectFromStateAll(schemaKey).compile();

		// Union emits five schema filters in the resolved select.
		expect(compiled.parameters).toEqual([
			schemaKey,
			schemaKey,
			schemaKey,
			schemaKey,
			schemaKey,
		]);
	});

	it("can be composed with additional joins", () => {
		const compiled = selectFromStateAll("lix_commit")
			.select(["internal_state_all_routed.entity_id", "commit_cache.entity_id"])
			.innerJoin(
				sql`internal_state_cache_lix_commit`.as("commit_cache"),
				"commit_cache.entity_id",
				"internal_state_all_routed.entity_id"
			)
			.compile();

		expect(compiled.sql).toMatch(
			/inner join\s+internal_state_cache_lix_commit\s+as\s+"commit_cache"/iu
		);
		expect(compiled.sql).toMatch(
			/"internal_state_all_routed"\."entity_id"/u
		);
	});
});
