import { describe, it, expect } from "vitest";
import { format } from "./format";
import { UrlObject, format as nativeFormat, parse } from "node:url";

describe.skipIf(() => {
  process.env.NODE_ENV === "production";
})("format", () => {
  it("should format the url", () => {
    const url = parse("https://example.com/foo/bar");
    expect(format(url)).toBe(nativeFormat(url));
  });

  it("should format a URL with query params", () => {
    const url: UrlObject = {
      protocol: "https",
      host: "example.com",
      pathname: "/foo/bar",
      query: {
        foo: "bar",
        baz: "qux",
      },
    };

    expect(format(url)).toBe(nativeFormat(url));
  });

  it("should format a URL with just a pathname", () => {
    const url: UrlObject = {
      pathname: "/foo/bar",
    };

    expect(format(url)).toBe(nativeFormat(url));
  });
});
