import memfs from "memfs";
import type fs from "node:fs/promises";
import { it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
	vi.resetModules();
});

it("should write the output to a non-existing directory", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	await writeOutput({
		directory: "/output",
		output: { "test.txt": "test" },
		fs,
	});
	expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
		"test"
	);
});

it.skip("should clear & overwrite output that's already there", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({
		"/output/test.txt": "old",
		"/output/other.txt": "other",
	});

	await writeOutput({
		directory: "/output",
		output: { "test.txt": "new" },
		fs,
	});

	expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
		"new"
	);
	await expect(
		async () => await fs.readFile("/output/other.txt", { encoding: "utf-8" })
	).rejects.toBeDefined();
});

it("should create any missing directories", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	await writeOutput({
		directory: "/output/messages",
		output: {
			"de/test.txt": "de",
			"en/test.txt": "en",
		},
		fs,
	});
	expect(
		await fs.readFile("/output/messages/de/test.txt", { encoding: "utf-8" })
	).toBe("de");
	expect(
		await fs.readFile("/output/messages/en/test.txt", { encoding: "utf-8" })
	).toBe("en");
});

it("should only write once if the output hasn't changed", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	// @ts-expect-error - spy
	fs.writeFile = vi.spyOn(fs, "writeFile");

	const hashes = await writeOutput({
		directory: "/output",
		output: { "test.txt": "test" },
		fs,
	});
	await writeOutput({
		directory: "/output",
		output: { "test.txt": "test" },
		fs,
		previousOutputHashes: hashes,
	});
	expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
		"test"
	);
	expect(fs.writeFile).toHaveBeenCalledTimes(1);
});

it("should write again if the output has changed", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	// @ts-expect-error - spy
	fs.writeFile = vi.spyOn(fs, "writeFile");

	const hashes = await writeOutput({
		directory: "/output",
		output: { "test.txt": "test" },
		fs,
	});
	await writeOutput({
		directory: "/output",
		output: { "test.txt": "test2" },
		fs,
		previousOutputHashes: hashes,
	});
	expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
		"test2"
	);
	expect(fs.writeFile).toHaveBeenCalledTimes(2);
});

it("should write files if output has partially changed", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	// @ts-expect-error - spy
	fs.writeFile = vi.spyOn(fs, "writeFile");

	const hashes = await writeOutput({
		directory: "/output",
		output: { "file1.txt": "test", "file2.txt": "test" },
		fs,
	});

	await writeOutput({
		directory: "/output",
		output: { "file1.txt": "test", "file2.txt": "test2" },
		fs,
		previousOutputHashes: hashes,
	});
	expect(fs.writeFile).toHaveBeenCalledWith("/output/file2.txt", "test2");
	expect(fs.writeFile).toHaveBeenCalledTimes(3);
});

const mockFs = (files: memfs.DirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromJSON(files));
	return _memfs.promises as unknown as typeof fs;
};


