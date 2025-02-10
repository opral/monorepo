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
