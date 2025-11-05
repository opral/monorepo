import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { deleteFile } from "./delete-file.js";

function enc(s: string): Uint8Array {
	return new TextEncoder().encode(s);
}

async function getActiveVersionId(lix: Awaited<ReturnType<typeof openLix>>) {
	const active = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();
	return active.version_id as unknown as string;
}

describe("delete_file tool", () => {
	test("deletes by path", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		await lix.db
			.insertInto("file_by_version")
			.values({
				path: "/del.txt",
				data: enc("x"),
				lixcol_version_id: versionId as unknown as any,
			})
			.execute();

		const res = await deleteFile({
			lix,
			path: "/del.txt",
			version_id: versionId,
		});
		expect(res.deleted).toBe(true);
		expect(res.path).toBe("/del.txt");

		const row = await lix.db
			.selectFrom("file_by_version")
			.where("path", "=", "/del.txt")
			.where("lixcol_version_id", "=", versionId as unknown as any)
			.select(["id"])
			.executeTakeFirst();
		expect(row).toBeUndefined();
	});

	test("returns deleted=false when not found", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		const res = await deleteFile({
			lix,
			path: "/missing.txt",
			version_id: versionId,
		});
		expect(res.deleted).toBe(false);
	});

	test("deletes by fileId", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		await lix.db
			.insertInto("file_by_version")
			.values({
				path: "/id.txt",
				data: enc("y"),
				lixcol_version_id: versionId as unknown as any,
			})
			.execute();
		const row = await lix.db
			.selectFrom("file_by_version")
			.where("path", "=", "/id.txt")
			.where("lixcol_version_id", "=", versionId as unknown as any)
			.select(["id"])
			.executeTakeFirstOrThrow();

		const res = await deleteFile({
			lix,
			fileId: row.id as string,
			version_id: versionId,
		});
		expect(res.deleted).toBe(true);
		expect(res.fileId).toBe(row.id);
	});
});
