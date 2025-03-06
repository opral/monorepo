import { Page as Home } from "./pages/index.ts";
import { Page as About } from "./pages/about/index.ts";
import { App } from "./app.ts";
import { middleware } from "./i18n/generated.ts";
import fs from "node:fs/promises";

export async function handle(request: Request): Promise<Response> {
	// @ts-ignore - middleware might not be defined
	const _middleware: typeof mockMiddleware = middleware ?? mockMiddleware;

	return _middleware(request, async ({ request }) => {
		let children: string;

		// assumes that a client side build has been done
		const rootHtml = await fs.readFile(
			new URL(`../dist/${process.env.BASE}/index.html`, import.meta.url)
				.pathname,
			"utf-8"
		);

		const path = new URL(request.url).pathname;

		if (path === "/") {
			children = Home();
		} else if (path === "/about") {
			children = About();
		} else {
			throw new Error("Unknown page");
		}

		const html = App({ children });

		return new Response(rootHtml.replace("<!--app-html-->", html), {
			headers: { "Content-Type": "text/html" },
		});
	});
}

function mockMiddleware(
	request: Request,
	resolve: (args: { request: Request }) => Promise<Response>
): Promise<Response> {
	return resolve({ request });
}