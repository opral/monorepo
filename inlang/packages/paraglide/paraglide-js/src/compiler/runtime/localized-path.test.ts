import { test, vi, beforeEach, expect, describe } from "vitest";
import { localizedPath } from "./localized-path.js";
import { mockRuntime } from "./mock-runtime.js";

// sequential to avoid global variable conflicts
describe.sequential("", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	mockRuntime({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	test("localizes the path based on the getLocale definition", () => {
		// @ts-expect-error - global variable definition
		globalThis.getLocale = vi.fn().mockReturnValue("de");

		const path = "/about";
		const l10nPath = localizedPath(path);

		expect(l10nPath).toBe("/de/about");
	});

	test("keeps trailing slashes if provided", () => {
		const path = "/about/";
		const l10nPath = localizedPath(path, { locale: "de" });

		expect(l10nPath).toBe("/de/about/");
	});

	test("removes the base locale from the path", () => {
		// @ts-expect-error - global variable definition
		globalThis.baseLocale = "en";

		const path = "/de/about";
		const l10nPath = localizedPath(path, { locale: "en" });

		expect(l10nPath).toBe("/about");
	});
});
