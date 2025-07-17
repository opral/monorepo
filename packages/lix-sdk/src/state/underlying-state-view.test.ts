import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { commit } from "./commit.js";

test("underlying_state view should return same results as state_all for a tracked entity", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert a key-value through the normal state API
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test-key",
			value: "test-value",
		})
		.execute();

	// Query both state_all and underlying_state
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	const underlyingStateResults = await lixInternalDb
		.selectFrom("internal_underlying_state_all")
		.where("entity_id", "=", "test-key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(stateAllResults).toEqual(underlyingStateResults);
});

test("underlying_state view should return same results as state_all for an untracked entity", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Insert an untracked key-value directly
	await lix.db
		.insertInto("key_value")
		.values({
			key: "cache_stale",
			value: "true",
			lixcol_untracked: true,
		})
		.execute();

	// Query both state_all and underlying_state
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "cache_stale")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	const underlyingStateResults = await lixInternalDb
		.selectFrom("internal_underlying_state_all")
		.where("entity_id", "=", "cache_stale")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(stateAllResults).toEqual(underlyingStateResults);

	// Verify it's marked as untracked
	expect(stateAllResults[0]?.untracked).toBe(1);
	expect(underlyingStateResults[0]?.untracked).toBe(1);
});

test("underlying_state view should handle version inheritance", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (which inherits from global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	// Insert key-value directly into key_value_all with global version
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "inherited-key",
			value: "global-value",
			lixcol_version_id: "global",
		})
		.execute();

	// Query both state_all and underlying_state for active version
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "inherited-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	const underlyingStateResults = await lixInternalDb
		.selectFrom("internal_underlying_state_all")
		.where("entity_id", "=", "inherited-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	// Both should return the inherited entity
	expect(stateAllResults).toHaveLength(1);
	expect(underlyingStateResults).toHaveLength(1);

	// Results should match
	expect(stateAllResults).toEqual(underlyingStateResults);

	// Verify it's marked as inherited from global
	expect(stateAllResults[0]?.inherited_from_version_id).toBe("global");
	expect(underlyingStateResults[0]?.inherited_from_version_id).toBe("global");
});

test("underlying_state view should handle inherited untracked entities", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (which inherits from global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	// Insert untracked key-value directly into key_value_all with global version
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "inherited-untracked-key",
			value: "global-untracked-value",
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	// Query both state_all and underlying_state for active version
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	const underlyingStateResults = await lixInternalDb
		.selectFrom("internal_underlying_state_all")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	// Both should return the inherited untracked entity
	expect(stateAllResults).toHaveLength(1);
	expect(underlyingStateResults).toHaveLength(1);

	// Results should match
	expect(stateAllResults).toEqual(underlyingStateResults);

	// Verify it's marked as inherited from global and untracked
	expect(stateAllResults[0]?.inherited_from_version_id).toBe("global");
	expect(underlyingStateResults[0]?.inherited_from_version_id).toBe("global");
	expect(stateAllResults[0]?.untracked).toBe(1);
	expect(underlyingStateResults[0]?.untracked).toBe(1);
});

test.skip("underlying_state view should block inheritance when child has own value", async () => {
	const lix = await openLix({});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (which inherits from global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();

	// Insert key-value in global version (parent)
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "overridden-key",
			value: "global-value",
			lixcol_version_id: "global",
		})
		.execute();

	// Insert same key in active version (child) - this should block inheritance
	await lix.db
		.insertInto("key_value")
		.values({
			key: "overridden-key",
			value: "child-value",
		})
		.execute();

	// Query both state_all and underlying_state for active version
	const stateAllResults = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "overridden-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	const underlyingStateResults = await lixInternalDb
		.selectFrom("internal_underlying_state_all")
		.where("entity_id", "=", "overridden-key")
		.where("version_id", "=", activeVersion!.version_id)
		.selectAll()
		.execute();

	// Both should return only the child's value
	expect(stateAllResults).toHaveLength(1);
	expect(underlyingStateResults).toHaveLength(1);

	// Results should match
	expect(stateAllResults).toEqual(underlyingStateResults);

	// Verify it's NOT inherited and has child value
	expect(stateAllResults[0]?.inherited_from_version_id).toBe(null);
	expect(underlyingStateResults[0]?.inherited_from_version_id).toBe(null);
	const stateSnapshot =
		typeof stateAllResults[0]?.snapshot_content === "string"
			? JSON.parse(stateAllResults[0].snapshot_content)
			: stateAllResults[0]?.snapshot_content;
	const underlyingSnapshot =
		typeof underlyingStateResults[0]?.snapshot_content === "string"
			? JSON.parse(underlyingStateResults[0].snapshot_content)
			: underlyingStateResults[0]?.snapshot_content;

	expect(stateSnapshot?.value).toBe("child-value");
	expect(underlyingSnapshot?.value).toBe("child-value");
});

