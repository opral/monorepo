import { describe, test, expect, vi } from "vitest";

import { handleFetch, type Env as WorkerEnv } from "./worker";
import { LLM_PROXY_PREFIX } from "../config/proxy";

describe("handleFetch", () => {
	test("delegates non-proxy requests to the asset binding", async () => {
		const assetResponse = new Response("asset", { status: 200 });
		const env = createEnv({
			ASSETS: {
				fetch: vi.fn().mockResolvedValue(assetResponse),
			},
		});

		const request = new Request("https://example.com/index.html");
		const response = await handleFetch(request, env);

		expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
		expect(await response.text()).toBe("asset");
	});

	test("routes proxy requests through the LLM handler", async () => {
		const env = createEnv();
		const proxyRequest = new Request(
			`https://example.com${LLM_PROXY_PREFIX}/foo`,
		);
		proxyRequest.headers.set("Origin", "https://app.example");

		const response = await handleFetch(proxyRequest, {
			...env,
			GOOGLE_API_KEY: undefined,
		});
		expect(response.status).toBe(500);
	});

	test("handles health checks", async () => {
		const env = createEnv();
		const request = new Request("https://example.com/healthz");
		const response = await handleFetch(request, env);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("ok");
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
