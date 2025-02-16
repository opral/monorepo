import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("uses the locale from getLocale() if no locale is provided", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable", "baseLocale"],
			urlPatterns: [
				{
					pattern: "http://:domain(.*)/:locale?/:path(.*)",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: { de: { locale: "de" }, en: { locale: "en" } },
				},
			],
		},
	});

	runtime.defineGetLocale(() => "de");

	expect(runtime.localizeHref("/hello")).toBe("/de/hello");
	expect(runtime.deLocalizeHref("/de/hello")).toBe("/hello");
});

test("returns an absolute href if the provided href is absolute", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable", "baseLocale"],
			urlPatterns: [
				{
					pattern: "http://:domain(.*)/:locale?/:path(.*)",
					deLocalizedNamedGroups: { locale: null },
					localizedNamedGroups: { de: { locale: "de" }, en: { locale: "en" } },
				},
			],
		},
	});

	expect(
		runtime.localizeHref("http://example.com/hello", { locale: "de" })
	).toBe("http://example.com/de/hello");
	expect(runtime.deLocalizeHref("http://example.com/de/hello")).toBe(
		"http://example.com/hello"
	);
});

// useful if domain based localization is used for example
test("returns an absolute href if the provided href is relative but the origin of the localized href differs", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable", "baseLocale"],
			urlPatterns: [
				{
					pattern: "http://:domain(.*)/:path(.*)",
					deLocalizedNamedGroups: { domain: "example.com" },
					localizedNamedGroups: {
						de: { domain: "de.example.com" },
						en: { domain: "example.com" },
					},
				},
			],
		},
	});

	// simulating routing from current en page to de page
	runtime.defineGetLocale(() => "en");

	expect(runtime.localizeHref("/hello", { locale: "de" })).toBe(
		"http://de.example.com/hello"
	);
	expect(runtime.deLocalizeHref("http://de.example.com/hello")).toBe(
		"http://example.com/hello"
	);

	// simulating routing from current de page to en page
	runtime.defineGetLocale(() => "de");

	expect(runtime.localizeHref("/hello", { locale: "en" })).toBe(
		"http://example.com/hello"
	);
	expect(runtime.deLocalizeHref("http://example.com/hello")).toBe(
		"http://example.com/hello"
	);
});

// https://github.com/opral/inlang-paraglide-js/issues/362
test("adding a base path", async () => {
	const base = "shop";

	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: ":protocol://:domain(.*)::port?/:base?/:locale(en|de)?/:path(.*)",
					deLocalizedNamedGroups: { base },
					localizedNamedGroups: {
						en: { base, locale: "en" },
						de: { base, locale: "de" },
					},
				},
			],
		},
	});

	expect(runtime.localizeHref("/about")).toBe("/shop/en/about");
	expect(runtime.deLocalizeHref("/about")).toBe("/shop/about");
});
