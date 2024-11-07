import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("it should throw if a change_conflict.key starts with 'lix-' and is not whitelisted", async () => {
	const lix = await openLixInMemory({});

	const whitelistedKeys = ["lix-diverging-entity-conflict"];

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
		"SQLITE_CONSTRAINT_CHECK: sqlite3 result code 275: CHECK constraint failed: key = 'lix-diverging-entity-conflict' OR key NOT LIKE 'lix-%'",
	);
});
