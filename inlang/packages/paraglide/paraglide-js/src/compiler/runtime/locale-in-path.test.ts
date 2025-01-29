import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("returns the locale from the path", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "en-US"],
	});

	const path = "/en-US/about";
	const locale = runtime.localeInPath(path);
	expect(locale).toBe("en-US");
});

test("returns undefined if isLocale is false", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
	});

	const path = "/en-US/about";
	const locale = runtime.localeInPath(path);
	expect(locale).toBe(undefined);
});
