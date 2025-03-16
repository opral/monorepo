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
			new Request(new URL("https://example.com/page"), {
				headers: { "Sec-Fetch-Dest": "document" },
			}),
			() => {
				expect(runtime.getLocale()).toBe("en");
				expect(runtime.getUrlOrigin()).toBe("https://example.com");
				return new Response();
			}
		),
		runtime.paraglideMiddleware(
			new Request(new URL("https://peter.com/de/page"), {
				headers: { "Sec-Fetch-Dest": "document" },
			}),
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

	const request = new Request(new URL("https://example.com/de/page"), {
		headers: { "Sec-Fetch-Dest": "document" },
	});

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

	const request = new Request(new URL("https://example.com/de/page"), {
		headers: { "Sec-Fetch-Dest": "document" },
	});

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
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Request to URL in en with cookie specifying French
	const request = new Request("https://example.com/en/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
			"Sec-Fetch-Dest": "document",
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
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Request to already localized URL matching cookie locale
	const request = new Request("https://example.com/fr/some-path", {
		headers: {
			"Sec-Fetch-Dest": "document",
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
			disableAsyncLocalStorage: true,
		},
	});

	// Set a global locale to verify it doesn't interfere with request processing
	runtime.setLocale("fr");

	// Create a request with a "de" locale in the URL
	const request = new Request(new URL("https://example.com/de/page"), {
		headers: { "Sec-Fetch-Dest": "document" },
	});

	// Process the request with AsyncLocalStorage disabled
	const response = await runtime.paraglideMiddleware(request, (args) => {
		// Verify we still get the correct locale
		expect(args.locale).toBe("de");
		expect(runtime.getLocale()).toBe("de");
		// Verify URL is still properly delocalized
		expect(args.request.url).toBe("https://example.com/page");
		expect(runtime.getUrlOrigin()).toBe("https://example.com");
		return new Response("hello");
	});

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
			new Request(new URL("https://example.com/page"), {
				headers: { "Sec-Fetch-Dest": "document" },
			}),
			() => {
				expect(runtime.getLocale()).toBe("en");
				expect(runtime.getUrlOrigin()).toBe("https://example.com");
				return new Response();
			}
		),

		runtime.paraglideMiddleware(
			new Request(new URL("https://peter.com/de/page"), {
				headers: { "Sec-Fetch-Dest": "document" },
			}),
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

// https://github.com/opral/inlang-paraglide-js/issues/442
test("falls back to next strategy when cookie contains invalid locale", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url", "baseLocale"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Request with an invalid locale in cookie
	const request = new Request("https://example.com/fr/some-path", {
		headers: {
			"Sec-Fetch-Dest": "document",
			cookie: `PARAGLIDE_LOCALE=invalid_locale`,
		},
	});

	let middlewareResolveWasCalled = false;
	await runtime.paraglideMiddleware(request, (args) => {
		middlewareResolveWasCalled = true;
		// Should fall back to URL strategy, which will detect 'fr' from the URL
		expect(args.locale).toBe("fr");
		return new Response();
	});

	expect(middlewareResolveWasCalled).toBe(true);

	// Try with a request that would fall back to baseLocale
	const baseRequest = new Request("https://example.com/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=invalid_locale`,
		},
	});

	await runtime.paraglideMiddleware(baseRequest, (args) => {
		// Should fall back all the way to baseLocale since URL has no locale
		expect(args.locale).toBe("en");
		return new Response();
	});
});

// not implemented because users should disable redirects by
// making another strategy preceed the url strategy
//
// strategy: ["cookie", "url"]
test.skip("doesn't redirect if disableUrlRedirect is true", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			cookieName: "PARAGLIDE_LOCALE",
			strategy: ["cookie", "url"],
			urlPatterns: [
				{
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Create a request that would normally be redirected
	const request = new Request("https://example.com/en/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
			"Sec-Fetch-Dest": "document",
		},
	});

	// Test with disableUrlRedirect = true
	let middlewareResolveWasCalled = false;
	await runtime.paraglideMiddleware(
		request,
		() => {
			middlewareResolveWasCalled = true;
			return new Response("No redirect");
		}
		// { disableUrlRedirect: true }
	);

	// Middleware should be called since redirect is disabled
	expect(middlewareResolveWasCalled).toBe(true);
});

