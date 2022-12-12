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
import { createProxyMiddleware } from "http-proxy-middleware";
import httpProxy from "http-proxy";
import type { Request, Response } from "express";
import https from "node:https";
// @ts-ignore
import createMiddleware from "@isomorphic-git/cors-proxy/middleware.js";
import { serverSideEnv } from "@env";

const middleware = createMiddleware({});
const env = await serverSideEnv();

export function proxy(request: Request, response: Response) {
	assert(request.url.startsWith(env.VITE_GIT_REQUEST_PROXY_PATH));
	// remove the proxy path from the request url
	request.url = request.url.slice(env.VITE_GIT_REQUEST_PROXY_PATH.length);
	return middleware(request, response);
}

// export function proxy(request: Request, response: Response) {
// 	/** if `/git-proxy/*` is the path, the wildcard `*` is removed */
// 	const pathWithoutWildcard = proxyPath.slice(0, -1);
// 	assert(request.originalUrl.startsWith(pathWithoutWildcard));
// 	const targetUrl =
// 		"https:/" + request.originalUrl.slice(pathWithoutWildcard.length);
// 	request.pipe(https.request("https://api.github.com/graphql")).pipe(response);
// }

// export const proxy = createProxyMiddleware({
// 	changeOrigin: true,
// 	onProxyReq: (proxyReq, req, res) => {
// 		// GitHub uses user-agent sniffing for git/* and changes its behavior which is frustrating
// 		if (
// 			!req.headers["user-agent"] ||
// 			!req.headers["user-agent"].startsWith("git/")
// 		) {
// 			req.headers["user-agent"] = "git/@inlang/inlang";
// 		}
// 	},
// 	router: (request) => {
// 		/** if `/git-proxy/*` is the path, the wildcard `*` is removed */
// 		const pathWithoutWildcard = proxyPath.slice(0, -1);
// 		assert(request.originalUrl.startsWith(pathWithoutWildcard));
// 		const targetUrl = request.originalUrl.slice(pathWithoutWildcard.length);
// 		assert(
// 			proxyPath.length > 2 && targetUrl.startsWith("/"),
// 			"The target URL must start with a leading slash if the proxy path is not `/` but something like `/git-proxy/*`."
// 		);
// 		// the path starts with a leading slash, thus only one leading slash here
// 		return `https:/${targetUrl}`;
// 	},
// });

// const _proxy = httpProxy.createProxy({ changeOrigin: true });

// export async function proxy(request: Request, response: Response) {
// 	/** if `/git-proxy/*` is the path, the wildcard `*` is removed */
// 	const pathWithoutWildcard = proxyPath.slice(0, -1);
// 	assert(request.originalUrl.startsWith(pathWithoutWildcard));
// 	const target =
// 		"https:/" + request.originalUrl.slice(pathWithoutWildcard.length);
// 	if (
// 		!request.headers["user-agent"] ||
// 		!request.headers["user-agent"].startsWith("git/")
// 	) {
// 		request.headers["user-agent"] = "git/@inlang/inlang";
// 	}
// 	const x = await fetch(
// 		"https://github.com/inlang/demo/info/refs?service=git-upload-pack"
// 	);
// 	console.log(await x.text());
// 	_proxy.web(request, response, { target });
// }
