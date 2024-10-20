import memfs from "memfs";
import type fs from "node:fs/promises";
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("write output", () => {
  it("should write the output to a non-existing directory", async () => {
    const { writeOutput } = await import("./write-output.js");
    const fs = mockFs({});

    await writeOutput("/output", { "test.txt": "test" }, fs);
    expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
      "test",
    );
  });

  it("should clear & overwrite output that's already there", async () => {
    const { writeOutput } = await import("./write-output.js");
    const fs = mockFs({
      "/output/test.txt": "old",
      "/output/other.txt": "other",
    });

    await writeOutput("/output", { "test.txt": "new" }, fs);

    expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
      "new",
    );
    await expect(
      async () => await fs.readFile("/output/other.txt", { encoding: "utf-8" }),
    ).rejects.toBeDefined();
  });

  it("should create any missing directories", async () => {
    const { writeOutput } = await import("./write-output.js");
    const fs = mockFs({});

    await writeOutput(
      "/output/messages",
      {
        "de/test.txt": "de",
        "en/test.txt": "en",
      },
      fs,
    );
    expect(
      await fs.readFile("/output/messages/de/test.txt", { encoding: "utf-8" }),
    ).toBe("de");
    expect(
      await fs.readFile("/output/messages/en/test.txt", { encoding: "utf-8" }),
    ).toBe("en");
  });

  it("should only write once if the output hasn't changed", async () => {
    const { writeOutput } = await import("./write-output.js");
    const fs = mockFs({});

    // @ts-ignore
    fs.writeFile = vi.spyOn(fs, "writeFile");

    await writeOutput("/output", { "test.txt": "test" }, fs);
    await writeOutput("/output", { "test.txt": "test" }, fs);
    expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
      "test",
    );
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it("should write again if the output has changed", async () => {
    const { writeOutput } = await import("./write-output.js");
    const fs = mockFs({});

    // @ts-ignore
    fs.writeFile = vi.spyOn(fs, "writeFile");

    await writeOutput("/output", { "test.txt": "test" }, fs);
    await writeOutput("/output", { "test.txt": "test2" }, fs);
    expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe(
      "test2",
    );
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });
});

const mockFs = (files: memfs.DirectoryJSON) => {
  const _memfs = memfs.createFsFromVolume(memfs.Volume.fromJSON(files));
  return _memfs.promises as unknown as typeof fs;
};
