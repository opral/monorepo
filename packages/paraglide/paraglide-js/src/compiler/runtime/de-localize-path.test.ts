import { test, vi, beforeEach, expect, describe } from "vitest";
import { deLocalizePath } from "./de-localize-path.js";
import { mockRuntime } from "./mock-runtime.js";

// sequential to avoid global variable conflicts
describe.sequential("delocalizedPath", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	mockRuntime({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
	});

	test("removes the locale from a localized path", () => {
		// @ts-expect-error - global variable definition
		globalThis.localeInPath = vi.fn().mockReturnValue("de");

		const path = "/de/home";
		const result = deLocalizePath(path);

		expect(result).toBe("/home");
	});

	test("returns the same path if there is no locale", () => {
		// @ts-expect-error - global variable definition
		globalThis.localeInPath = vi.fn().mockReturnValue(undefined);

		const path = "/home";
		const result = deLocalizePath(path);

		expect(result).toBe("/home");
	});

	test("handles paths with different locales", () => {
		// @ts-expect-error - global variable definition
		globalThis.localeInPath = vi.fn().mockReturnValue("fr");

		const path = "/fr/contact";
		const result = deLocalizePath(path);

		expect(result).toBe("/contact");
	});

	test("handles paths with no segments after locale", () => {
		// @ts-expect-error - global variable definition
		globalThis.localeInPath = vi.fn().mockReturnValue("en");

		const path = "/en/";
		const result = deLocalizePath(path);

		expect(result).toBe("/");
	});

	test("handles paths that are already the root", () => {
		// @ts-expect-error - global variable definition
		globalThis.localeInPath = vi.fn().mockReturnValue(undefined);

		const path = "/";
		const result = deLocalizePath(path);

		expect(result).toBe("/");
	});
});
