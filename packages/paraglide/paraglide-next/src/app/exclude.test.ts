import { describe, it, expect } from "vitest";
import { createExclude } from "./exclude";

describe("createExclude", () => {
  it("excludes paths", () => {
    const exclude = createExclude(["/exclude"]);
    expect(exclude("/exclude")).toBe(true);

    expect(exclude("/exclude/other")).toBe(false);
    expect(exclude("/other")).toBe(false);
  });

  it("excludes paths with regex", () => {
    const exclude = createExclude(["/exclude", /^\/other/]);
    expect(exclude("/exclude")).toBe(true);
    expect(exclude("/exclude/other")).toBe(false);
    expect(exclude("/other")).toBe(true);
    expect(exclude("/other/path")).toBe(true);
    expect(exclude("/other/path/other")).toBe(true);
  });
});
