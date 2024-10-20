import { describe, it, expect } from "vitest";
import { exec, parseRouteDefinition, bestMatch } from "./routeDefinitions.js";

// we're testing known-good vendored in code here, but the test are still helpful to understand the logic

describe("parse_route_id", () => {
  it("should parse a static route id", () => {
    const parsed = parseRouteDefinition("/foo/bar");
    expect(parsed).toEqual({
      params: [],
      pattern: /^\/foo\/bar\/?$/,
    });

    expect(parsed.pattern.exec("/foo/bar")).toBeTruthy();
    expect(parsed.pattern.exec("/not/match")).toBeFalsy();
  });
  it("should parse a route id", () => {
    expect(parseRouteDefinition("/[lang]/test")).toEqual({
      params: [
        {
          chained: false,
          matcher: undefined,
          name: "lang",
          optional: false,
          rest: false,
        },
      ],
      pattern: /^\/([^/]+?)\/test\/?$/,
    });

    expect(parseRouteDefinition("/[[lang]]/test")).toEqual({
      params: [
        {
          chained: true,
          matcher: undefined,
          name: "lang",
          optional: true,
          rest: false,
        },
      ],
      pattern: /^(?:\/([^/]+))?\/test\/?$/,
    });
  });
});

describe("exec", () => {
  it("returns the params of a path with a simple param", () => {
    const routeId = "/foo/[bar]/baz";
    const path = "/foo/123/baz";

    const route = parseRouteDefinition(routeId);
    const match = route.pattern.exec(path);
    if (!match) throw new Error("no match");

    const params = exec(match, route.params, {});
    expect(params).toEqual({ bar: "123" });
  });

  it("works with optional params", () => {
    const routeId = "/foo/[[bar]]/baz";
    const path1 = "/foo/123/baz";
    const path2 = "/foo/baz";

    const route = parseRouteDefinition(routeId);
    const match1 = route.pattern.exec(path1);
    const match2 = route.pattern.exec(path2);
    if (!match1) throw new Error("no match");
    if (!match2) throw new Error("no match");

    const params1 = exec(match1, route.params, {});
    const params2 = exec(match2, route.params, {});
    expect(params1).toEqual({ bar: "123" });
    expect(params2).toEqual({});
  });

  it("works with rest params", () => {
    const routeId = "/foo/[...bar]/baz";
    const path = "/foo/123/456/baz";

    const route = parseRouteDefinition(routeId);
    const match = route.pattern.exec(path);
    if (!match) throw new Error("no match");

    const params = exec(match, route.params, {});
    expect(params).toEqual({ bar: "123/456" });
  });

  it("returns undefined if a matcher is used but not provided", () => {
    const routeId = "/foo/[bar=int]/baz";
    const path = "/foo/123/baz";

    const route = parseRouteDefinition(routeId);
    const match = route.pattern.exec(path);
    if (!match) throw new Error("no match");

    const params = exec(match, route.params, {});
    expect(params).toBeUndefined();
  });

  it("works if the param isn't it's own segment", () => {
    const routeId = "/foo-[bar]-baz";
    const path = "/foo-123-baz";

    const route = parseRouteDefinition(routeId);
    const match = route.pattern.exec(path);
    if (!match) throw new Error("no match");

    const params = exec(match, route.params, {});
    expect(params).toEqual({ bar: "123" });
  });

  it("returns an empty object if there are no params", () => {
    const routeId = "/foo";
    const path = "/foo";

    const route = parseRouteDefinition(routeId);
    const match = route.pattern.exec(path);
    if (!match) throw new Error("no match");

    const params = exec(match, route.params, {});
    expect(params).toEqual({});
  });

  it("works with matchers", () => {
    const routeId = "/foo/[bar=int]/baz";
    const path1 = "/foo/123/baz";
    const path2 = "/foo/abc/baz";

    const route = parseRouteDefinition(routeId);
    const match1 = route.pattern.exec(path1);
    const match2 = route.pattern.exec(path2);
    if (!match1) throw new Error("no match");
    if (!match2) throw new Error("no match");

    const int = (s: string) => !Number.isNaN(parseInt(s, 10));

    const params1 = exec(match1, route.params, { int });
    const params2 = exec(match2, route.params, { int });
    expect(params1).toEqual({ bar: "123" });
    expect(params2).toBeUndefined();
  });
});

