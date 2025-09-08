import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { deleteFile } from "./delete-file.js";

function enc(s: string): Uint8Array {
	return new TextEncoder().encode(s);
}

describe("delete_file tool", () => {
	test("deletes by path", async () => {
		const lix = await openLix({});
		await lix.db
			.insertInto("file")
			.values({ path: "/del.txt", data: enc("x") })
			.execute();

		const res = await deleteFile({ lix, path: "/del.txt" });
		expect(res.deleted).toBe(true);
		expect(res.path).toBe("/del.txt");

		const row = await lix.db
			.selectFrom("file")
			.where("path", "=", "/del.txt")
			.select(["id"])
			.executeTakeFirst();
		expect(row).toBeUndefined();
	});

	test("returns deleted=false when not found", async () => {
		const lix = await openLix({});
		const res = await deleteFile({ lix, path: "/missing.txt" });
		expect(res.deleted).toBe(false);
	});

	test("deletes by fileId", async () => {
		const lix = await openLix({});
		await lix.db
			.insertInto("file")
			.values({ path: "/id.txt", data: enc("y") })
			.execute();
		const row = await lix.db
			.selectFrom("file")
			.where("path", "=", "/id.txt")
			.select(["id"])
			.executeTakeFirstOrThrow();

		const res = await deleteFile({ lix, fileId: row.id as string });
		expect(res.deleted).toBe(true);
		expect(res.fileId).toBe(row.id);
	});
});
