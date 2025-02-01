import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("removes the locale from a localized path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/de/home";
	const result = runtime.deLocalizePath(path);

	expect(result).toBe("/home");
});

test("returns the same path if there is no locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/home";
	const result = runtime.deLocalizePath(path);

	expect(result).toBe("/home");
});

test("handles paths with different locales", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
	});

	const path = "/fr/contact";
	const result = runtime.deLocalizePath(path);

	expect(result).toBe("/contact");
});

test("handles paths with no segments after locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnamePrefixDefaultLocale: true,
		},
	});

	const path = "/en/";
	const result = runtime.deLocalizePath(path);

	expect(result).toBe("/");
});

test("handles paths that are already the root", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/";
	const result = runtime.deLocalizePath(path);

	expect(result).toBe("/");
});

test("delocalized a localized path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/about": {
					en: "/UK/about",
					de: "/ueber-uns",
				},
				"/about/team": {
					en: "/UK/about/team",
					de: "/ueber-uns/team",
				},
			},
		},
	});

	expect(runtime.deLocalizePath("/ueber-uns")).toBe("/about");
	expect(runtime.deLocalizePath("/UK/about")).toBe("/about");
	expect(runtime.deLocalizePath("/ueber-uns/team")).toBe("/about/team");
	expect(runtime.deLocalizePath("/UK/about/team")).toBe("/about/team");
});