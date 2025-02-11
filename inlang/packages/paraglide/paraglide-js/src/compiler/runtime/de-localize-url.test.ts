import { expect, test } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("can de-localize urls", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: `http{s}\\://*host.com/de{/*path}`,
					locale: "de",
					deLocalizedPattern: "http{s}\\://*host.com{/*path}",
				},
				// default pathname has locale pattern
				{
					pattern: "http{s}\\://*host.com/fr{/*path}",
					locale: "fr",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
				{
					pattern: "http{s}\\://*host.com{/*path}",
					locale: "en",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
			],
		},
	});
	expect(runtime.deLocalizeUrl("https://example.com/de/about")).toBe(
		"https://example.com/about"
	);
	expect(runtime.deLocalizeUrl("https://example.com/fr/about")).toBe(
		"https://example.com/about"
	);
	expect(runtime.deLocalizeUrl("https://example.com/about")).toBe(
		"https://example.com/about"
	);

	globalThis.window = {
		location: {
			origin: "https://example.com",
		},
	};

	// passing a pathname should only return the pathname, not the full url
	expect(runtime.deLocalizeUrl("/de/about")).toBe(
		"https://example.com/about"
	);
	expect(runtime.deLocalizeUrl("/fr/about")).toBe(
		"https://example.com/about"
	);
	expect(runtime.deLocalizeUrl("/about")).toBe("https://example.com/about");
});
