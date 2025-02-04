import { expect, test } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";
import { match as pathToRegexp } from "path-to-regexp";

test("wildcard pattern", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	// wildcard pattern
	expect(matchPathnamePattern("/*path", "/about")).toBeTruthy();
	expect(pathToRegexp("/*path")("/about")).toBeTruthy();

	expect(matchPathnamePattern("/*path", "/about/xyz")).toBeTruthy();
	expect(pathToRegexp("/*path")("/about/xyz")).toBeTruthy();

	// wildcard with suffix
	expect(
		matchPathnamePattern("/*path/suffix", "/about/xyz/suffix")
	).toBeTruthy();
	expect(pathToRegexp("/*path/suffix")("/about/xyz/suffix")).toBeTruthy();

	expect(
		matchPathnamePattern("/*path/suffix", "/about/xyz/suffix/peter")
	).toBeFalsy();
	expect(pathToRegexp("/*path/suffix")("/about/xyz/suffix/peter")).toBeFalsy();
});

test("parameter pattern", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	// parameter pattern
	expect(pathToRegexp("/:post")("/123")).toMatchObject({
		params: { post: "123" },
	});
	expect(matchPathnamePattern("/:post", "/123")).toMatchObject({
		params: { post: "123" },
	});

	expect(pathToRegexp("/:post")("/123/")).toMatchObject({
		params: { post: "123" },
	});
	expect(matchPathnamePattern("/:post", "/123/")).toMatchObject({
		params: { post: "123" },
	});

	// parameter with suffix
	expect(matchPathnamePattern("/:post/suffix", "/123/suffix")).toMatchObject({
		params: { post: "123" },
	});
	expect(pathToRegexp("/:post/suffix")("/123/suffix")).toMatchObject({
		params: { post: "123" },
	});
});

test("optional parameter pattern", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	expect(pathToRegexp("/users{/:id}/delete")("/users/delete")).toMatchObject({
		params: {},
	});
	expect(
		pathToRegexp("/users{/:id}/delete")("/users/123/delete")
	).toMatchObject({
		params: { id: "123" },
	});

	expect(
		matchPathnamePattern("/users{/:id}/delete", "/users/delete")
	).toMatchObject({
		params: {},
	});
	expect(
		matchPathnamePattern("/users{/:id}/delete", "/users/123/delete")
	).toMatchObject({
		params: { id: "123" },
	});
});
