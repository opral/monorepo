import { assertLocale } from "./assert-locale.js";
import { test, expect } from "vitest";
import { mockRuntime } from "./mock-runtime.js";

mockRuntime({
	baseLocale: "en",
	locales: ["en", "de", "fr"],
});

test("throws if the locale is not available", () => {
	expect(() => assertLocale("es")).toThrow();
});

test("passes if the locale is available", () => {
	expect(() => assertLocale("en")).not.toThrow();
});

test("the return value is a Locale", () => {
	const locale = assertLocale("en");

	// a bit of a wacky test given that locale is `any`
	// in the ambient type definition
	locale satisfies Locale;
});
