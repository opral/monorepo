import { test, expect, vi } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("sets the cookie to a different locale", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = {};
	// @ts-expect-error - global variable definition
	globalThis.window = {};
	// @ts-expect-error - global variable definition
	globalThis.window.location = {};
	globalThis.window.location.reload = vi.fn();

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	globalThis.document.cookie = "PARAGLIDE_LOCALE=en";

	runtime.setLocale("de");

	// set the locale
	expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=de; path=/");
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

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "https://example.:tld/:path*",
					deLocalizedNamedGroups: { tld: "com" },
					localizedNamedGroups: {
						en: { tld: "com" },
						de: { tld: "de" },
					},
				},
			],
		},
	});

	globalThis.window.location.href = "https://example.com/page";

	runtime.setLocale("de");

	expect(globalThis.window.location.href).toBe("https://example.de/page");
	// setting window.location.hostname automatically reloads the page
	expect(globalThis.window.location.reload).not.toBeCalled();
});

// `!document.cookie` was used which returned false for an empty string
test("sets the cookie when it's an empty string", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	/** @ts-expect-error - client side api */
	globalThis.document = { cookie: "" };

	runtime.setLocale("en");

	expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=en; path=/");
});

test("when strategy precedes URL, it should set the locale and re-direct to the URL", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:locale/:path(.*)?",
					deLocalizedNamedGroups: { locale: "en" },
					localizedNamedGroups: {
						en: { locale: "en" },
						fr: { locale: "fr" },
					},
				},
			],
		},
	});

	/** @ts-expect-error - client side api */
	globalThis.document = { cookie: "PARAGLIDE_LOCALE=fr" };
	globalThis.window = {
		location: new URL("https://example.com/fr/some-path"),
	} as any;

	// Cookie strategy should determine locale as French
	expect(runtime.getLocale()).toBe("fr");

	runtime.setLocale("en");

	expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=en; path=/");
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
	globalThis.window.location = {};
	globalThis.window.location.reload = vi.fn();

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	globalThis.document.cookie = "PARAGLIDE_LOCALE=en; path=/";

	// Setting to the current locale (en)
	runtime.setLocale("en");

	// Cookie should remain unchanged
	expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=en; path=/");
	// Should not trigger a reload
	expect(globalThis.window.location.reload).not.toBeCalled();

	// Setting to a different locale should still work
	runtime.setLocale("de");
	expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=de; path=/");
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

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["localStorage"],
		},
	});

	runtime.setLocale("de");

	expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
		"PARAGLIDE_LOCALE",
		"de"
	);
});
