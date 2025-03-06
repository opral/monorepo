import { Page as Home } from "./pages/index.ts";
import { Page as About } from "./pages/about/index.ts";
import { App } from "./app.ts";

export async function render(url: string) {
	let children: string;

	if (url === "/") {
		children = Home();
	} else if (url === "/about") {
		children = About();
	} else {
		throw new Error("Unknown page");
	}

	const html = App({ children });

	return { html };
}
