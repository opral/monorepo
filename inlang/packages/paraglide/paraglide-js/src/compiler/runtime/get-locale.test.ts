import { test, expect, vi } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("matching by strategy works", async () => {
	const baseLocale = "en";

	const runtime = await createRuntimeForTesting({
		baseLocale,
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie = "OTHER_COOKIE=blaba;";

	const locale = runtime.getLocale();
	expect(locale).toBe(baseLocale);
});

test("throws if variable is used without baseLocale as fallback strategy", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable"],
		},
	});

	expect(() => runtime.getLocale()).toThrow();

	runtime.setLocale("de");

	expect(runtime.getLocale()).toBe("de");
});

test("retrieves the locale for a url pattern", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "https://example.:tld/:path*",
					localized: [
						["en", "https://example.com/:path*"],
						["de", "https://example.de/:path*"],
					],
				},
			],
		},
	});

	globalThis.window = { location: { href: "https://example.com/page" } } as any;

	expect(runtime.getLocale()).toBe("en");

	globalThis.window = { location: { href: "https://example.de/page" } } as any;

	expect(runtime.getLocale()).toBe("de");
});

test("url pattern strategy doesn't throw during SSR", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url", "baseLocale"],
			urlPatterns: [
				{
					pattern: "https://example.:tld/:path*",
					localized: [
						["en", "https://example.com/:path*"],
						["de", "https://example.de/:path*"],
					],
				},
			],
		},
	});

	expect(() => runtime.getLocale()).not.toThrow();
});

test("doesn't throw for an old cookie locale", async () => {
	const baseLocale = "en";

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie = "PARAGLIDE_LOCALE=fr;";

	const locale = runtime.getLocale();
	expect(locale).toBe(baseLocale);
});

test("returns the preferred locale from navigator.languages", async () => {
	const originalNavigator = globalThis.navigator;

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr", "de"],
		compilerOptions: {
			strategy: ["preferredLanguage"],
		},
	});

	// @ts-expect-error - simulating browser based api
	globalThis.window = {};

	// Mock navigator.languages
	Object.defineProperty(globalThis, "navigator", {
		value: {
			languages: ["fr-FR", "en-US", "de"],
		},
		configurable: true,
	});

	expect(runtime.getLocale()).toBe("fr");

	// Restore original navigator
	Object.defineProperty(globalThis, "navigator", {
		value: originalNavigator,
		configurable: true,
	});
});

test("returns the locale from local storage", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["localStorage"],
			localStorageKey: "PARAGLIDE_LOCALE",
			isServer: "false",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.localStorage = {
		setItem: vi.fn(),
		getItem: vi.fn(() => "de"),
	};

	expect(runtime.getLocale()).toBe("de");
});
