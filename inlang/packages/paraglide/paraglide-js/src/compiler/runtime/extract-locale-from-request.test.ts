import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("returns the locale from the cookie", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});
	const request = new Request("http://example.com", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
		},
	});
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("fr");
});

test("returns the locale from the pathname", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "https://example.com/:locale/:path*",
					deLocalizedNamedGroups: { locale: "en" },
					localizedNamedGroups: {
						en: { locale: "en" },
					},
				},
			],
		},
	});
	const request = new Request("https://example.com/en/home");
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("en");
});

test("returns the baseLocale if no other strategy matches", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
		compilerOptions: {
			strategy: ["baseLocale"],
		},
	});
	const request = new Request("http://example.com");
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("en");
});

test("throws an error for unsupported strategy", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
		compilerOptions: {
			// @ts-expect-error - unsupported strategy
			strategy: ["unsupported"],
		},
	});
	const request = new Request("http://example.com");
	expect(() => runtime.extractLocaleFromRequest(request)).toThrow(
		"Unsupported strategy: unsupported"
	);
});

test("throws an error if no locale is found", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en"],
		compilerOptions: {
			strategy: ["cookie"],
		},
	});
	const request = new Request("http://example.com");
	expect(() => runtime.extractLocaleFromRequest(request)).toThrow(
		"No locale found. There is an error in your strategy. Try adding 'baseLocale' as the very last strategy."
	);
});

test("returns the preferred locale from Accept-Language header", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr", "de"],
		compilerOptions: {
			strategy: ["preferredLanguage"],
		},
	});

	// simple direct match
	const request = new Request("http://example.com", {
		headers: {
			"Accept-Language": "en-US;q=0.8,fr;q=0.9,de;q=0.6",
		},
	});
	const locale = runtime.extractLocaleFromRequest(request);
	expect(locale).toBe("fr");

	// testing fallback
	const request2 = new Request("http://example.com", {
		headers: {
			"Accept-Language": "en-US;q=0.8",
		},
	});
	const locale2 = runtime.extractLocaleFromRequest(request2);
	expect(locale2).toBe("en");
});
