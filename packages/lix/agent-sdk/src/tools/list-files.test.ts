import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { listFiles } from "./list-files.js";

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

describe("listFiles tool", () => {
	test("lists by query substring", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		await lix.db
			.insertInto("file_all")
			.values([
				{
					path: "/docs/hello.md",
					data: enc("one"),
					lixcol_version_id: versionId as unknown as any,
				},
				{
					path: "/docs/goodbye.md",
					data: enc("two"),
					lixcol_version_id: versionId as unknown as any,
				},
				{
					path: "/src/index.ts",
					data: enc("three"),
					lixcol_version_id: versionId as unknown as any,
				},
			])
			.execute();

		const res = await listFiles({ lix, version_id: versionId, query: "doc" });
		expect(res.paths).toEqual(["/docs/goodbye.md", "/docs/hello.md"].sort());
	});

	test("prefix + ext + pagination", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		await lix.db
			.insertInto("file_all")
			.values([
				{
					path: "/notes/a.md",
					data: enc("a"),
					lixcol_version_id: versionId as unknown as any,
				},
				{
					path: "/notes/b.md",
					data: enc("b"),
					lixcol_version_id: versionId as unknown as any,
				},
				{
					path: "/notes/c.txt",
					data: enc("c"),
					lixcol_version_id: versionId as unknown as any,
				},
				{
					path: "/notes/d.md",
					data: enc("d"),
					lixcol_version_id: versionId as unknown as any,
				},
			])
			.execute();

		const res = await listFiles({
			lix,
			version_id: versionId,
			prefix: "/notes/",
			ext: ".md",
			limit: 2,
			order_by: "path",
			order: "asc",
		});
		expect(res.paths).toEqual(["/notes/a.md", "/notes/b.md"]);

		const res2 = await listFiles({
			lix,
			version_id: versionId,
			prefix: "/notes/",
			ext: "md",
			limit: 2,
			offset: 2,
			order_by: "path",
			order: "asc",
		});
		expect(res2.paths).toEqual(["/notes/d.md"]);
	});

	test("exclude hidden when include_hidden=false", async () => {
		const lix = await openLix({});
		const versionId = await getActiveVersionId(lix);
		await lix.db
			.insertInto("file_all")
			.values([
				{
					path: "/visible.md",
					data: enc("v"),
					hidden: false,
					lixcol_version_id: versionId as unknown as any,
				},
				{
					path: "/hidden.md",
					data: enc("h"),
					hidden: true,
					lixcol_version_id: versionId as unknown as any,
				},
			])
			.execute();

		const res = await listFiles({
			lix,
			version_id: versionId,
			include_hidden: false,
		});
		expect(res.paths).toEqual(["/visible.md"]);
	});
});
