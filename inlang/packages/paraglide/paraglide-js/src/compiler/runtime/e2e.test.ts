import { expect, test, describe } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

describe.each([
	{ pathnameBase: "/base" },
	{
		pathnameBase: "/base",
		pathnames: {
			"/{*path}": {
				de: "/de{/*path}",
				en: "/{*path}",
			},
		},
	},
])("pathnameBase combinations", (compilerOptions) => {
	test(`pathnames: ${compilerOptions.pathnames}`, async () => {
		const runtime = await createRuntimeForTesting({
			baseLocale: "en",
			locales: ["en", "de"],
			compilerOptions,
		});

		// it should auto inject the base path to avoid problems with routing frameworks
		// that might or might not add the base path
		expect(runtime.localizePath("/hello-world")).toBe("/base/hello-world");

		// app sets the locale to de
		runtime.setLocale("de");

		// localizePath should return the localized path with the base path
		expect(runtime.localizePath("/hello-world")).toBe("/base/de/hello-world");

		// deLocalizePath should remove the locale (de)
		expect(runtime.deLocalizePath("/base/de/hello-world")).toBe(
			"/base/hello-world"
		);

		// routing from a de route to an another locale
		expect(runtime.localizePath("/base/de", { locale: "en" })).toBe("/base");
	});
});

test("domain based strategy works", async () => {
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

	globalThis.window = { location: { hostname: "example.com" } } as any;

	expect(runtime.getLocale()).toBe("en");

	runtime.setLocale("de");

	expect(window.location.hostname).toBe("example.de");
});

test("pathname strategy with locale prefixes e.g. /fr/page works", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "http{s}\\://*domain/de/{*path}",
					locale: "de",
					deLocalizedPattern: "http{s}\\://*domain/{*path}",
				},
				{
					pattern: "http{s}\\://*domain/{*path}",
					locale: "en",
					deLocalizedPattern: "http{s}\\://*domain/{*path}",
				},
			],
		},
	});

	globalThis.window = { location: new URL("https://example.com/") } as any;

	expect(runtime.getLocale()).toBe("en");

	runtime.setLocale("de");

	expect(window.location.href).toBe("https://example.com/de/");
});