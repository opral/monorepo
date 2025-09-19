import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

import { handleLlmProxyRequest, type WorkerEnv } from "./llm-proxy";
import { LLM_PROXY_PREFIX } from "../config/proxy";

const ORIGINAL_FETCH = globalThis.fetch;

describe("handleLlmProxyRequest", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = ORIGINAL_FETCH;
	});

	test("returns 500 when proxy is configured without an API key", async () => {
		const env = createEnv({ GOOGLE_API_KEY: undefined });
		const request = new Request(
			`https://example.com${LLM_PROXY_PREFIX}/v1beta/models`,
		);

		const response = await handleLlmProxyRequest({
			request,
			env,
			url: new URL(request.url),
		});

		expect(response.status).toBe(500);
		expect(await response.text()).toBe("Missing GOOGLE_API_KEY");
	});

	test("forwards proxy requests to Google with sanitized headers", async () => {
		const mockFetch = vi.fn<typeof fetch>(async (input, init) => {
			const req = input instanceof Request ? input : new Request(input, init);
			expect(req.url).toBe(
				"https://generativelanguage.googleapis.com/v1beta/models?foo=bar",
			);
			expect(req.headers.get("x-goog-api-key")).toBe("secret");
			expect(req.headers.get("origin")).toBeNull();
			expect(req.headers.get("referer")).toBeNull();
			return new Response("proxied", {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		globalThis.fetch = mockFetch;

		const env = createEnv({ GOOGLE_API_KEY: "secret" });
		const request = new Request(
			`https://example.com${LLM_PROXY_PREFIX}/v1beta/models?foo=bar`,
			{
				headers: {
					"cf-ray": "123",
					"x-goog-api-key": "client",
				},
			},
		);
		request.headers.set("Origin", "https://app.example");

		const response = await handleLlmProxyRequest({
			request,
			env,
			url: new URL(request.url),
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(response.status).toBe(200);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://app.example",
		);
		expect(await response.text()).toBe("proxied");
	});

	test("responds to CORS preflight requests", async () => {
		const env = createEnv({ GOOGLE_API_KEY: "secret" });
		const request = new Request(
			`https://example.com${LLM_PROXY_PREFIX}/v1beta/models`,
			{
				method: "OPTIONS",
				headers: {
					"Access-Control-Request-Headers": "content-type",
				},
			},
		);
		request.headers.set("Origin", "https://app.example");

		const response = await handleLlmProxyRequest({
			request,
			env,
			url: new URL(request.url),
		});

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
			"https://app.example",
		);
	});
});

function createEnv(overrides?: Partial<WorkerEnv>): WorkerEnv {
	return {
		ASSETS: {
			fetch: vi.fn().mockResolvedValue(new Response("asset", { status: 200 })),
		},
		GOOGLE_API_KEY: "secret",
		...overrides,
	};
}
