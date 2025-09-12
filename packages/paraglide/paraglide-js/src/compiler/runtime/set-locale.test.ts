import { newProject } from "@inlang/sdk";
import { expect, test, vi } from "vitest";
import { createParaglide } from "../create-paraglide.js";

test("sets the cookie to a different locale", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = {};
	// @ts-expect-error - global variable definition
	globalThis.window = {};
	// @ts-expect-error - global variable definition
	globalThis.window.location = { hostname: "example.com" };
	globalThis.window.location.reload = vi.fn();

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["cookie"],
		cookieName: "PARAGLIDE_LOCALE",
	});

	globalThis.document.cookie = "PARAGLIDE_LOCALE=en";

	runtime.setLocale("de");

	// set the locale
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=de; path=/; max-age=34560000"
	);
	// reloads the site if window is available
	expect(globalThis.window.location.reload).toBeCalled();
});

test("sets the cookie with explicit domain to a different locale navigating subdomain", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = {};
	// @ts-expect-error - global variable definition
	globalThis.window = {};
	// @ts-expect-error - global variable definition
	globalThis.window.location = { hostname: "web.example.com" };
	globalThis.window.location.reload = vi.fn();

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["cookie"],
		cookieName: "PARAGLIDE_LOCALE",
		cookieDomain: "example.com",
	});

	globalThis.document.cookie = "PARAGLIDE_LOCALE=en";

	runtime.setLocale("de");

	// set the locale
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=de; path=/; max-age=34560000; domain=example.com"
	);
	// reloads the site if window is available
	expect(globalThis.window.location.reload).toBeCalled();
});

test("sets the cookie with explicit domain to a different locale navigating domain", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = {};
	// @ts-expect-error - global variable definition
	globalThis.window = {};
	// @ts-expect-error - global variable definition
	globalThis.window.location = { hostname: "example.com" };
	globalThis.window.location.reload = vi.fn();

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["cookie"],
		cookieName: "PARAGLIDE_LOCALE",
		cookieDomain: "example.com",
	});

	globalThis.document.cookie = "PARAGLIDE_LOCALE=en";

	runtime.setLocale("de");

	// set the locale
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=de; path=/; max-age=34560000; domain=example.com"
	);
	// reloads the site if window is available
	expect(globalThis.window.location.reload).toBeCalled();
});

test("url pattern strategy sets the window location", async () => {
	// @ts-expect-error - global variable definition
	globalThis.window = {};
	// @ts-expect-error - global variable definition
	globalThis.window.location = {};
	globalThis.window.location.hostname = "example.com";
	globalThis.window.location.reload = vi.fn();

	const runtime = await createParaglide({
		blob: await newProject({
			settings: { baseLocale: "en", locales: ["en", "de"] },
		}),
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
	});

	globalThis.window.location.href = "https://example.com/page";

	runtime.setLocale("de");

	expect(globalThis.window.location.href).toBe("https://example.de/page");
	// setting window.location.hostname automatically reloads the page
	expect(globalThis.window.location.reload).not.toBeCalled();
});

// `!document.cookie` was used which returned false for an empty string
test("sets the cookie when it's an empty string", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["cookie"],
		cookieName: "PARAGLIDE_LOCALE",
	});

	/** @ts-expect-error - client side api */
	globalThis.document = { cookie: "" };

	runtime.setLocale("en");

	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=en; path=/; max-age=34560000"
	);
});

test("when strategy precedes URL, it should set the locale and re-direct to the URL", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
		strategy: ["cookie", "url", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
		isServer: "false",
		urlPatterns: [
			{
				pattern: "https://example.com/en/:path(.*)?",
				localized: [
					["en", "https://example.com/en/:path(.*)?"],
					["fr", "https://example.com/fr/:path(.*)?"],
				],
			},
		],
	});

	/** @ts-expect-error - client side api */
	globalThis.document = { cookie: "PARAGLIDE_LOCALE=fr" };
	globalThis.window = {
		location: new URL("https://example.com/fr/some-path"),
	} as any;

	// Cookie strategy should determine locale as French
	expect(runtime.getLocale()).toBe("fr");

	runtime.setLocale("en");

	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=en; path=/; max-age=34560000"
	);
	expect(globalThis.window.location.href).toBe(
		"https://example.com/en/some-path"
	);
});

