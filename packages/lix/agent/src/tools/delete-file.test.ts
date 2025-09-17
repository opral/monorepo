import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { ensureAgentVersion } from "../agent-version.js";
import { deleteFile } from "./delete-file.js";

function enc(s: string): Uint8Array {
	return new TextEncoder().encode(s);
}

describe("delete_file tool", () => {
	test("deletes by path", async () => {
		const lix = await openLix({});
		const version = await ensureAgentVersion(lix);
		await lix.db
			.insertInto("file_all")
			.values({
				path: "/del.txt",
				data: enc("x"),
				lixcol_version_id: version.id as unknown as any,
			})
			.execute();

		const res = await deleteFile({ lix, path: "/del.txt" });
		expect(res.deleted).toBe(true);
		expect(res.path).toBe("/del.txt");

		const row = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/del.txt")
			.where("lixcol_version_id", "=", version.id)
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
		const version = await ensureAgentVersion(lix);
		await lix.db
			.insertInto("file_all")
			.values({
				path: "/id.txt",
				data: enc("y"),
				lixcol_version_id: version.id as unknown as any,
			})
			.execute();
		const row = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/id.txt")
			.where("lixcol_version_id", "=", version.id)
			.select(["id"])
			.executeTakeFirstOrThrow();

		const res = await deleteFile({ lix, fileId: row.id as string });
		expect(res.deleted).toBe(true);
		expect(res.fileId).toBe(row.id);
	});
});
