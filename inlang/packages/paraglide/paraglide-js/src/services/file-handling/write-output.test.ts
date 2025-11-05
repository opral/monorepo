import memfs from "memfs";
import type fs from "node:fs/promises";
import { test, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
	vi.resetModules();
});

test("should write the output to a non-existing directory", async () => {
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

test("should clear & overwrite output that's already there", async () => {
        const { writeOutput } = await import("./write-output.js");
        const fs = mockFs({});

        const hashes = await writeOutput({
                directory: "/output",
                output: { "test.txt": "old", "other.txt": "other" },
                fs,
        });

        await writeOutput({
                directory: "/output",
                output: { "test.txt": "new" },
                cleanDirectory: true,
                fs,
                previousOutputHashes: hashes,
        });

        expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
                "new"
        );
        await expect(
                async () => await fs.readFile("/output/other.txt", { encoding: "utf-8" })
        ).rejects.toBeDefined();
});

test("should refuse to clean directories with unknown files", async () => {
        const { writeOutput } = await import("./write-output.js");
        const fs = mockFs({
                "/output/test.txt": "keep me",
        });

        await expect(
                writeOutput({
                        directory: "/output",
                        output: { "messages/en.json": "{}" },
                        cleanDirectory: true,
                        fs,
                })
        ).rejects.toThrowError(/Refusing to clean/);
});

test("should cache directory safety checks", async () => {
        const { writeOutput } = await import("./write-output.js");
        const fs = mockFs({
                "/output/messages/en.json": "{}",
        });
        const readdirSpy = vi.spyOn(fs as any, "readdir");

        const hashes = await writeOutput({
                directory: "/output",
                output: { "messages/en.json": "{}" },
                cleanDirectory: true,
                fs,
        });

        expect(readdirSpy).toHaveBeenCalled();
        const initialCalls = readdirSpy.mock.calls.length;

        await writeOutput({
                directory: "/output",
                output: { "messages/en.json": "{\"hello\":\"world\"}" },
                cleanDirectory: true,
                fs,
                previousOutputHashes: hashes,
        });

        expect(readdirSpy).toHaveBeenCalledTimes(initialCalls);
});

test("should create any missing directories", async () => {
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

test("should only write once if the output hasn't changed", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	const writeFileSpy = vi.spyOn(fs as any, "writeFile");

	const hashes = await writeOutput({
		directory: "/output",
		output: { "test.txt": "test" },
		fs,
	});
	const hashes2 = await writeOutput({
		directory: "/output",
		output: { "test.txt": "test" },
		fs,
		previousOutputHashes: hashes,
	});
	expect(hashes).toEqual(hashes2);
	expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
		"test"
	);
	expect(writeFileSpy).toHaveBeenCalledTimes(1);
});

test("should write again if the output has changed", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	const writeFileSpy = vi.spyOn(fs as any, "writeFile");

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
	expect(writeFileSpy).toHaveBeenCalledTimes(2);
});

test("should write files if output has partially changed", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	const writeFileSpy = vi.spyOn(fs as any, "writeFile");

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
	expect(writeFileSpy).toHaveBeenCalledWith("/output/file2.txt", "test2");
	expect(writeFileSpy).toHaveBeenCalledTimes(3);
});

test("should delete files that have been removed from the output", async () => {
	const { writeOutput } = await import("./write-output.js");
	const fs = mockFs({});

	// First write with three files
	const hashes = await writeOutput({
		directory: "/output",
		output: {
			"file1.txt": "content1",
			"file2.txt": "content2",
			"subdir/file3.txt": "content3",
		},
		fs,
	});

	// Verify all files were written
	expect(await fs.readFile("/output/file1.txt", { encoding: "utf-8" })).toBe(
		"content1"
	);
	expect(await fs.readFile("/output/file2.txt", { encoding: "utf-8" })).toBe(
		"content2"
	);
	expect(
		await fs.readFile("/output/subdir/file3.txt", { encoding: "utf-8" })
	).toBe("content3");

	// Second write with file2.txt removed
	await writeOutput({
		directory: "/output",
		output: {
			"file1.txt": "content1",
			"subdir/file3.txt": "content3updated",
		},
		fs,
		previousOutputHashes: hashes,
	});

	// Verify file1.txt still exists
	expect(await fs.readFile("/output/file1.txt", { encoding: "utf-8" })).toBe(
		"content1"
	);
	// Verify file2.txt has been deleted
	await expect(
		async () => await fs.readFile("/output/file2.txt", { encoding: "utf-8" })
	).rejects.toBeDefined();
	// Verify file3.txt was updated
	expect(
		await fs.readFile("/output/subdir/file3.txt", { encoding: "utf-8" })
	).toBe("content3updated");

	// Get the new hashes
	const newHashes = await writeOutput({
		directory: "/output",
		output: {
			"file1.txt": "content1",
			"subdir/file3.txt": "content3updated",
		},
		fs,
		previousOutputHashes: hashes,
	});

	// Third write with subdir/file3.txt removed
	await writeOutput({
		directory: "/output",
		output: {
			"file1.txt": "content1",
		},
		fs,
		previousOutputHashes: newHashes,
	});

	// Verify file1.txt still exists
	expect(await fs.readFile("/output/file1.txt", { encoding: "utf-8" })).toBe(
		"content1"
	);
	// Verify subdir/file3.txt has been deleted
	await expect(
		async () =>
			await fs.readFile("/output/subdir/file3.txt", { encoding: "utf-8" })
	).rejects.toBeDefined();
	// Verify the subdir directory has also been removed
	await expect(
		async () => await fs.readdir("/output/subdir")
	).rejects.toBeDefined();
});

const mockFs = (files: memfs.DirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromJSON(files));
	return _memfs.promises as unknown as typeof fs;
};