// https://github.com/opral/inlang-paraglide-js/issues/430
test("should not reload when setting locale to current locale", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = {};
	// @ts-expect-error - global variable definition
	globalThis.window = {};
	// @ts-expect-error - global variable definition
	globalThis.window.location = { hostname: "example.com" };
	globalThis.window.location.reload = vi.fn();

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["cookie"],
		cookieName: "PARAGLIDE_LOCALE",
	});

	globalThis.document.cookie = "PARAGLIDE_LOCALE=en; path=/";

	// Setting to the current locale (en)
	runtime.setLocale("en");

	// Cookie should remain unchanged
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=en; path=/; max-age=34560000"
	);
	// Should not trigger a reload
	expect(globalThis.window.location.reload).not.toBeCalled();

	// Setting to a different locale should still work
	runtime.setLocale("de");
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=de; path=/; max-age=34560000"
	);
	expect(globalThis.window.location.reload).toBeCalled();
});

test("sets the locale to localStorage", async () => {
	// @ts-expect-error - global variable definition
	globalThis.localStorage = {
		setItem: vi.fn(),
		getItem: () => "en",
	};

	// @ts-expect-error - global variable definition
	globalThis.window = {};

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["localStorage"],
	});

	runtime.setLocale("de");

	expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
		"PARAGLIDE_LOCALE",
		"de"
	);
});

// Test that all strategies set their respective storage mechanisms
test("should set locale in all configured storage mechanisms regardless of which strategy resolved the locale", async () => {
	// Setup global objects
	// @ts-expect-error - global variable definition
	globalThis.document = { cookie: "" };
	// @ts-expect-error - global variable definition
	globalThis.localStorage = {
		setItem: vi.fn(),
		getItem: () => null,
	};
	// @ts-expect-error - global variable definition
	globalThis.window = {};
	// @ts-expect-error - global variable definition
	globalThis.window.location = {};
	globalThis.window.location.hostname = "example.com";
	globalThis.window.location.href = "https://example.com/en/page";
	globalThis.window.location.reload = vi.fn();

	// Create runtime with multiple strategies
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url", "localStorage", "cookie", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
		urlPatterns: [
			{
				pattern: "https://example.com/:locale/:path*",
				localized: [
					["en", "https://example.com/en/:path*"],
					["de", "https://example.com/de/:path*"],
					["fr", "https://example.com/fr/:path*"],
				],
			},
		],
	});

	// Call setLocale
	runtime.setLocale("fr");

	// Verify that all storage mechanisms are updated
	expect(globalThis.window.location.href).toBe("https://example.com/fr/page");
	expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
		"PARAGLIDE_LOCALE",
		"fr"
	);
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=fr; path=/; max-age=34560000"
	);
});

test("calls setLocale on custom strategy", async () => {
	let customLocale = "en";
	let setLocaleCalled = false;

	globalThis.window = {
		location: { reload: vi.fn() },
	} as any;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-setter", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-setter", {
		getLocale: () => customLocale,
		setLocale: (locale) => {
			customLocale = locale;
			setLocaleCalled = true;
		},
	});

	runtime.setLocale("fr");

	expect(setLocaleCalled).toBe(true);
	expect(customLocale).toBe("fr");
	expect(globalThis.window.location.reload).toHaveBeenCalled();
});

test("calls setLocale on multiple custom strategies", async () => {
	let customLocale1 = "en";
	let customLocale2 = "en";
	let setLocaleCalled1 = false;
	let setLocaleCalled2 = false;

	globalThis.window = {
		location: { reload: vi.fn() },
	} as any;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-multi1", "custom-multi2", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-multi1", {
		getLocale: () => customLocale1,
		setLocale: (locale) => {
			customLocale1 = locale;
			setLocaleCalled1 = true;
		},
	});

	runtime.defineCustomClientStrategy("custom-multi2", {
		getLocale: () => customLocale2,
		setLocale: (locale) => {
			customLocale2 = locale;
			setLocaleCalled2 = true;
		},
	});

	runtime.setLocale("de");

	expect(setLocaleCalled1).toBe(true);
	expect(setLocaleCalled2).toBe(true);
	expect(customLocale1).toBe("de");
	expect(customLocale2).toBe("de");
});

