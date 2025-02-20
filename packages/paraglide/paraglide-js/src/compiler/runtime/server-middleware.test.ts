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
