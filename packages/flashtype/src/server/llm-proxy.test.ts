import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

import { handleLlmProxyRequest, type WorkerEnv } from "./llm-proxy";
import { LLM_PROXY_PREFIX } from "../env-variables";

const ORIGINAL_FETCH = globalThis.fetch;

describe("handleLlmProxyRequest", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = ORIGINAL_FETCH;
	});

	test("returns 500 when proxy is configured without an API key", async () => {
		const env = createEnv({ AI_GATEWAY_API_KEY: undefined });
		const request = new Request(
			`https://example.com${LLM_PROXY_PREFIX}/v1/models`,
		);

		const response = await handleLlmProxyRequest({
			request,
			env,
			url: new URL(request.url),
		});

		expect(response.status).toBe(500);
		expect(await response.text()).toBe("Missing AI_GATEWAY_API_KEY");
	});

	test("forwards proxy requests to the AI Gateway with sanitized headers", async () => {
		const mockFetch = vi.fn<typeof fetch>(async (input, init) => {
			const req = input instanceof Request ? input : new Request(input, init);
			expect(req.url).toBe("https://ai-gateway.vercel.sh/v1/models?foo=bar");
			expect(req.headers.get("authorization")).toBe("Bearer secret");
			expect(req.headers.get("origin")).toBeNull();
			expect(req.headers.get("referer")).toBeNull();
			return new Response("proxied", {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		});
		globalThis.fetch = mockFetch;

		const env = createEnv({ AI_GATEWAY_API_KEY: "secret" });
		const request = new Request(
			`https://example.com${LLM_PROXY_PREFIX}/v1/models?foo=bar`,
			{
				headers: {
					"cf-ray": "123",
					authorization: "Bearer client",
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
		const env = createEnv({ AI_GATEWAY_API_KEY: "secret" });
		const request = new Request(
			`https://example.com${LLM_PROXY_PREFIX}/v1/models`,
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
		AI_GATEWAY_API_KEY: "secret",
		...overrides,
	};
}
