import { newProject } from "@inlang/sdk";
import { expect, test } from "vitest";
import { createParaglide } from "../create-paraglide.js";

const runtime = await createParaglide({
	blob: await newProject({
		settings: {
			baseLocale: "en",
			locales: ["en", "pt-BR", "de-ch"],
		},
	}),
});

test("returns true for exact matches", () => {
	expect(runtime.isLocale("pt-BR")).toBe(true);
});

test("is case-insensitive", () => {
	expect(runtime.isLocale("EN")).toBe(true);
	expect(runtime.isLocale("pt-br")).toBe(true);
	expect(runtime.isLocale("de-CH")).toBe(true);
});

test("returns false for non-existent locales", () => {
	expect(runtime.isLocale("es")).toBe(false);
	expect(runtime.isLocale("xx")).toBe(false);
	expect(runtime.isLocale("")).toBe(false);
});

test("returns false for non-string inputs", () => {
	expect(runtime.isLocale(null)).toBe(false);
	expect(runtime.isLocale(undefined)).toBe(false);
	expect(runtime.isLocale(123)).toBe(false);
	expect(runtime.isLocale({})).toBe(false);
	expect(runtime.isLocale([])).toBe(false);
});
