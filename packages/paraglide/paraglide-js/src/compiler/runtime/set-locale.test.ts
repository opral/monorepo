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
			isServer: "false",
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	globalThis.document.cookie = "PARAGLIDE_LOCALE=en";

	runtime.setLocale("de");

	expect(globalThis.document.cookie).toBe("PARAGLIDE_LOCALE=de");
	expect(globalThis.window.location.reload).toBeCalled();
});
