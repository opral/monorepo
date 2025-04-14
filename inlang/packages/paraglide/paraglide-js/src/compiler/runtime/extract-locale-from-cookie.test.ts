import { test, expect } from "vitest";
import { createParaglide } from "../create-paraglide.js";
import { newProject } from "@inlang/sdk";

test("returns undefined if document is not available", async () => {
	// @ts-expect-error - global variable definition
	globalThis.document = undefined;

	const runtime = await createParaglide({
		project: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});

	expect(runtime.extractLocaleFromCookie()).toBeUndefined();
});

test("matches the locale of a cookie", async () => {
	const runtime = await createParaglide({
		project: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		compilerOptions: {
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie =
		"OTHER_COOKIE=fr; PARAGLIDE_LOCALE=de; ANOTHER_COOKIE=en; EXPIRES_COOKIE=es; Max-Age=3600";

	const locale = runtime.extractLocaleFromCookie();
	expect(locale).toBe("de");
});

// useful scenario that avoids throws if the cookie uses an old locale that is
// not supported anymore or development on localhost shares multiple apps with
// different locales
test("returns undefined if the locale is not defined in the locales", async () => {
	const runtime = await createParaglide({
		project: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		compilerOptions: {
			strategy: ["cookie"],
			cookieName: "PARAGLIDE_LOCALE",
		},
	});

	// @ts-expect-error - global variable definition
	globalThis.document = {};
	globalThis.document.cookie = "PARAGLIDE_LOCALE=fr;";

	const locale = runtime.extractLocaleFromCookie();
	expect(locale).toBeUndefined();
});
