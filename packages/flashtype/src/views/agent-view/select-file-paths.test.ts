import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { selectFilePaths } from "./select-file-paths";

async function seedFiles(
	lix: Awaited<ReturnType<typeof openLix>>,
	paths: string[],
) {
	await lix.db
		.insertInto("file")
		.values(
			paths.map((path, index) => ({
				id: `f_${index}`,
				path,
				data: new Uint8Array(),
			})) as any,
		)
		.execute();
}

describe("selectFilePaths", () => {
	test("returns sorted limited list", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await seedFiles(lix, ["/b.ts", "/docs/readme.md", "/a.ts", "/c.ts"]);

		const rows = await selectFilePaths({ lix, limit: 3 }).execute();
		expect(rows.map((row: any) => String(row.path))).toEqual([
			"/a.ts",
			"/b.ts",
			"/c.ts",
		]);
	});
});
