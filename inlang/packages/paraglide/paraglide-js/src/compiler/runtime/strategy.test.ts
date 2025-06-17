import { test, expect, describe, beforeEach } from "vitest";
import { newProject } from "@inlang/sdk";
import {
	defineCustomServerStrategy,
	defineCustomClientStrategy,
	isCustomStrategy,
} from "./strategy.js";
import { createParaglide } from "../create-paraglide.js";

describe("isCustomStrategy", () => {
	test("returns true for valid custom strategy patterns", () => {
		expect(isCustomStrategy("custom-header")).toBe(true);
		expect(isCustomStrategy("custom-auth123")).toBe(true);
		expect(isCustomStrategy("custom-API")).toBe(true);
		expect(isCustomStrategy("custom-sessionStorage")).toBe(true);
		expect(isCustomStrategy("custom-oAuth2")).toBe(true);
		expect(isCustomStrategy("custom-a")).toBe(true);
		expect(isCustomStrategy("custom-1")).toBe(true);
		expect(isCustomStrategy("custom-Z")).toBe(true);
		expect(isCustomStrategy("custom-9")).toBe(true);
		expect(isCustomStrategy("custom-aZ19")).toBe(true);
	});

	test("returns false for invalid custom strategy patterns", () => {
		expect(isCustomStrategy("")).toBe(false);
		expect(isCustomStrategy("custom_")).toBe(false);
		expect(isCustomStrategy("custom-")).toBe(false);
		expect(isCustomStrategy("header")).toBe(false);
		expect(isCustomStrategy("custom")).toBe(false);
		expect(isCustomStrategy("custom-invalid-name")).toBe(false);
		expect(isCustomStrategy("custom-invalid_name")).toBe(false);
		expect(isCustomStrategy("custom-invalid name")).toBe(false);
		expect(isCustomStrategy("custom-invalid@")).toBe(false);
		expect(isCustomStrategy("Custom-header")).toBe(false);
		expect(isCustomStrategy("CUSTOM-header")).toBe(false);
		expect(isCustomStrategy(null)).toBe(false);
		expect(isCustomStrategy(undefined)).toBe(false);
		expect(isCustomStrategy(123)).toBe(false);
		expect(isCustomStrategy({})).toBe(false);
		expect(isCustomStrategy([])).toBe(false);
	});

	test("returns false for built-in strategy names", () => {
		expect(isCustomStrategy("cookie")).toBe(false);
		expect(isCustomStrategy("baseLocale")).toBe(false);
		expect(isCustomStrategy("globalVariable")).toBe(false);
		expect(isCustomStrategy("url")).toBe(false);
		expect(isCustomStrategy("preferredLanguage")).toBe(false);
		expect(isCustomStrategy("localStorage")).toBe(false);
	});
});

describe.each([
	["defineCustomServerStrategy", defineCustomServerStrategy],
	["defineCustomClientStrategy", defineCustomClientStrategy],
])("%s", (strategyName, defineStrategy) => {
	beforeEach(() => {
		// Reset global variables before each test
		if (typeof globalThis !== "undefined") {
			// @ts-expect-error - Testing environment cleanup
			delete globalThis.document;
			// @ts-expect-error - Testing environment cleanup
			delete globalThis.window;
			// @ts-expect-error - Testing environment cleanup
			delete globalThis.localStorage;
			// @ts-expect-error - Testing environment cleanup
			delete globalThis.navigator;
		}
	});

	const defaultHandler = { getLocale: () => "en", setLocale: () => {} };

	const invalidInputs = [
		["", "empty name"],
		["invalid-name", "names with hyphens"],
		["invalid_name", "names with underscores"],
		["@invalid", "names with special characters (@)"],
		["invalid!", "names with special characters (!)"],
		["inva lid", "names with spaces"],
	];

	test.each(invalidInputs)(
		`${strategyName} throws error for %s (%s)`,
		(input) => {
			expect(() => defineStrategy(input, defaultHandler)).toThrow(
				`Invalid custom strategy: "${input}". Must be a custom strategy following the pattern custom-<name> where <name> contains only alphanumeric characters.`
			);
		}
	);

	test(`${strategyName} should compile with custom strategies in strategy array`, async () => {
		// Test that compile accepts custom strategies
		const runtime = await createParaglide({
			blob: await newProject({
				settings: {
					baseLocale: "en",
					locales: ["en", "de", "fr"],
				},
			}),
			strategy: ["custom-auth", "custom-header", "cookie", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
		});

		// Verify the runtime contains the strategy array
		expect(runtime.strategy).toEqual([
			"custom-auth",
			"custom-header",
			"cookie",
			"baseLocale",
		]);
	});
});
