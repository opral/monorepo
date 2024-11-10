import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { LIX_DIVERGING_ENTITY_CONFLICT_KEY } from "./detect-diverging-entity-conflict.js";

// skipping because foreign keys are not activated yet
test.skip("change conflict deletions should cascade to change conflict elements", async () => {
	const lix = await openLixInMemory({});

	const changeConflict = await lix.db
		.insertInto("change_conflict")
		.values({ key: "foo" })
		.returningAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("change_conflict_element")
		.values({ change_conflict_id: changeConflict.id, change_id: "bar" })
		.returningAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.deleteFrom("change_conflict")
		.where("id", "=", changeConflict.id)
		.execute();

	expect(
		lix.db
			.selectFrom("change_conflict_element")
			.where("change_conflict_id", "=", changeConflict.id)
			.selectAll()
			.execute(),
	).resolves.toEqual([]);
});

test.skip("it should throw if a change_conflict.key starts with 'lix-' and is not whitelisted", async () => {
	const lix = await openLixInMemory({});

	const whitelistedKeys = [LIX_DIVERGING_ENTITY_CONFLICT_KEY];

	for (const key of whitelistedKeys) {
		expect(
			lix.db
				.insertInto("change_conflict")
				.values({ key })
				.returningAll()
				.executeTakeFirstOrThrow(),
		).resolves.toBeDefined();
	}

	await expect(
		lix.db
			.insertInto("change_conflict")
			.values({ key: "lix-foo" })
			.returningAll()
			.executeTakeFirstOrThrow(),
	).rejects.toThrowError(
		`SQLITE_CONSTRAINT_CHECK: sqlite3 result code 275: CHECK constraint failed: key = '${LIX_DIVERGING_ENTITY_CONFLICT_KEY}' OR key NOT LIKE 'lix-%'`,
	);
});
