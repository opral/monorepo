import { test, expect, vi, describe } from "vitest";
import { getLocaleFromPath } from "./get-locale-from-path.js";

// sequential to avoid global variable conflicts
describe.sequential("", () => {
	test("returns the locale from the path", () => {
		// @ts-expect-error - global variable definition
		globalThis.isLocale = vi.fn().mockReturnValue(true);

		const path = "/en-US/about";
		const locale = getLocaleFromPath(path);
		expect(locale).toBe("en-US");
	});

	test("returns undefined if isLocale is false", () => {
		// @ts-expect-error - global variable definition
		globalThis.isLocale = vi.fn().mockReturnValue(false);

		const path = "/en-US/about";
		const locale = getLocaleFromPath(path);
		expect(locale).toBe(undefined);
	});
});
