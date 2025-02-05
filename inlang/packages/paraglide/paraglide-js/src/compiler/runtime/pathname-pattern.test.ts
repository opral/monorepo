import { expect, test } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";
import { match as pathToRegexp } from "path-to-regexp";

test("static pattern", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	// static pattern
	expect(pathToRegexp("/about")("/about")).toMatchObject(
		matchPathnamePattern("/about", "/about") as any
	);

	// static pattern with trailing slash
	expect(pathToRegexp("/about")("/about/")).toMatchObject(
		matchPathnamePattern("/about", "/about/") as any
	);

	// static pattern with suffix
	expect(pathToRegexp("/about/suffix")("/about/suffix")).toMatchObject(
		matchPathnamePattern("/about/suffix", "/about/suffix") as any
	);

	// both don't match because suffix has leading suffix (peter)
	expect([
		matchPathnamePattern("/about/suffix", "/about/suffix/peter"),
		pathToRegexp("/about/suffix")("/about/suffix/peter"),
	]).toStrictEqual([undefined, false]);
});

test("wildcard pattern", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	// wildcard pattern
	expect(pathToRegexp("/*path")("/about")).toMatchObject(
		matchPathnamePattern("/*path", "/about") as any
	);

	// wildcard with suffix
	expect(pathToRegexp("/*path/suffix")("/about/xyz/suffix")).toMatchObject(
		matchPathnamePattern("/*path/suffix", "/about/xyz/suffix") as any
	);

	// both don't match because suffix has leading suffix (peter)
	expect([
		matchPathnamePattern("/*path/suffix", "/about/xyz/suffix/peter"),
		pathToRegexp("/*path/suffix")("/about/xyz/suffix/peter"),
	]).toStrictEqual([undefined, false]);
});

test("parameter pattern", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	// parameter pattern
	expect(pathToRegexp("/:post")("/123")).toMatchObject(
		matchPathnamePattern("/:post", "/123") as any
	);

	// parameter pattern with trailing slash
	expect(pathToRegexp("/:post")("/123/")).toMatchObject(
		matchPathnamePattern("/:post", "/123/") as any
	);

	// parameter with suffix
	expect(matchPathnamePattern("/:post/suffix", "/123/suffix")).toMatchObject(
		matchPathnamePattern("/:post", "/123") as any
	);
});

test("optional parameter pattern", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	expect(pathToRegexp("/users{/:id}/delete")("/users/delete")).toMatchObject(
		matchPathnamePattern("/users{/:id}/delete", "/users/delete") as any
	);
	expect(
		pathToRegexp("/users{/:id}/delete")("/users/123/delete")
	).toMatchObject(
		matchPathnamePattern("/users{/:id}/delete", "/users/123/delete") as any
	);
});
