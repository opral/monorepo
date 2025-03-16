import { test, expect } from "vitest";
import { createParaglide } from "../create-paraglide.js";
import "@inlang/paraglide-js/urlpattern-polyfill";

test("generates localized URLs using default URL pattern", async () => {
	const runtime = await createParaglide({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url"],
			// undefined creates the default pattern
			urlPatterns: undefined,
		},
	});

	const urls = runtime.generateStaticLocalizedUrls([
		"http://example.com/about",
		"http://example.com/blog/post-1",
		"http://example.com/contact",
	]);
	const pathnames = urls.map((url) => url.pathname).sort();

	expect(pathnames).toEqual([
		"/about",
		"/blog/post-1",
		"/contact",
		"/de/about",
		"/de/blog/post-1",
		"/de/contact",
		"/fr/about",
		"/fr/blog/post-1",
		"/fr/contact",
	]);

	// All URLs should be URL objects
	expect(urls.every((url) => url instanceof URL)).toBe(true);
});

test("generates localized URLs using custom URL patterns", async () => {
	const runtime = await createParaglide({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "/store/item/:id",
					localized: [
						["en", "/store/item/:id"],
						["de", "/laden/artikel/:id"],
					],
				},
				{
					pattern: "/blog/:slug",
					localized: [
						["en", "/blog/:slug"],
						["de", "/blog/:slug"], // Same pattern for both locales
					],
				},
			],
		},
	});

	const urls = runtime.generateStaticLocalizedUrls([
		"https://example.com/store/item/123",
		"https://example.com/store/item/456",
		"https://example.com/blog/my-post",
	]);

	const pathnames = urls.map((url) => url.pathname).sort();

	expect(pathnames).toEqual([
		"/blog/my-post",
		"/laden/artikel/123",
		"/laden/artikel/456",
		"/store/item/123",
		"/store/item/456",
	]);

	// All URLs should be URL objects
	expect(urls.every((url) => url instanceof URL)).toBe(true);
});

test("handles paths that don't match any pattern by including them", async () => {
	const runtime = await createParaglide({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "https://example.com/store/:path*",
					localized: [
						["en", "https://example.com/store/:path*"],
						["de", "https://example.com/laden/:path*"],
					],
				},
			],
		},
	});

	const urls = runtime.generateStaticLocalizedUrls([
		"https://example.com/store/item/123", // Should match pattern
		"https://example.com/about", // Should not match pattern
		"https://example.com/contact", // Should not match pattern
	]);

	const pathnames = urls.map((url) => url.pathname).sort();

	expect(pathnames).toEqual([
		"/about",
		"/contact",
		"/laden/item/123",
		"/store/item/123",
	]);

	// All URLs should be URL objects
	expect(urls.every((url) => url instanceof URL)).toBe(true);
});

test("handles URL objects as input", async () => {
	const runtime = await createParaglide({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "/store/:path*",
					localized: [
						["en", "/store/:path*"],
						["de", "/laden/:path*"],
					],
				},
			],
		},
	});

	const urls = runtime.generateStaticLocalizedUrls([
		new URL("https://example.com/store/item/123?color=blue#reviews"),
		new URL("https://example.com/store/cart"),
		new URL("https://example.com/about"), // Should not match pattern
	]);

	const pathnames = urls.map((url) => url.pathname).sort();

	expect(pathnames).toEqual([
		"/about",
		"/laden/cart",
		"/laden/item/123",
		"/store/cart",
		"/store/item/123",
	]);

	// Verify search params and hash fragments are preserve
	// All URLs should be URL objects
	expect(urls.every((url) => url instanceof URL)).toBe(true);
});

test("generates localized URLs from paths", async () => {
	const runtime = await createParaglide({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url"],
			// undefined creates the default pattern
			urlPatterns: undefined,
		},
	});

	const urls = runtime.generateStaticLocalizedUrls([
		"/about",
		"/blog/post-1",
		"/contact",
	]);

	const pathnames = urls.map((url) => url.pathname).sort();

	expect(pathnames).toEqual([
		"/about",
		"/blog/post-1",
		"/contact",
		"/de/about",
		"/de/blog/post-1",
		"/de/contact",
		"/fr/about",
		"/fr/blog/post-1",
		"/fr/contact",
	]);

	// All URLs should be URL objects
	expect(urls.every((url) => url instanceof URL)).toBe(true);
});
