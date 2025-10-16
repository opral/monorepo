import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { writeFile } from "./write-file.js";

function dec(u8: Uint8Array): string {
	return new TextDecoder().decode(u8);
}

async function getActiveVersionId(lix: Awaited<ReturnType<typeof openLix>>) {
	const active = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();
	return active.version_id as unknown as string;
}

describe("write_file tool", () => {
	test("creates a new file and overwrites", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);

		const res1 = await writeFile({
			lix,
			version_id: versionId,
			path: "/hello.txt",
			content: "hi",
		});
		expect(res1.created).toBe(true);
		expect(res1.updated).toBe(false);
		expect(res1.size).toBe(2);

		const res2 = await writeFile({
			lix,
			version_id: versionId,
			path: "/hello.txt",
			content: "world",
		});
		expect(res2.created).toBe(false);
		expect(res2.updated).toBe(true);
		expect(res2.size).toBe(5);

		const row = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/hello.txt")
			.where("lixcol_version_id", "=", versionId as unknown as any)
			.select(["data"])
			.executeTakeFirstOrThrow();
		expect(dec(row.data as unknown as Uint8Array)).toBe("world");
	});

	test("appends when mode=append", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);

		await writeFile({
			lix,
			version_id: versionId,
			path: "/a.md",
			content: "A",
		});
		const res = await writeFile({
			lix,
			version_id: versionId,
			path: "/a.md",
			content: "B",
			mode: "append",
		});
		expect(res.updated).toBe(true);
		const row = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/a.md")
			.where("lixcol_version_id", "=", versionId as unknown as any)
			.select(["data"])
			.executeTakeFirstOrThrow();
		expect(dec(row.data as unknown as Uint8Array)).toBe("AB");
	});
});
