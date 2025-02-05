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

test("wildcard on root with prefixed slash", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	expect([
		matchPathnamePattern("/*path", "/"),
		pathToRegexp("/*path")("/"),
	]).toStrictEqual([undefined, false]);
});

test("wildcard on root with no slash", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	expect(pathToRegexp("*path")("/")).toMatchObject(
		matchPathnamePattern("*path", "/") as any
	);
});

test("optional wildcard", async () => {
	const { matchPathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	expect(pathToRegexp("/{*path}")("/")).toMatchObject(
		matchPathnamePattern("/{*path}", "/") as any
	);

	expect(pathToRegexp("/de{/*path}")("/de")).toMatchObject(
		matchPathnamePattern("/de{/*path}", "/de") as any
	);

	expect(pathToRegexp("/de{/*path}")("/de/etwas")).toMatchObject(
		matchPathnamePattern("/de{/*path}", "/de/etwas") as any
	);
});

test("generating paths from patterns", async () => {
	const { compilePathnamePattern } = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	expect(compilePathnamePattern("/:post", { post: "123" })).toBe("/123");

	expect(
		compilePathnamePattern("/:category/:id", { category: "books", id: "42" })
	).toBe("/books/42");

	expect(compilePathnamePattern("/users{/:id}/delete", { id: "123" })).toBe(
		"/users/123/delete"
	);

	expect(compilePathnamePattern("/users{/:id}/delete", {})).toBe(
		"/users/delete"
	);

	expect(
		compilePathnamePattern("/*path/suffix", { path: ["about", "xyz"] })
	).toBe("/about/xyz/suffix");

	expect(compilePathnamePattern("/*path", { path: ["home"] })).toBe("/home");

	expect(() => compilePathnamePattern("/:post", {})).toThrow(
		'Missing value for parameter ":post"'
	);

	expect(() => compilePathnamePattern("/*path", { path: "home" })).toThrow(
		'Wildcard parameter "*path" must be an array'
	);
});