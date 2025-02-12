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

test("doesn't throw for server unavailable APIs", async () => {
	// @ts-expect-error - reset document in case it's defined
	globalThis.document = undefined;
	// @ts-expect-error - reset window in case it's defined
	globalThis.window = undefined;
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			// using browser based strategies first, then variable which is available on the server
			strategy: ["pathname", "cookie", "globalVariable", "baseLocale"],
		},
	});

	expect(() => runtime.setLocale("de")).not.toThrow();
	expect(runtime.getLocale()).toBe("de");
});


test("domain strategy sets the hostname", async () => {
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
			strategy: ["domain"],
			domains: {
				de: "example.de",
				en: "example.com",
			},
		},
	});

	runtime.setLocale("de");

	expect(globalThis.window.location.hostname).toBe("example.de");
	// setting window.location.hostname automatically reloads the page
	expect(globalThis.window.location.reload).not.toBeCalled();
});
