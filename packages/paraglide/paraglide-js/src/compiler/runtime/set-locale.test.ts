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
	expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=de");
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
			strategy: ["urlPattern"],
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
