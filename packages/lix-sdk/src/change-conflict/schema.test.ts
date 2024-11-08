import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { LIX_DIVERGING_ENTITY_CONFLICT_KEY } from "./detect-diverging-entity-conflict.js";

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
