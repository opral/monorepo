import { test, expect } from "vitest";
import { getRedirectPath } from "./getRedirectPath.js";

test("getRedirectPath should return the correct path", () => {
	expect(getRedirectPath("/cl", "/cl", "/changelog")).toBe("/changelog");
	expect(
		getRedirectPath(
			"/documentation/usage",
			"/documentation/usage",
			"/example/usage"
		)
	).toBe("/example/usage");
	expect(
		getRedirectPath("/documentation/usage", "/documentation/*", "/example/*")
	).toBe("/example/usage");
	expect(
		getRedirectPath("/documentation/usage", "/documentation/*", "/example")
	).toBe("/example");
	expect(getRedirectPath("/a", "/*", "/b")).toBe("/b");
});

test("getRedirectPath should return undefined if the path does not match", () => {
	expect(getRedirectPath("/a", "/b", "/c")).toBe(undefined);
	expect(getRedirectPath("/a/*", "/b/*", "/c/*")).toBe(undefined);
	expect(getRedirectPath("/a/*", "/b/*", "/c/*")).toBe(undefined);
});
