import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("localizes the path based on the return value of getLocale()", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	runtime.setLocale("de");

	const path = "/about";
	const l10nPath = runtime.localizePath(path);

	expect(l10nPath).toBe("/de/about");
});

test("keeps trailing slashes if provided", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/about/";
	const l10nPath = runtime.localizePath(path, { locale: "de" });

	expect(l10nPath).toBe("/de/about/");
});

test("adds no trailing slash for the root path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/";
	const l10nPath = runtime.localizePath(path, { locale: "de" });

	expect(l10nPath).toBe("/de");
});

test("removes the base locale from the path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/de/about";
	const l10nPath = runtime.localizePath(path, { locale: "en" });

	expect(l10nPath).toBe("/about");
});

test("does not add a slash suffix if it's the root path that is already localized", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const path = "/de";
	const l10nPath = runtime.localizePath(path, { locale: "de" });

	expect(l10nPath).toBe("/de");
});
