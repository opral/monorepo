import { test, expect } from "vitest";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import { sql } from "kysely";

test("select() should return object", async () => {
	const lix = await openLixInMemory({});

	const snapshot = await lix.db
		.insertInto("snapshot")
		.values({
			content: new TextEncoder().encode(
				JSON.stringify({
					foo: "bar",
					baz: 1,
				}),
			),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const result = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", snapshot.id)
		.selectAll()
		.select((eb) => sql`json(${eb.ref("content")})`.as("content"))
		.executeTakeFirstOrThrow();

	expect(result.content).toEqual({
		foo: "bar",
		baz: 1,
	});
});
