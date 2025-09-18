import { describe, expect, test } from "vitest";
import { readFile } from "./read-file.js";
import { openLix } from "@lix-js/sdk";

function enc(s: string): Uint8Array {
	return new TextEncoder().encode(s);
}

describe("readFile / createReadFileTool", () => {
	test("reads a small UTF-8 file by path (readFile)", async () => {
		const lix = await openLix({});
		// seed a file
		await lix.db
			.insertInto("file")
			.values({ path: "/notes.md", data: enc("# Title\nHello world\n") })
			.execute();

		const res = await readFile({ lix, path: "/notes.md" });

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
		const content = "ABCDEFGHIJ"; // 10 bytes ascii
		await lix.db
			.insertInto("file")
			.values({ path: "/a.txt", data: enc(content) })
			.execute();

		const res = await readFile({
			lix,
			path: "/a.txt",
			byteOffset: 3,
			byteLength: 4,
		});
		expect(res.text).toBe("DEFG");
		expect(res.byteOffset).toBe(3);
		expect(res.byteLength).toBe(4);
	});

	test("supports line slicing after decode (readFile)", async () => {
		const lix = await openLix({});
		const content = ["line1", "line2", "line3", "line4"].join("\n");
		await lix.db
			.insertInto("file")
			.values({ path: "/b.txt", data: enc(content) })
			.execute();

		const res = await readFile({
			lix,
			path: "/b.txt",
			lineOffset: 1,
			lineLimit: 2,
		});
		expect(res.text).toBe(["line2", "line3"].join("\n"));
	});

	test("clamps by maxChars (readFile)", async () => {
		const lix = await openLix({});
		const content = "X".repeat(1000);
		await lix.db
			.insertInto("file")
			.values({ path: "/c.txt", data: enc(content) })
			.execute();

		const res = await readFile({ lix, path: "/c.txt", maxChars: 100 });
		expect(res.text.length).toBe(100);
		expect(res.truncated).toBe(true);
	});
});
