import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./init-db.js";

// needs the introduction of change set labels
test.todo(
	"the checkpoint label should be created if it doesn't exist",
	async () => {
		const sqlite = await createInMemoryDatabase({
			readOnly: false,
		});
		const db = initDb({ sqlite });

		const tag = await db
			.selectFrom("label")
			.selectAll()
			.where("name", "=", "checkpoint")
			.executeTakeFirst();

		expect(tag).toMatchObject({
			name: "checkpoint",
		});
	}
);
