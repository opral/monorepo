import { test, expect } from "vitest";
import { createParaglide } from "../create-paraglide.js";
import { newProject } from "@inlang/sdk";

test("sets the locale and origin", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url", "globalVariable"],
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
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["url"],
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
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
		strategy: ["globalVariable", "baseLocale"],
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
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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

test("call onRedirect callback when redirecting to new url", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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
	});

	// Request to URL in en with cookie specifying French
	const request = new Request("https://example.com/en/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
			"Sec-Fetch-Dest": "document",
		},
	});

	let response: any;

	await runtime.paraglideMiddleware(
		request,
		() => {
			// This shouldn't be called since we should redirect
			throw new Error("Should not reach here");
		},
		{
			onRedirect: (res: Response) => {
				response = res;
			},
		}
	);

	expect(response instanceof Response).toBe(true);
	// needs to be 307 status code https://github.com/opral/inlang-paraglide-js/issues/416
	expect(response.status).toBe(307); // Redirect status code
	expect(response.headers.get("Location")).toBe(
		"https://example.com/fr/some-path"
	);
});

test("does not call onRedirect callback when there is no redirecting", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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
	});

	// Request to URL in en with cookie specifying French
	const request = new Request("https://example.com/fr/some-path", {
		headers: {
			cookie: `PARAGLIDE_LOCALE=fr`,
			"Sec-Fetch-Dest": "document",
		},
	});

	let response: any = null;

	await runtime.paraglideMiddleware(
		request,
		() => {
			return new Response("Hello World");
		},
		{
			onRedirect: (res: Response) => {
				response = res;
			},
		}
	);

	expect(response).toBe(null);
});

test("does not redirect if URL already matches determined locale", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url", "globalVariable"],
		disableAsyncLocalStorage: true,
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
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de", "fr"],
			},
		}),
		strategy: ["url", "globalVariable"],
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
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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

// can likely be removed once the default url pattern polyfill workaround is removed
// because URLPattern seems to be handling this correctly
test("prevents redirect loops by normalizing URLs with trailing slashes in different scenarios", async () => {
	// Create two different runtimes to test different strategy configurations
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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
	});

	// SCENARIO 1: Basic trailing slash normalization with cookie strategy

	// Case 1A: Request URL has trailing slash, but localized URL might not
	const requestWithTrailingSlash = new Request("https://example.com/fr/page/", {
		headers: {
			"Sec-Fetch-Dest": "document",
			cookie: `PARAGLIDE_LOCALE=fr`,
		},
	});

	let response = await runtime.paraglideMiddleware(
		requestWithTrailingSlash,
		() => {
			return new Response("No redirect needed");
		}
	);

	// Middleware should be called (no redirect) because normalized URLs match
	expect(response.status).toBe(200);
	expect(await response.text()).toBe("No redirect needed");

	// Case 1B: Request URL has no trailing slash, but localized URL might
	const requestWithoutTrailingSlash = new Request(
		"https://example.com/fr/page",
		{
			headers: {
				"Sec-Fetch-Dest": "document",
				cookie: `PARAGLIDE_LOCALE=fr`,
			},
		}
	);

	response = await runtime.paraglideMiddleware(
		requestWithoutTrailingSlash,
		() => {
			return new Response("No redirect needed");
		}
	);

	expect(response.status).toBe(200);

	// Case 1C: redirect wanted because cookie is set to fr but url is en
	const requestDifferentPath = new Request(
		"https://example.com/en/different-page",
		{
			headers: {
				"Sec-Fetch-Dest": "document",
				cookie: `PARAGLIDE_LOCALE=fr`,
			},
		}
	);

	response = await runtime.paraglideMiddleware(requestDifferentPath, () => {
		// This shouldn't be called since we should redirect
		throw new Error("Should not reach here");
	});

	// Should redirect to fr version
	expect(response.status).toBe(307);
	expect(response.headers.get("Location")).toBe(
		"https://example.com/fr/different-page"
	);
});

// not implemented because users should disable redirects by
// making another strategy preceed the url strategy
//
// strategy: ["cookie", "url"]
test.skip("doesn't redirect if disableUrlRedirect is true", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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

test("only redirects if the request.headers.get('Sec-Fetch-Dest') === 'document'", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "fr"],
			},
		}),
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

// https://github.com/opral/inlang-paraglide-js/issues/477
test("does not catch errors thrown by downstream resolve call", async () => {
	const runtime = await createParaglide({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en"],
			},
		}),
		strategy: ["url"],
	});

	await expect(() =>
		runtime.paraglideMiddleware(
			new Request(new URL("https://example.com/page"), {
				headers: { "Sec-Fetch-Dest": "document" },
			}),
			() => {
				throw new Error("Downstream error");
			}
		)
	).rejects.toThrow();
});
