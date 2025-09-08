import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { listFiles } from "./list-files.js";

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe("listFiles tool", () => {
  test("lists by query substring", async () => {
    const lix = await openLix({});
    await lix.db
      .insertInto("file")
      .values([
        { path: "/docs/hello.md", data: enc("one") },
        { path: "/docs/goodbye.md", data: enc("two") },
        { path: "/src/index.ts", data: enc("three") },
      ])
      .execute();

    const res = await listFiles({ lix, query: "doc" });
    expect(res.paths).toEqual([
      "/docs/goodbye.md",
      "/docs/hello.md",
    ].sort());
  });

  test("prefix + ext + pagination", async () => {
    const lix = await openLix({});
    await lix.db
      .insertInto("file")
      .values([
        { path: "/notes/a.md", data: enc("a") },
        { path: "/notes/b.md", data: enc("b") },
        { path: "/notes/c.txt", data: enc("c") },
        { path: "/notes/d.md", data: enc("d") },
      ])
      .execute();

    const res = await listFiles({ lix, prefix: "/notes/", ext: ".md", limit: 2, orderBy: "path", order: "asc" });
    expect(res.paths).toEqual(["/notes/a.md", "/notes/b.md"]);

    const res2 = await listFiles({ lix, prefix: "/notes/", ext: "md", limit: 2, offset: 2, orderBy: "path", order: "asc" });
    expect(res2.paths).toEqual(["/notes/d.md"]);
  });

  test("exclude hidden when includeHidden=false", async () => {
    const lix = await openLix({});
    await lix.db
      .insertInto("file")
      .values([
        { path: "/visible.md", data: enc("v"), hidden: false },
        { path: "/hidden.md", data: enc("h"), hidden: true },
      ])
      .execute();

    const res = await listFiles({ lix, includeHidden: false });
    expect(res.paths).toEqual(["/visible.md"]);
  });
});
