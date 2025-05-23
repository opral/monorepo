import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

// file ids are always in the URL of lix apps
// to increase sharing, the ids should be as short as possible
//
// 129 million file creations will lead to a 1% chance of a collision
//
// if someone uses lix to handle 129 million files, we can
// increase the length of the id :D
test("file ids should default to nano_id(10)", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/mock.txt",
			data: new Uint8Array(),
			version_id: "version0",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(file.id.length).toBe(10);
});

// https://github.com/opral/lix-sdk/issues/71
test("files should be able to have metadata", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/mock.csv",
			data: new Uint8Array(),
			metadata: {
				primary_key: "email",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(file.metadata?.primary_key).toBe("email");

	const updatedFile = await lix.db
		.updateTable("file")
		.where("path", "=", "/mock.csv")
		.set({
			metadata: {
				primary_key: "something-else",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(updatedFile.metadata?.primary_key).toBe("something-else");
});

test("invalid file paths should be rejected", async () => {
	const lix = await openLixInMemory({});

	await expect(
		lix.db
			.insertInto("file")
			.values({
				path: "invalid-path",
				data: new Uint8Array(),
			})
			.returningAll()
			.execute()
	).rejects.toThrowError("File path must start with a slash");
});
