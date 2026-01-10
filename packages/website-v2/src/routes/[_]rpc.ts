import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_rpc")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => {
        return proxyRpcRequest(request);
      },
      POST: async ({ request }) => {
        return proxyRpcRequest(request);
      },
    },
  },
});

// Legacy proxy: keep /_rpc on inlang.com working while moving RPCs to rpc.inlang.com.
const RPC_BASE_URL = "https://rpc.inlang.com";
const RPC_PATH = "/_rpc";

async function proxyRpcRequest(request: Request) {
  const corsHeaders = buildCorsHeaders(request);
  if (corsHeaders === null) {
    return new Response("CORS origin denied", { status: 403 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const upstreamUrl = `${RPC_BASE_URL}${RPC_PATH}`;
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  for (const [key, value] of corsHeaders.entries()) {
    responseHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

function buildCorsHeaders(request: Request) {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  if (!isAllowedOrigin(origin)) {
    return null;
  }

  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-credentials", "true");
  headers.set("access-control-allow-methods", "POST,OPTIONS");
  headers.set(
    "access-control-allow-headers",
    request.headers.get("access-control-request-headers") ?? "content-type"
  );
  headers.set("vary", "origin");
  return headers;
}

function isAllowedOrigin(origin: string) {
  let hostname = "";
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  if (hostname === "localhost") {
    return true;
  }

  return hostname === "inlang.com" || hostname.endsWith(".inlang.com");
}
