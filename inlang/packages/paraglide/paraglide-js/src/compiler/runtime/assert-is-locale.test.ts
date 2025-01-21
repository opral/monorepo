import { assertIsLocale } from "./assert-is-locale.js";
import { test, expect } from "vitest";
import { mockRuntime } from "./mock-runtime.js";

mockRuntime({
	baseLocale: "en",
	locales: ["en", "de", "fr"],
});

test("throws if the locale is not available", () => {
	expect(() => assertIsLocale("es")).toThrow();
});

test("passes if the locale is available", () => {
	expect(() => assertIsLocale("en")).not.toThrow();
});

test("the return value is a Locale", () => {
	const locale = assertIsLocale("en");

	// a bit of a wacky test given that locale is `any`
	// in the ambient type definition
	locale satisfies Locale;
});
