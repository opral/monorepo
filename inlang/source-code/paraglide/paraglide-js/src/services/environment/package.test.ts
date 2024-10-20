import { describe, it, expect } from "vitest";
import memfs from "memfs";
import { findPackageJson } from "./package.js";

describe("findPackageJson", () => {
  it("returns the path to the package.json file if it exists", async () => {
    const fs = memfs.createFsFromVolume(
      memfs.Volume.fromNestedJSON({
        "/package.json": JSON.stringify({
          name: "test",
        }),
      }),
    ).promises as unknown as typeof import("node:fs/promises");
    const result = await findPackageJson(fs, "/");
    expect(result).toBe("/package.json");
  });

  it("returns undefined if no package.json file exists", async () => {
    const fs = memfs.createFsFromVolume(memfs.Volume.fromNestedJSON({}))
      .promises as unknown as typeof import("node:fs/promises");

    const result = await findPackageJson(fs, "/");
    expect(result).toBe(undefined);
  });
});
