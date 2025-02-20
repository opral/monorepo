import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("sets the locale and origin", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url", "globalVariable"],
		},
	});

	// setting the global variable to fr to assure that
	runtime.setLocale("fr");

	// simulating multiple requests that could interfere with each other
	await Promise.all([
		runtime.serverMiddleware(
			new Request(new URL("https://example.com/page")),
			() => {
				expect(runtime.getLocale()).toBe("en");
				expect(runtime.getUrlOrigin()).toBe("https://example.com");
			}
		),

		runtime.serverMiddleware(
			new Request(new URL("https://peter.com/de/page")),
			() => {
				expect(runtime.getLocale()).toBe("de");
				expect(runtime.getUrlOrigin()).toBe("https://peter.com");
			}
		),
	]);

	// global variable is not impacted by middleware
	expect(runtime.getLocale()).toBe("fr");
});


test("delocalizes the url if the url strategy is used and returns the locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
		},
	});

	const request = new Request(new URL("https://example.com/de/page"));

	const result: any = await runtime.serverMiddleware(request, (args) => args);

	expect(result.request.url).toBe("https://example.com/page");
	expect(result.locale).toBe("de");
});

test("does not delocalize the url if the url strategy is not used", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable", "baseLocale"],
		},
	});

	const request = new Request(new URL("https://example.com/de/page"));

	const result = await runtime.serverMiddleware(request, (args) => args);

	expect(result.request.url).toBe("https://example.com/de/page");
	// falling back to baseLocale
	expect(result.locale).toBe("en");
});