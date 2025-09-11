import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { writeFile } from "./write-file.js";

function dec(u8: Uint8Array): string {
	return new TextDecoder().decode(u8);
}

describe("write_file tool", () => {
	test("creates a new file and overwrites", async () => {
		const lix = await openLix({});

		const res1 = await writeFile({ lix, path: "/hello.txt", content: "hi" });
		expect(res1.created).toBe(true);
		expect(res1.updated).toBe(false);
		expect(res1.size).toBe(2);

		const res2 = await writeFile({ lix, path: "/hello.txt", content: "world" });
		expect(res2.created).toBe(false);
		expect(res2.updated).toBe(true);
		expect(res2.size).toBe(5);

		const row = await lix.db
			.selectFrom("file")
			.where("path", "=", "/hello.txt")
			.select(["data"])
			.executeTakeFirstOrThrow();
		expect(dec(row.data as unknown as Uint8Array)).toBe("world");
	});

	test("appends when mode=append", async () => {
		const lix = await openLix({});

		await writeFile({ lix, path: "/a.md", content: "A" });
		const res = await writeFile({
			lix,
			path: "/a.md",
			content: "B",
			mode: "append",
		});
		expect(res.updated).toBe(true);
		const row = await lix.db
			.selectFrom("file")
			.where("path", "=", "/a.md")
			.select(["data"])
			.executeTakeFirstOrThrow();
		expect(dec(row.data as unknown as Uint8Array)).toBe("AB");
	});
});
