/**
 * ------------------------------------
 * The git proxy routes and authenticates requests
 * to git hosts like GitHub and GitLab.
 *
 * The proxy exists to avoid CORS issues and authenticate
 * requests.
 * ------------------------------------
 */

import { assert } from "@src/services/assert/index.js";
import type { Request, Response } from "express";
import { serverSideEnv } from "@env";
// @ts-ignore
import createMiddleware from "@isomorphic-git/cors-proxy/middleware.js";

const middleware = createMiddleware({});
const env = await serverSideEnv();

export function proxy(request: Request, response: Response) {
	assert(request.url.startsWith(env.VITE_GIT_REQUEST_PROXY_PATH));
	// remove the proxy path from the request url
	request.url = request.url.slice(env.VITE_GIT_REQUEST_PROXY_PATH.length);
	return middleware(request, response);
}
