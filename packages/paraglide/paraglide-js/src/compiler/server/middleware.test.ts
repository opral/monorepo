import { test, expect } from "vitest";
import { createRuntimeForTesting } from "../runtime/create-runtime.js";

test("sets the locale and origin", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url", "globalVariable"],
		},
	});

	// setting the global variable to fr to assure that
	runtime.setLocale("fr");

	// simulating multiple requests that could interfere with each other
	await Promise.all([
		runtime.paraglideMiddleware(
			new Request(new URL("https://example.com/page")),
			() => {
				expect(runtime.getLocale()).toBe("en");
				expect(runtime.getUrlOrigin()).toBe("https://example.com");
				return new Response();
			}
		),
		runtime.paraglideMiddleware(
			new Request(new URL("https://peter.com/de/page")),
			() => {
				expect(runtime.getLocale()).toBe("de");
				expect(runtime.getUrlOrigin()).toBe("https://peter.com");
				return new Response();
			}
		),
	]);

	// global variable is not impacted by middleware
	expect(runtime.getLocale()).toBe("fr");
});

test("delocalizes the url if the url strategy is used and returns the locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
		},
	});

	const request = new Request(new URL("https://example.com/de/page"));

	const result = await runtime.paraglideMiddleware(request, (args) => {
		expect(args.locale).toBe("de");
		expect(args.request.url).toBe("https://example.com/page");
		return new Response("Hello World");
	});

	expect(await result.text()).toBe("Hello World");
});

test("does not delocalize the url if the url strategy is not used", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["globalVariable", "baseLocale"],
		},
	});

	const request = new Request(new URL("https://example.com/de/page"));

	const result = await runtime.paraglideMiddleware(request, (args) => {
		expect(args.locale).toBe("en");
		expect(args.request.url).toBe("https://example.com/de/page");
		return new Response("Hello World");
	});

	expect(await result.text()).toBe("Hello World");
});

test("redirects to localized URL when non-URL strategy determines locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:locale/:path(.*)?",
					deLocalizedNamedGroups: { locale: "en" },
					localizedNamedGroups: {
						en: { locale: "en" },
						fr: { locale: "fr" },
					},
				},
			],
		},
	});

	// Request to URL in en with cookie specifying French
	const request = new Request("https://example.com/en/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
		},
	});

	const response = await runtime.paraglideMiddleware(request, () => {
		// This shouldn't be called since we should redirect
		throw new Error("Should not reach here");
	});

	expect(response instanceof Response).toBe(true);
	// needs to be 307 status code https://github.com/opral/inlang-paraglide-js/issues/416
	expect(response.status).toBe(307); // Redirect status code
	expect(response.headers.get("Location")).toBe(
		"https://example.com/fr/some-path"
	);
});

test("does not redirect if URL already matches determined locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:locale/:path(.*)?",
					deLocalizedNamedGroups: { locale: "en" },
					localizedNamedGroups: {
						en: { locale: "en" },
						fr: { locale: "fr" },
					},
				},
			],
		},
	});

	// Request to already localized URL matching cookie locale
	const request = new Request("https://example.com/fr/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
		},
	});

	let middlewareResolveWasCalled = false;
	await runtime.paraglideMiddleware(request, () => {
		middlewareResolveWasCalled = true;
		return new Response();
	});

	expect(middlewareResolveWasCalled).toBe(true); // Middleware should be called since no redirect needed
});

test("works with disableAsyncLocalStorage option", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url", "globalVariable"],
		},
	});

	// Set a global locale to verify it doesn't interfere with request processing
	runtime.setLocale("fr");

	// Create a request with a "de" locale in the URL
	const request = new Request(new URL("https://example.com/de/page"));

	// Process the request with AsyncLocalStorage disabled
	const response = await runtime.paraglideMiddleware(
		request,
		(args) => {
			// Verify we still get the correct locale
			expect(args.locale).toBe("de");
			expect(runtime.getLocale()).toBe("de");
			// Verify URL is still properly delocalized
			expect(args.request.url).toBe("https://example.com/page");
			expect(runtime.getUrlOrigin()).toBe("https://example.com");
			return new Response("hello");
		},
		{ disableAsyncLocalStorage: true }
	);

	// Verify the result contains the correct data
	expect(await response.text()).toBe("hello");

	// Verify that global variable wasn't affected by this request
	expect(runtime.getLocale()).toBe("fr");
});

test("works with sequential parallel requests using disableAsyncLocalStorage", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
		compilerOptions: {
			strategy: ["url", "globalVariable"],
		},
	});

	// setting the global variable to fr to assure that
	runtime.setLocale("fr");

	// simulating multiple requests that could interference with each other
	await Promise.all([
		runtime.paraglideMiddleware(
			new Request(new URL("https://example.com/page")),
			() => {
				expect(runtime.getLocale()).toBe("en");
				expect(runtime.getUrlOrigin()).toBe("https://example.com");
				return new Response();
			},
			{ disableAsyncLocalStorage: true }
		),

		runtime.paraglideMiddleware(
			new Request(new URL("https://peter.com/de/page")),
			() => {
				expect(runtime.getLocale()).toBe("de");
				expect(runtime.getUrlOrigin()).toBe("https://peter.com");
				return new Response();
			},
			{ disableAsyncLocalStorage: true }
		),
	]);

	// global variable is not impacted by middleware
	expect(runtime.getLocale()).toBe("fr");
});

test("multi pathname localization with optional groups", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "http://example.com/:bookstore?/:item?",
					deLocalizedNamedGroups: {
						"bookstore?": "bookstore",
						"item?": "item",
					},
					localizedNamedGroups: {
						de: { "bookstore?": "buchladen", "item?": "artikel" },
						en: { "bookstore?": "bookstore", "item?": "item" },
					},
				},
			],
		},
	});

	// Process the request
	expect(
		await (
			await runtime.paraglideMiddleware(
				new Request(new URL("http://example.com/bookstore")),
				({ locale }) => new Response(locale)
			)
		).text()
	).toBe("en");

	expect(
		await (
			await runtime.paraglideMiddleware(
				new Request(new URL("http://example.com/bookstore/item")),
				({ locale }) => new Response(locale)
			)
		).text()
	).toBe("en");

	expect(
		await (
			await runtime.paraglideMiddleware(
				new Request(new URL("http://example.com/buchladen")),
				({ locale }) => new Response(locale)
			)
		).text()
	).toBe("de");

	expect(
		await (
			await runtime.paraglideMiddleware(
				new Request(new URL("http://example.com/buchladen/artikel")),
				({ locale }) => new Response(locale)
			)
		).text()
	).toBe("de");
});
