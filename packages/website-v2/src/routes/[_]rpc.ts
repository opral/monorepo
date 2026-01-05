import { createFileRoute } from "@tanstack/react-router";
import { handleRpcRequest, PUBLIC_ENV_VARIABLES } from "@inlang/rpc/handler";

export const Route = createFileRoute("/_rpc")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => {
        return new Response(null, {
          status: 204,
          headers: buildCorsHeaders(request),
        });
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", {
            status: 400,
            headers: buildCorsHeaders(request),
          });
        }

        const result = await handleRpcRequest(body);
        return Response.json(result, {
          headers: buildCorsHeaders(request),
        });
      },
    },
  },
});

function buildCorsHeaders(request: Request) {
  const allowedOrigins = PUBLIC_ENV_VARIABLES.PUBLIC_ALLOWED_AUTH_URLS?.split(
    ","
  )
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origin = request.headers.get("origin") ?? "";
  const isAllowed =
    allowedOrigins && allowedOrigins.length > 0
      ? allowedOrigins.includes(origin)
      : true;
  const responseOrigin = isAllowed ? origin || "*" : "null";

  return {
    "Access-Control-Allow-Origin": responseOrigin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}
