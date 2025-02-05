import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("localizes the path based on the return value of getLocale()", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/*path": {
					en: "/en/*path",
					de: "/de/*path",
				},
			},
		},
	});

	runtime.setLocale("de");

	expect(runtime.localizePath("/about")).toBe("/de/about");

	runtime.setLocale("en");

	expect(runtime.localizePath("/about")).toBe("/en/about");
});

test("trailing slashes are normalized", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/*path": {
					en: "/*path",
					de: "/de/*path",
				},
			},
		},
	});

	expect(runtime.localizePath("/about/", { locale: "de" })).toBe("/de/about");
});

test("adds no trailing slash for the root path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"*path": {
					en: "*path",
					de: "/de*path",
				},
			},
		},
	});

	expect(runtime.localizePath("/", { locale: "de" })).toBe("/de");
});

test("root path stays root path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					en: "/{*path}",
					de: "/de{/*path}",
				},
			},
		},
	});

	expect(runtime.localizePath("/", { locale: "en" })).toBe("/");
	expect(runtime.localizePath("/", { locale: "de" })).toBe("/de");
});

test("catchall pathname pattern", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"*path": {
					en: "/en*path",
					de: "/de*path",
				},
			},
		},
	});

	expect(runtime.localizePath("/about", { locale: "en" })).toBe("/en/about");
	expect(runtime.localizePath("/about", { locale: "de" })).toBe("/de/about");
	expect(runtime.localizePath("/blog/123/suffix", { locale: "en" })).toBe(
		"/en/blog/123/suffix"
	);
	expect(runtime.localizePath("/blog/123/suffix", { locale: "de" })).toBe(
		"/de/blog/123/suffix"
	);
});

test("path parameters", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames: {
				"/blog/:post/suffix": {
					en: "/en/blog/:post/suffix",
					de: "/de/artikel/:post/anhang",
				},
			},
		},
	});

	expect(runtime.localizePath("/blog/532/suffix", { locale: "en" })).toBe(
		"/en/blog/532/suffix"
	);
	expect(runtime.localizePath("/blog/12/suffix", { locale: "de" })).toBe(
		"/de/artikel/12/anhang"
	);
});

test("order of defining pathnames matters", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames: {
				// the catch all has precedence over the parameter pattern
				// because it is defined first
				"/*path": {
					en: "/en/*path",
					de: "/de/*path",
				},
				"/about": {
					en: "/about",
					de: "/uber-uns",
				},
			},
		},
	});

	expect(runtime.localizePath("/about", { locale: "en" })).toBe("/en/about");
});