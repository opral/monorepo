import { describe, it, expect, vi } from "vitest";
import { pathExists } from "./exists.js";
import memfs from "memfs";

describe("pathExists", () => {
	it("returns true if the file does exist", async () => {
		const fs = mockFiles({
			"/test.txt": "hello",
		});

		const result = await pathExists("/test.txt", fs);
		expect(result).toBe(true);
	});

	it("returns false if the file does not exist", async () => {
		const fs = mockFiles({
			"/test.txt": "hello",
		});

		const result = await pathExists("/does-not-exist.txt", fs);
		expect(result).toBe(false);
	});

	it("returns true if the path is a directory", async () => {
		const fs = mockFiles({
			"/test/test.txt": "Hello",
		});

		const result = await pathExists("/test", fs);
		expect(result).toBe(true);
	});
});

const mockFiles = (files: memfs.NestedDirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromNestedJSON(files));
	return _memfs.promises as any;
};
