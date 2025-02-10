import { expect, test } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("pathnameBase", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnameBase: "/base",
			strategy: ["globalVariable", "baseLocale"],
		},
	});

	// using localizePath in should auto inject the base path to avoid
	// problems with routing frameworks
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
