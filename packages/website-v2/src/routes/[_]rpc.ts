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

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
