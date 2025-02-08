import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("matches root path and paths", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					de: "/de{/*path}",
					en: "/en{/*path}",
				},
			},
		},
	});

	expect(runtime.localizePath("/", { locale: "en" })).toBe("/en");
	expect(runtime.localizePath("/something", { locale: "en" })).toBe(
		"/en/something"
	);
});

test("localizes the path based on the return value of getLocale()", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					en: "/en{/*path}",
					de: "/de{/*path}",
				},
			},
		},
	});

	runtime.setLocale("de");

	expect(runtime.localizePath("/about")).toBe("/de/about");

	runtime.setLocale("en");

	expect(runtime.localizePath("/about")).toBe("/en/about");
});

test("trailing slashes are kept as is", async () => {
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

	expect(runtime.localizePath("/about/", { locale: "de" })).toBe("/de/about/");
});

test("root path stays root path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					de: "/de{/*path}",
					en: "/{*path}",
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
				"/{*path}": {
					en: "/en{/*path}",
					de: "/de{/*path}",
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
				"/{*path}": {
					en: "/en{/*path}",
					de: "/de{/*path}",
				},
				"/about": {
					en: "/en/about",
					de: "/de/uber-uns",
				},
			},
		},
	});

	const runtime2 = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames: {
				// the catch all has precedence over the parameter pattern
				// because it is defined first
				"/about": {
					en: "/en/about",
					de: "/de/uber-uns",
				},
				"/{*path}": {
					en: "/en{/*path}",
					de: "/de{/*path}",
				},
			},
		},
	});

	expect(runtime.localizePath("/about", { locale: "en" })).toBe("/en/about");
	expect(runtime.localizePath("/about", { locale: "de" })).toBe("/de/about");
	expect(runtime2.localizePath("/about", { locale: "en" })).toBe("/en/about");
	expect(runtime2.localizePath("/about", { locale: "de" })).toBe(
		"/de/uber-uns"
	);
});

test("handles query parameters", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					en: "/en{/*path}",
					de: "/de{/*path}",
				},
			},
		},
	});

	expect(runtime.localizePath("/about?query=1", { locale: "en" })).toBe(
		"/en/about?query=1"
	);
});

test("does not double localize already localized paths", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/{*path}": {
					en: "/en{/*path}",
					de: "/de{/*path}",
				},
			},
		},
	});

	// path is already localized
	expect(runtime.localizePath("/en/about", { locale: "en" })).toBe("/en/about");
});

test("handles TREE_SHAKE_DEFAULT_PATHNAMES", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			// auto creates default pathnames for all locales
			pathnames: undefined,
		},
	});

	expect(runtime.localizePath("/about", { locale: "en" })).toBe("/about");
	expect(runtime.localizePath("/about", { locale: "de" })).toBe("/de/about");
	expect(runtime.localizePath("/about/", { locale: "de" })).toBe("/de/about/");
	expect(runtime.localizePath("/de/about", { locale: "de" })).toBe("/de/about");
});