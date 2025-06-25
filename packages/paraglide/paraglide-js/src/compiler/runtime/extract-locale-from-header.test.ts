import { test, expect } from "vitest";
import { createParaglide } from "../create-paraglide.js";
import { newProject } from "@inlang/sdk";

test("returns the preferred locale from Accept-Language header", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
	});

	// simple direct match
	const request = new Request("http://example.com", {
		headers: {
			"Accept-Language": "en-US;q=0.8,fr;q=0.9,de;q=0.6",
		},
	});
	const locale = runtime.extractLocaleFromHeader(request);
	expect(locale).toBe("fr");

	// language tag match
	const request2 = new Request("http://example.com", {
		headers: {
			"Accept-Language": "en-US;q=0.8,nl;q=0.9,de;q=0.7",
		},
	});
	const locale2 = runtime.extractLocaleFromHeader(request2);
	// Since "nl" isn't in our locales, and "de" has the highest q-value after "nl"
	expect(locale2).toBe("en");

	// no match
	const request3 = new Request("http://example.com", {
		headers: {
			"Accept-Language": "nl;q=0.9,es;q=0.6",
		},
	});
	const locale3 = runtime.extractLocaleFromHeader(request3);
	expect(locale3).toBeUndefined();
});

test("returns undefined if no Accept-Language header is present", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr", "de"],
			},
		}),
	});

	const request = new Request("http://example.com");
	const locale = runtime.extractLocaleFromHeader(request);
	expect(locale).toBeUndefined();
});
