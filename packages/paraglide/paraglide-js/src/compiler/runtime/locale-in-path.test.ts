import { test, expect, vi, describe, afterEach } from "vitest";
import { localeInPath } from "./locale-in-path.js";

// sequential to avoid global variable conflicts
describe.sequential("", () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	test("returns the locale from the path", () => {
		// @ts-expect-error - global variable definition
		globalThis.isLocale = vi.fn().mockReturnValue(true);

		const path = "/en-US/about";
		const locale = localeInPath(path);
		expect(locale).toBe("en-US");
	});

	test("returns undefined if isLocale is false", () => {
		// @ts-expect-error - global variable definition
		globalThis.isLocale = vi.fn().mockReturnValue(false);

		const path = "/en-US/about";
		const locale = localeInPath(path);
		expect(locale).toBe(undefined);
	});
});
