import { test, vi, beforeEach, expect, describe } from "vitest";
import { localizePath } from "./localize-path.js";
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
		const l10nPath = localizePath(path);

		expect(l10nPath).toBe("/de/about");
	});

	test("keeps trailing slashes if provided", () => {
		const path = "/about/";
		const l10nPath = localizePath(path, { locale: "de" });

		expect(l10nPath).toBe("/de/about/");
	});

	test("adds no trailing slash for the root path", () => {
		const path = "/";
		const l10nPath = localizePath(path, { locale: "de" });

		expect(l10nPath).toBe("/de");
	});

	test("removes the base locale from the path", () => {
		// @ts-expect-error - global variable definition
		globalThis.baseLocale = "en";

		const path = "/de/about";
		const l10nPath = localizePath(path, { locale: "en" });

		expect(l10nPath).toBe("/about");
	});

	test("does not add a slash suffix if it's the root path that is already localized", () => {
		const path = "/de";
		const l10nPath = localizePath(path, { locale: "de" });

		expect(l10nPath).toBe("/de");
	});
});
