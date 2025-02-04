import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

// test("localizes the path based on the return value of getLocale()", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 	});

// 	runtime.setLocale("de");

// 	const path = "/about";
// 	const l10nPath = runtime.localizePath(path);

// 	expect(l10nPath).toBe("/de/about");
// });

// test("keeps trailing slashes if provided", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 	});

// 	const path = "/about/";
// 	const l10nPath = runtime.localizePath(path, { locale: "de" });

// 	expect(l10nPath).toBe("/de/about/");
// });

// test("adds no trailing slash for the root path", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 	});

// 	const path = "/";
// 	const l10nPath = runtime.localizePath(path, { locale: "de" });

// 	expect(l10nPath).toBe("/de");
// });

// test("removes the base locale from the path if pathnamePrefixDefaultLocale = false", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			pathnamePrefixDefaultLocale: false,
// 		},
// 	});

// 	const path = "/de/about";
// 	const l10nPath = runtime.localizePath(path, { locale: "en" });

// 	expect(l10nPath).toBe("/about");
// });

// test("adds the base locale to the path if pathnamePrefixDefaultLocale = true", async () => {
// 	const runtime = await createRuntimeForTesting({
// 		baseLocale: "en",
// 		locales: ["en", "de"],
// 		compilerOptions: {
// 			pathnamePrefixDefaultLocale: true,
// 		},
// 	});

// 	const path = "/de/about";
// 	const l10nPath = runtime.localizePath(path, { locale: "en" });

// 	expect(l10nPath).toBe("/en/about");
// });


test("does not add a slash suffix if it's the root path that is already localized", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/";
	const l10nPath = runtime.localizePath(path, { locale: "de" });

	expect(l10nPath).toBe("/");
});

test("catchall pathname pattern", async () => {
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

	expect(runtime.localizePath("/about", { locale: "en" })).toBe("/en/about");
	expect(runtime.localizePath("/about", { locale: "de" })).toBe("/de/about");
	expect(runtime.localizePath("/blog/123/suffix", { locale: "en" })).toBe(
		"/en/blog/123/suffix"
	);
	expect(runtime.localizePath("/blog/123/suffix", { locale: "de" })).toBe(
		"/de/blog/123/suffix"
	);
});

test("localizes with the provided pathnames", async () => {
	const pathnames = {
		"/about": {
			en: "/about",
			de: "/uber-uns",
		},
		"/blog/:post/suffix": {
			en: "/en/blog/:post/suffix",
			de: "/de/artikel/:post/anhang",
		},
	};

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames,
		},
	});

	// all match
	expect(runtime.localizePath("/something", { locale: "en" })).toBe(
		"/en/something"
	);

	expect(runtime.localizePath("/something", { locale: "de" })).toBe(
		"/de/something"
	);

	// overwrites
	expect(runtime.localizePath("/about", { locale: "en" })).toBe("/about");
	expect(runtime.localizePath("/about", { locale: "de" })).toBe("/uber-uns");
	expect(runtime.localizePath("/blog/532/suffix", { locale: "en" })).toBe(
		"/en/blog/532/suffix"
	);
	expect(runtime.localizePath("/blog/12/suffix", { locale: "de" })).toBe(
		"/de/artikel/12/anhang"
	);
});