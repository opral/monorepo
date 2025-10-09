import { LLM_PROXY_PREFIX } from "../env-variables";

const GOOGLE_API_HOST = "https://generativelanguage.googleapis.com";

export type WorkerEnv = {
	ASSETS: {
		fetch(request: Request): Promise<Response>;
	};
	GOOGLE_API_KEY?: string;
};

/**
 * Proxies requests destined for the Gemini API, ensuring the server-only API key
 * remains hidden from the client while preserving browser streaming behaviour.
 *
 * @example
 * const response = await handleLlmProxyRequest({ request, env, url });
 */
export async function handleLlmProxyRequest(args: {
	request: Request;
	env: WorkerEnv;
	url: URL;
}): Promise<Response> {
	const { request, env, url } = args;
	const originHeader = request.headers.get("Origin") ?? "";
	const origin = originHeader || "*";

	if (request.method === "OPTIONS") {
		return createCorsResponse({
			status: 204,
			origin,
			headers: {
				"Access-Control-Allow-Headers":
					request.headers.get("Access-Control-Request-Headers") ?? "*",
				"Access-Control-Allow-Methods": "GET,HEAD,POST,PATCH,PUT,DELETE",
			},
		});
	}

	if (!env.GOOGLE_API_KEY) {
		return createCorsResponse({
			status: 500,
			body: "Missing GOOGLE_API_KEY",
			origin,
			headers: {
				"content-type": "text/plain",
			},
		});
	}

	const upstreamPath = url.pathname.slice(LLM_PROXY_PREFIX.length) || "/";
	const upstreamUrl = new URL(`${GOOGLE_API_HOST}${upstreamPath}${url.search}`);
	const upstreamRequest = new Request(upstreamUrl.toString(), request);
	const headers = new Headers(upstreamRequest.headers);

	headers.set("x-goog-api-key", env.GOOGLE_API_KEY);
	headers.delete("host");
	headers.delete("cf-connecting-ip");
	headers.delete("cf-ew-via");
	headers.delete("cf-ipcountry");
	headers.delete("cf-ray");
	headers.delete("cf-visitor");
	headers.delete("origin");
	headers.delete("referer");

	try {
		const response = await fetch(new Request(upstreamRequest, { headers }));
		const responseHeaders = new Headers(response.headers);
		responseHeaders.set("Access-Control-Allow-Origin", origin);
		return createCorsResponse({
			body: response.body,
			status: response.status,
			headers: responseHeaders,
			origin,
		});
	} catch (error) {
		console.error("Google proxy request failed", error);
		return createCorsResponse({
			status: 502,
			body: "Upstream request failed",
			origin,
			headers: {
				"content-type": "text/plain",
			},
		});
	}
}

/**
 * Wraps a response (or response body) with the required CORS headers so browsers
 * can consume the resource without additional configuration.
 *
 * @example
 * return createCorsResponse({ status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
 */
function createCorsResponse({
	body,
	status,
	headers,
	origin,
}: {
	body?: BodyInit | null;
	status: number;
	headers?: HeadersInit;
	origin?: string;
}): Response {
	const finalHeaders = new Headers(headers ?? {});
	const allowOrigin =
		origin ?? finalHeaders.get("Access-Control-Allow-Origin") ?? "*";
	finalHeaders.set("Access-Control-Allow-Origin", allowOrigin);
	finalHeaders.append("Vary", "Origin");
	return new Response(body ?? null, {
		status,
		headers: finalHeaders,
	});
}
