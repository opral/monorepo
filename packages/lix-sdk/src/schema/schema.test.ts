import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { NewStoredSchema } from "./schema.js";

test("inserting stored schema", async () => {
	const lix = await openLixInMemory({});

	const initial = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.execute();

	expect(initial).toHaveLength(0);

	const schema: NewStoredSchema = {
		value: JSON.stringify({
			type: "object",
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		}),
	};

	await lix.db.insertInto("stored_schema").values(schema).execute();

	const result = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(result.value).toEqual(schema.value);
});
