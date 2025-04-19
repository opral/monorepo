import { test, expect } from "vitest";
import { createParaglide } from "./create-paraglide.js";
import { newProject } from "@inlang/sdk";

test("createParaglideModule should create a module with runtime and server functions", async () => {
	const paraglide = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	// Check that runtime properties are available
	expect(paraglide.baseLocale).toBe("en");
	expect(paraglide.locales).toEqual(["en", "de", "fr"]);
	expect(typeof paraglide.localizeUrl).toBe("function");
	expect(typeof paraglide.getLocale).toBe("function");
	expect(typeof paraglide.setLocale).toBe("function");

	// Check that server functions are available
	expect(typeof paraglide.paraglideMiddleware).toBe("function");
});

test("createParaglideModule should allow configuring compiler options", async () => {
	const paraglide = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url"],
		cookieName: "custom-cookie",
	});

	// Check that compiler options are applied
	expect(paraglide.strategy).toEqual(["url"]);
	expect(paraglide.cookieName).toBe("custom-cookie");
});

test("createParaglideModule should work with URL localization", async () => {
	const paraglide = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url"],
	});

	// Test URL localization
	const url = "https://example.com/products";
	const localizedUrl = paraglide.localizeUrl(url, { locale: "de" });

	expect(localizedUrl.href).toBe("https://example.com/de/products");

	// Test URL delocalization
	const deLocalizedUrl = paraglide.deLocalizeUrl(localizedUrl);
	expect(deLocalizedUrl.href).toBe(url);
});

test("createParaglideModule should provide mock message functions that throw helpful errors", async () => {
	const paraglide = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
	});

	// Verify m object exists
	expect(paraglide.m).toBeDefined();

	// Verify accessing a message function throws a helpful error
	expect(() => {
		// @ts-expect-error - We're testing runtime behavior
		paraglide.m.someMessage();
	}).toThrow(/Message functions are not available in createParaglideModule/);
});
