import { newProject } from "@inlang/sdk";
import { expect, test, vi } from "vitest";
import { createParaglide } from "../create-paraglide.js";

test("matching by strategy works", async () => {
	const baseLocale = "en";

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale,
				locales: ["en", "de"],
			},
		}),
		strategy: ["cookie", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie = "OTHER_COOKIE=blaba;";

	const locale = runtime.getLocale();
	expect(locale).toBe(baseLocale);
});

test("throws if variable is used without baseLocale as fallback strategy", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["globalVariable"],
	});

	expect(() => runtime.getLocale()).toThrow();

	runtime.setLocale("de");

	expect(runtime.getLocale()).toBe("de");
});

test("retrieves the locale for a url pattern", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
		isServer: "false",
		urlPatterns: [
			{
				pattern: "https://example.:tld/:path*",
				localized: [
					["en", "https://example.com/:path*"],
					["de", "https://example.de/:path*"],
				],
			},
		],
	});

	globalThis.window = { location: { href: "https://example.com/page" } } as any;

	expect(runtime.getLocale()).toBe("en");

	globalThis.window = { location: { href: "https://example.de/page" } } as any;

	expect(runtime.getLocale()).toBe("de");
});

test("url pattern strategy doesn't throw during SSR", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
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
	});

	expect(() => runtime.getLocale()).not.toThrow();
});

test("doesn't throw for an old cookie locale", async () => {
	const baseLocale = "en";

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["cookie", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie = "PARAGLIDE_LOCALE=fr;";

	const locale = runtime.getLocale();
	expect(locale).toBe(baseLocale);
});

test("returns the preferred locale from navigator.languages", async () => {
	const originalNavigator = globalThis.navigator;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		isServer: "false",
		strategy: ["preferredLanguage"],
	});

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
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["localStorage"],
		localStorageKey: "PARAGLIDE_LOCALE",
		isServer: "false",
	});

	// @ts-expect-error - global variable definition
	globalThis.localStorage = {
		setItem: vi.fn(),
		getItem: vi.fn(() => "de"),
	};

	expect(runtime.getLocale()).toBe("de");
});

test("initially sets the locale after resolving it for the first time", async () => {
	// Create runtime with multiple strategies
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url", "cookie"],
		isServer: "false",
		cookieName: "PARAGLIDE_LOCALE",
		urlPatterns: [
			{
				pattern: "https://example.com/:path*",
				localized: [
					["en", "https://example.com/en/:path*"],
					["de", "https://example.com/de/:path*"],
					["fr", "https://example.com/fr/:path*"],
				],
			},
		],
	});

	// Setup global objects for URL strategy
	globalThis.window = {
		// @ts-expect-error - global variable definition
		location: {
			hostname: "example.com",
			href: "https://example.com/de/page",
		},
	};

	// Create a spy on the internal _locale variable to verify it was set
	// We can do this by checking if setLocale works without explicitly setting it first
	// @ts-expect-error - global variable definition
	globalThis.document = { cookie: "" };

	// First call to getLocale should resolve and set the locale
	expect(runtime.getLocale()).toBe("de");
	// Cookie should be set, proving that the locale was initially set
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=de; path=/; max-age=34560000"
	);
	expect(globalThis.window.location.href).toBe("https://example.com/de/page");
});

test("returns locale from custom strategy", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-client", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-client", {
		getLocale: () => "fr",
		setLocale: () => {},
	});

	const locale = runtime.getLocale();
	expect(locale).toBe("fr");
});

test("falls back to next strategy when custom strategy returns undefined", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["custom-undefined", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-undefined", {
		getLocale: () => undefined,
		setLocale: () => {},
	});

	const locale = runtime.getLocale();
	expect(locale).toBe("en"); // Should fall back to baseLocale
});

test("throws error if custom strategy returns invalid locale", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["custom-invalid", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-invalid", {
		getLocale: () => "invalid-locale",
		setLocale: () => {},
	});

	expect(() => runtime.getLocale()).toThrow();
});

test("custom strategy takes precedence over built-in strategies in getLocale", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = { cookie: "PARAGLIDE_LOCALE=fr" };

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-priority", "cookie", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-priority", {
		getLocale: () => "de",
		setLocale: () => {},
	});

	const locale = runtime.getLocale();
	expect(locale).toBe("de"); // Should use custom strategy, not cookie
});

test("multiple custom strategies work in order in getLocale", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-first", "custom-second", "baseLocale"],
		isServer: "false",
	});

	// Define two custom strategies
	runtime.defineCustomClientStrategy("custom-first", {
		getLocale: () => undefined, // This one returns undefined
		setLocale: () => {},
	});

	runtime.defineCustomClientStrategy("custom-second", {
		getLocale: () => "fr", // This one returns a locale
		setLocale: () => {},
	});

	const locale = runtime.getLocale();
	expect(locale).toBe("fr"); // Should use second custom strategy
});

test("custom strategy works with session storage simulation", async () => {
	// Simulate a custom strategy that reads from session storage
	let sessionData = "de";

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-session", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-session", {
		getLocale: () => sessionData,
		setLocale: (locale) => {
			sessionData = locale;
		},
	});

	const locale = runtime.getLocale();
	expect(locale).toBe("de");
});

test("custom strategy integrates with locale initialization", async () => {
	// @ts-expect-error - global variable definition
	globalThis.window = {};

	// Define a custom strategy that tracks if it was called
	let getLocaleCalled = false;
	let setLocaleCalled = false;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-tracking"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-tracking", {
		getLocale: () => {
			getLocaleCalled = true;
			return "fr";
		},
		setLocale: () => {
			setLocaleCalled = true;
		},
	});

	// First call should trigger the custom strategy
	const locale = runtime.getLocale();
	expect(locale).toBe("fr");
	expect(getLocaleCalled).toBe(true);

	// Setting the locale should also call the custom strategy
	runtime.setLocale("de");

	// The locale should be set internally after first resolution
	expect(setLocaleCalled).toBe(true);
});
