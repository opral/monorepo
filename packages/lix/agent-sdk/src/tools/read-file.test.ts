import { describe, expect, test } from "vitest";
import { readFile } from "./read-file.js";
import { openLix } from "@lix-js/sdk";

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

describe("readFile / createReadFileTool", () => {
	test("reads a small UTF-8 file by path (readFile)", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		// seed a file
		await lix.db
			.insertInto("file_by_version")
			.values({
				path: "/notes.md",
				data: enc("# Title\nHello world\n"),
				lixcol_version_id: versionId as unknown as any,
			})
			.execute();

		const res = await readFile({
			lix,
			path: "/notes.md",
			version_id: versionId,
		});

		expect(res).toMatchObject({
			path: "/notes.md",
			encoding: "utf-8",
			truncated: false,
		});
		expect(typeof res.text).toBe("string");
		expect(res.text.includes("Hello world")).toBe(true);
		expect(res.size).toBeGreaterThan(0);
		expect(res.byteOffset).toBe(0);
		expect(res.byteLength).toBeGreaterThan(0);
	});

	test("supports byte windowing (readFile)", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		const content = "ABCDEFGHIJ"; // 10 bytes ascii
		await lix.db
			.insertInto("file_by_version")
			.values({
				path: "/a.txt",
				data: enc(content),
				lixcol_version_id: versionId as unknown as any,
			})
			.execute();

		const res = await readFile({
			lix,
			path: "/a.txt",
			version_id: versionId,
			byteOffset: 3,
			byteLength: 4,
		});
		expect(res.text).toBe("DEFG");
		expect(res.byteOffset).toBe(3);
		expect(res.byteLength).toBe(4);
	});

	test("supports line slicing after decode (readFile)", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		const content = ["line1", "line2", "line3", "line4"].join("\n");
		await lix.db
			.insertInto("file_by_version")
			.values({
				path: "/b.txt",
				data: enc(content),
				lixcol_version_id: versionId as unknown as any,
			})
			.execute();

		const res = await readFile({
			lix,
			path: "/b.txt",
			version_id: versionId,
			lineOffset: 1,
			lineLimit: 2,
		});
		expect(res.text).toBe(["line2", "line3"].join("\n"));
	});

	test("clamps by maxChars (readFile)", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		const content = "X".repeat(1000);
		await lix.db
			.insertInto("file_by_version")
			.values({
				path: "/c.txt",
				data: enc(content),
				lixcol_version_id: versionId as unknown as any,
			})
			.execute();

		const res = await readFile({
			lix,
			path: "/c.txt",
			version_id: versionId,
			maxChars: 100,
		});
		expect(res.text.length).toBe(100);
		expect(res.truncated).toBe(true);
	});
});