describe("bestMatch", () => {
  it.each(permute(["/foo", "/bar"]))("matches a static path", (...routeIds) => {
    const match = bestMatch("/foo", routeIds, {});
    expect(match).toEqual({
      id: "/foo",
      params: {},
    });
  });

  it.each(permute(["/bar/[id]", "/foo/[id]"]))(
    "matches a path with a param",
    (...routeIds) => {
      const match = bestMatch("/bar/123", routeIds, {});
      expect(match).toEqual({
        id: "/bar/[id]",
        params: {
          id: "123",
        },
      });
    },
  );

  it.each(permute(["/foo/[id]/[slug]", "/bar/[id]/[slug]"]))(
    "matches a path with multiple params",
    (...routeIds) => {
      const match = bestMatch("/foo/bar/baz", routeIds, {});
      expect(match).toEqual({
        id: "/foo/[id]/[slug]",
        params: {
          id: "bar",
          slug: "baz",
        },
      });
    },
  );

  it.each(permute(["/foo/[id]/[slug]", "/foo/bar/baz"]))(
    "prefers paths with no params over paths with params",
    (...routeIds) => {
      const match = bestMatch("/foo/bar/baz", routeIds, {});
      expect(match).toEqual({
        id: "/foo/bar/baz",
        params: {},
      });
    },
  );

  it("matches a path with a param that's not it's own segment", () => {
    const match = bestMatch("/foo/bar-123", ["/foo/bar-[id]"], {});
    expect(match).toEqual({
      id: "/foo/bar-[id]",
      params: {
        id: "123",
      },
    });
  });

  it("doesn't match on partial matches", () => {
    const match = bestMatch("/", ["/admin"], {});
    expect(match).toBeUndefined();
  });

  it("prefers matches with fewer params", () => {
    const match = bestMatch(
      "/foo/bar/baz",
      ["/foo/[id]/[slug]", "/foo/[id]/baz"],
      {},
    );
    expect(match).toEqual({
      id: "/foo/[id]/baz",
      params: {
        id: "bar",
      },
    });
  });

  // Test case from https://github.com/opral/inlang-paraglide-js/issues/100
  it.each(
    permute(["/properties/[...rest]", "/properties/custom", "/[...rest]"]),
  )("prefers matches with non-catchall params", (...routeIds) => {
    const match = bestMatch("/properties/custom", routeIds, {});
    expect(match).toEqual({
      id: "/properties/custom",
      params: {},
    });
  });

  it("matches optional catchalls", () => {
    const match = bestMatch("/foo/bar/baz", ["/foo/[[...rest]]"], {});
    expect(match).toEqual({
      id: "/foo/[[...rest]]",
      params: {
        rest: "bar/baz",
      },
    });
  });

  it("doesn't match if the matcher doesn't pass", () => {
    const match = bestMatch("/foo/bar", ["/foo/[params=foo]"], {
      foo: (param) => param === "foo",
    });
    expect(match).toBeUndefined();
  });

  it.each(permute(["/foo/[params=bar]", "/foo/[params=foo]"]))(
    "Uses params to disambiguate",
    (...routeIds) => {
      const match = bestMatch("/foo/bar", routeIds, {
        foo: (param) => param === "foo",
        bar: (param) => param === "bar",
      });
      expect(match).toEqual({
        id: "/foo/[params=bar]",
        params: {
          params: "bar",
        },
      });
    },
  );
});

const permute = <T>(inputArr: T[]): T[][] => {
  const result: T[][] = [];

  const permute = (arr: T[], m: T[] = []) => {
    if (arr.length === 0) {
      result.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = [...arr];
        const next = curr.splice(i, 1);
        permute(curr, [...m, ...next]);
      }
    }
  };

  permute(inputArr);

  return result;
};