test("handles URLs with and without trailing slashes", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["url", "baseLocale"],
			urlPatterns: [
				{
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Request with trailing slash
	const requestWithTrailingSlash = new Request("https://example.com/fr/", {
		headers: { "Sec-Fetch-Dest": "document" },
	});

	let middlewareResolveWasCalled = false;
	await runtime.paraglideMiddleware(requestWithTrailingSlash, () => {
		middlewareResolveWasCalled = true;
		return new Response("Success");
	});

	// Middleware should be called since the URL is already properly localized
	// even though it has a trailing slash
	expect(middlewareResolveWasCalled).toBe(true);

	// Request with trailing slash in a deeper path
	const requestWithDeepTrailingSlash = new Request(
		"https://example.com/fr/about/",
		{
			headers: { "Sec-Fetch-Dest": "document" },
		}
	);

	let deepPathResolveWasCalled = false;
	await runtime.paraglideMiddleware(requestWithDeepTrailingSlash, () => {
		deepPathResolveWasCalled = true;
		return new Response("Success");
	});

	// Middleware should be called since the URL is already properly localized
	expect(deepPathResolveWasCalled).toBe(true);

	// nested path with no trailing slash and baseLocale redirect
	const requestWithoutTrailingSlash = new Request(
		"https://example.com/cars/electric",
		{
			headers: { "Sec-Fetch-Dest": "document" },
		}
	);

	const response = await runtime.paraglideMiddleware(
		requestWithoutTrailingSlash,
		() => {
			return new Response("Success");
		}
	);

	expect(response instanceof Response).toBe(true);
	expect(response.status).toBe(307);
	expect(response.headers.get("Location")).toBe(
		"https://example.com/en/cars/electric"
	);

	// Request with no trailing slash
	const requestWithoutSlash = new Request("https://example.com/fr", {
		headers: { "Sec-Fetch-Dest": "document" },
	});

	let middlewareResolveWasCalledWithoutSlash = false;
	await runtime.paraglideMiddleware(requestWithoutSlash, () => {
		middlewareResolveWasCalledWithoutSlash = true;
		return new Response("Success");
	});

	// Middleware should be called since the URL is already properly localized
	expect(middlewareResolveWasCalledWithoutSlash).toBe(true);
});

test("correctly redirects when URL needs localization and retains trailing slash", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Request to URL in en with cookie specifying French and trailing slash
	const requestWithTrailingSlash = new Request(
		"https://example.com/en/some-path/",
		{
			headers: {
				cookie: `PARAGLIDE_LOCALE=fr`,
				"Sec-Fetch-Dest": "document",
			},
		}
	);

	const responseWithTrailingSlash = await runtime.paraglideMiddleware(
		requestWithTrailingSlash,
		() => {
			// This shouldn't be called since we should redirect
			throw new Error("Should not reach here");
		}
	);

	expect(responseWithTrailingSlash instanceof Response).toBe(true);
	expect(responseWithTrailingSlash.status).toBe(307); // Redirect status code
	expect(responseWithTrailingSlash.headers.get("Location")).toBe(
		"https://example.com/fr/some-path/"
	);

	// Request to URL in en with cookie specifying French without trailing slash
	const requestWithoutTrailingSlash = new Request(
		"https://example.com/en/some-path",
		{
			headers: {
				cookie: `PARAGLIDE_LOCALE=fr`,
				"Sec-Fetch-Dest": "document",
			},
		}
	);

	const responseWithoutTrailingSlash = await runtime.paraglideMiddleware(
		requestWithoutTrailingSlash,
		() => {
			// This shouldn't be called since we should redirect
			throw new Error("Should not reach here");
		}
	);

	expect(responseWithoutTrailingSlash instanceof Response).toBe(true);
	expect(responseWithoutTrailingSlash.status).toBe(307); // Redirect status code
	expect(responseWithoutTrailingSlash.headers.get("Location")).toBe(
		"https://example.com/fr/some-path"
	);
});

