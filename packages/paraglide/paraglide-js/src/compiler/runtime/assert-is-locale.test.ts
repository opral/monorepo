import { newProject } from "@inlang/sdk";
import { expect, test } from "vitest";
import { createParaglide } from "../create-paraglide.js";

test("throws if the locale is not available", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});

	expect(() => runtime.assertIsLocale("es")).toThrow();
});

test("throws for non-string inputs", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});

	expect(() => runtime.assertIsLocale(null)).toThrow();
	expect(() => runtime.assertIsLocale(undefined)).toThrow();
	expect(() => runtime.assertIsLocale(123)).toThrow();
	expect(() => runtime.assertIsLocale({})).toThrow();
	expect(() => runtime.assertIsLocale([])).toThrow();
});

test("passes if the locale is available", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});
	expect(() => runtime.assertIsLocale("en")).not.toThrow();
});

test("the return value is a Locale", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});

	const locale = runtime.assertIsLocale("en");

	// a bit of a wacky test given that locale is `any`
	// in the ambient type definition
	locale satisfies Locale;
});

test("is case-insensitive", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "pt-BR", "de-ch"],
			},
		}),
	});

	expect(() => runtime.assertIsLocale("EN")).not.toThrow();
	expect(() => runtime.assertIsLocale("pt-br")).not.toThrow();
	expect(() => runtime.assertIsLocale("de-CH")).not.toThrow();

	expect(runtime.assertIsLocale("EN")).toBe("en");
	expect(runtime.assertIsLocale("pT-bR")).toBe("pt-BR");
	expect(runtime.assertIsLocale("de-CH")).toBe("de-ch");
});
