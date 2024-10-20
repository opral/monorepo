import { describe, it, expect, vi } from "vitest";
import { pathExists } from "./exists.js";
import memfs from "memfs";
import nodeFsPromises from "node:fs/promises";
import { createNodeishMemoryFs, type NodeishFilesystem } from "@lix-js/fs";

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
  const lixFs = createNodeishMemoryFs();
  for (const prop in nodeFsPromises) {
    // @ts-ignore - memfs has the same interface as node:fs/promises
    if (typeof nodeFsPromises[prop] !== "function") continue;

    // @ts-ignore - memfs dies not have a watch interface - quick fix should be updated
    if (nodeFsPromises[prop].name === "watch") {
      // @ts-ignore - memfs has the same interface as node:fs/promises
      vi.spyOn(_memfs.promises, prop).mockImplementation(lixFs[prop]);
    } else {
      if (prop in _memfs.promises) {
        // @ts-ignore - memfs has the same interface as node:fs/promises
        vi.spyOn(_memfs.promises, prop);
      }
    }
  }
  return _memfs.promises as NodeishFilesystem;
};