test("handles root paths with and without trailing slashes", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Root path with trailing slash for French locale
	const frRootWithSlash = new Request("https://example.com/fr/", {
		headers: { "Sec-Fetch-Dest": "document" },
	});

	let frRootWithSlashCalled = false;
	await runtime.paraglideMiddleware(frRootWithSlash, () => {
		frRootWithSlashCalled = true;
		return new Response("Success");
	});

	expect(frRootWithSlashCalled).toBe(true);

	// Root path without trailing slash for French locale
	const frRootWithoutSlash = new Request("https://example.com/fr", {
		headers: { "Sec-Fetch-Dest": "document" },
	});

	let frRootWithoutSlashCalled = false;
	await runtime.paraglideMiddleware(frRootWithoutSlash, () => {
		frRootWithoutSlashCalled = true;
		return new Response("Success");
	});

	expect(frRootWithoutSlashCalled).toBe(true);
});

test("only redirects if the request.headers.get('Sec-Fetch-Dest') === 'document'", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["cookie", "url"],
			cookieName: "PARAGLIDE_LOCALE",
			urlPatterns: [
				{
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/en/:path(.*)?"],
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Test with Sec-Fetch-Dest = document (should redirect)
	const documentRequest = new Request("https://example.com/en/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
			"Sec-Fetch-Dest": "document",
		},
	});

	const documentResponse = await runtime.paraglideMiddleware(
		documentRequest,
		() => {
			// This shouldn't be called since we should redirect
			throw new Error("Should not reach here");
		}
	);

	// Should redirect to fr version
	expect(documentResponse instanceof Response).toBe(true);
	expect(documentResponse.status).toBe(307);
	expect(documentResponse.headers.get("Location")).toBe(
		"https://example.com/fr/some-path"
	);

	// Test with Sec-Fetch-Dest = empty (should not redirect)
	const apiRequest = new Request("https://example.com/en/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
			// No Sec-Fetch-Dest header or set to something other than "document"
			"Sec-Fetch-Dest": "empty",
		},
	});

	let apiMiddlewareResolveWasCalled = false;
	await runtime.paraglideMiddleware(apiRequest, () => {
		apiMiddlewareResolveWasCalled = true;
		return new Response("API response");
	});

	// Middleware should be called since no redirect for API requests
	expect(apiMiddlewareResolveWasCalled).toBe(true);
});

test("handles base locale URLs with and without trailing slashes", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "fr"],
		compilerOptions: {
			strategy: ["url"],
			urlPatterns: [
				{
					pattern: "https://example.com/:path(.*)?",
					localized: [
						["en", "https://example.com/:path(.*)?"], // Base locale has no prefix
						["fr", "https://example.com/fr/:path(.*)?"],
					],
				},
			],
		},
	});

	// Base locale with trailing slash
	const enWithSlash = new Request("https://example.com/about/", {
		headers: { "Sec-Fetch-Dest": "document" },
	});

	let enWithSlashCalled = false;
	await runtime.paraglideMiddleware(enWithSlash, ({ locale }) => {
		enWithSlashCalled = true;
		expect(locale).toBe("en");
		return new Response("Success");
	});

	expect(enWithSlashCalled).toBe(true);

	// Base locale without trailing slash
	const enWithoutSlash = new Request("https://example.com/about", {
		headers: { "Sec-Fetch-Dest": "document" },
	});

	let enWithoutSlashCalled = false;
	await runtime.paraglideMiddleware(enWithoutSlash, ({ locale }) => {
		enWithoutSlashCalled = true;
		expect(locale).toBe("en");
		return new Response("Success");
	});

	expect(enWithoutSlashCalled).toBe(true);
});
