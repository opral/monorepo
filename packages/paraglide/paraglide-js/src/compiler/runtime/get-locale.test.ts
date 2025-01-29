import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("matching by strategy works", async () => {
	const baseLocale = "en";

	const runtime = await createRuntimeForTesting({
		baseLocale,
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["cookie", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
			isServer: "false",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie = "OTHER_COOKIE=blaba;";

	const locale = runtime.getLocale();
	expect(locale).toBe(baseLocale);
});
