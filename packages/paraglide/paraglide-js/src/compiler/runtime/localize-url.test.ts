import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("matches according to the order", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: `http{s}\\://*host.co.uk{/de/*path}`,
					locale: "de",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
				{
					pattern: `http{s}\\://*host.co.uk{/*path}`,
					locale: "en-UK",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
				// default pathname has locale pattern
				{
					pattern: "http{s}\\://*host.com/fr{/*path}",
					locale: "fr",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
				{
					pattern: "http{s}\\://*host.com/de{/*path}",
					locale: "de",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
				{
					pattern: "http{s}\\://*host.com/{*path}",
					locale: "en",
					deLocalizedPattern: "http{s}\\://*host.com/{*path}",
				},
			],
		},
	});

	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "en-UK" })
	).toBe("https://example.co.uk/about");
	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "de" })
	).toBe("https://example.co.uk/de/about");
	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "fr" })
	).toBe("https://example.com/fr/about");
	expect(
		runtime.localizeUrl("https://example.co.uk/about", { locale: "en" })
	).toBe("https://example.com/about");
});

test("can handle relative urls", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr", "en-UK"],
		compilerOptions: {
			urlPatterns: [
				{
					pattern: `http{s}\\://*host.co.uk{/de/*path}`,
					locale: "de",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
				{
					pattern: `http{s}\\://*host.co.uk{/*path}`,
					locale: "en",
					deLocalizedPattern: "http{s}\\://*host.co.uk{/*path}",
				},
			],
		},
	});

	globalThis.window = {
		location: {
			origin: "https://example.co.uk",
		},
	};
	expect(runtime.localizeUrl("/about", { locale: "de" })).toBe(
		"https://example.co.uk/de/about"
	);
	expect(runtime.localizeUrl("/about", { locale: "en" })).toBe(
		"https://example.co.uk/about"
	);
});