test("awaits async setLocale functions to resolve in custom strategy", async () => {
	let customLocale1 = "en";

	globalThis.window = {
		location: {
			reload: vi.fn(),
		},
	} as any;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-async", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-async", {
		getLocale: () => customLocale1,
		setLocale: async (locale) => {
			customLocale1 = locale;
		},
	});

	const setLocalePromise = runtime.setLocale("de");
	expect(window.location.reload).not.toHaveBeenCalled();

	await setLocalePromise;

	// Verify that setLocale resolved before reload was called
	expect(window.location.reload).toHaveBeenCalledTimes(1);
	expect(customLocale1).toBe("de");
});

test("awaits async setLocale functions to resolve in multiple custom strategies", async () => {
	let customLocale1 = "en";
	let customLocale2 = "en";

	globalThis.window = {
		location: {
			reload: vi.fn(),
		},
	} as any;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-async1", "custom-async2", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-async1", {
		getLocale: () => customLocale1,
		setLocale: async (locale) => {
			customLocale1 = locale;
		},
	});

	runtime.defineCustomClientStrategy("custom-async2", {
		getLocale: () => customLocale2,
		setLocale: async (locale) => {
			customLocale2 = locale;
		},
	});

	const setLocalePromise = runtime.setLocale("de");
	expect(window.location.reload).not.toHaveBeenCalled();

	await setLocalePromise;

	// Verify that setLocale resolved before reload was called
	expect(window.location.reload).toHaveBeenCalledTimes(1);
	expect(customLocale1).toBe("de");
	expect(customLocale2).toBe("de");
});

test("reload should not run if async setLocale function rejects in custom strategy", async () => {
	let customLocale1 = "en";

	globalThis.window = {
		location: {
			reload: vi.fn(),
		},
	} as any;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-async", "baseLocale"],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-async", {
		getLocale: () => customLocale1,
		setLocale: async (locale) => {
			throw new Error("fetch error");
		},
	});

	await expect(() => runtime.setLocale("de")).rejects.toThrowError(
		`Custom strategy "custom-async" setLocale failed: fetch error`
	);

	// Verify that reload was never called
	expect(window.location.reload).toHaveBeenCalledTimes(0);
	expect(customLocale1).toBe("en");
});

test("custom strategy setLocale works with cookie and localStorage", async () => {
	let customData = "en";

	globalThis.document = { cookie: "" } as any;
	globalThis.localStorage = {
		setItem: vi.fn(),
		getItem: () => null,
	} as any;
	globalThis.window = {
		location: {
			hostname: "example.com",
			reload: vi.fn(),
		},
	} as any;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["custom-api", "localStorage", "cookie", "baseLocale"],
		cookieName: "PARAGLIDE_LOCALE",
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-api", {
		getLocale: () => customData,
		setLocale: (locale) => {
			customData = locale;
		},
	});

	runtime.setLocale("fr");

	expect(customData).toBe("fr");
	expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
		"PARAGLIDE_LOCALE",
		"fr"
	);
	expect(globalThis.document.cookie).toBe(
		"PARAGLIDE_LOCALE=fr; path=/; max-age=34560000"
	);
});

test("custom strategy setLocale integrates with URL strategy", async () => {
	let customStoredLocale = "en";

	globalThis.window = {
		location: {
			hostname: "example.com",
			href: "https://example.com/en/page",
			reload: vi.fn(),
		},
	} as any;

	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
		strategy: ["url", "custom-urlIntegration", "baseLocale"],
		urlPatterns: [
			{
				pattern: "https://example.com/:locale/:path*",
				localized: [
					["en", "https://example.com/en/:path*"],
					["fr", "https://example.com/fr/:path*"],
					["de", "https://example.com/de/:path*"],
				],
			},
		],
		isServer: "false",
	});

	runtime.defineCustomClientStrategy("custom-urlIntegration", {
		getLocale: () => customStoredLocale,
		setLocale: (locale) => {
			customStoredLocale = locale;
		},
	});

	runtime.setLocale("de");

	expect(globalThis.window.location.href).toBe("https://example.com/de/page");
	expect(customStoredLocale).toBe("de");
});
