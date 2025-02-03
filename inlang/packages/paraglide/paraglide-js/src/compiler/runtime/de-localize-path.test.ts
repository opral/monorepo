import { test, expect } from "vitest";
import { createRuntimeForTesting } from "./create-runtime.js";

test("returns the path as if if no pathnames are defined", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: undefined,
		},
	});

	expect(() => runtime.deLocalizePath("/home")).toThrowError();
});

test("handles path that is the root", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			pathnames: {
				"/(.*)": {
					de: "/de(.*)",
					en: "/(.*)",
				},
			},
		},
	});

	expect(runtime.deLocalizePath("/")).toBe("/");
	expect(runtime.deLocalizePath("/de")).toBe("/");
});

test("delocalizes a localized paths", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames: {
				"/about": {
					en: "/UK/about",
					de: "/uber-uns",
				},
				"/blog/:post/suffix": {
					en: "/en/blog/:post/suffix",
					de: "/de/artikel/:post/anhang",
				},
				"/:path*": {
					en: "/en/:path",
					de: "/de/:path",
				},
			},
		},
	});

	// check simple cases
	expect(runtime.deLocalizePath("/uber-uns")).toBe("/about");
	expect(runtime.deLocalizePath("/UK/about")).toBe("/about");

	// check parameters
	expect(runtime.deLocalizePath("/de/artikel/123/anhang")).toBe(
		"/blog/123/suffix"
	);
	expect(runtime.deLocalizePath("/en/blog/123/suffix")).toBe(
		"/blog/123/suffix"
	);

	// check wild cards
	expect(runtime.deLocalizePath("/de/something")).toBe("/something");
	expect(runtime.deLocalizePath("/en/something")).toBe("/something");
});

test("handles query parameters", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames: {
				"/:path*": {
					en: "/en/:path",
					de: "/de/:path",
				},
			},
		},
	});

	expect(runtime.deLocalizePath("/en/something?query=123&other=5")).toBe(
		"/something?query=123&other=5"
	);
});

test("handles regex groups in combination with named groups", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames: {
				"/blog/:post/(\\d+)": {
					en: "/en/blog/:post/(\\d+)",
					de: "/de/artikel/:post/(\\d+)",
				},
			},
		},
	});

	// something is not a degit
	expect(() => runtime.deLocalizePath("/en/blog/123/something")).toThrowError();

	// 456 is a degit, should work
	expect(runtime.deLocalizePath("/en/blog/123/456")).toBe("/blog/123/456");

	// should work for german as well
	expect(runtime.deLocalizePath("/de/artikel/123/456")).toBe("/blog/123/456");
});

test("handles non capturing groups", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["pathname"],
			pathnames: {
				"/product{/old}?": {
					en: "/en/product{/old}?",
					de: "/de/product{/old}?",
				},
			},
		},
	});

	expect(runtime.deLocalizePath("/en/product")).toBe("/product");
	expect(runtime.deLocalizePath("/en/product/old")).toBe("/product/old");
	expect(runtime.deLocalizePath("/de/product")).toBe("/product");
	expect(runtime.deLocalizePath("/de/product/old")).toBe("/product/old");
});