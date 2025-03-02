import { Page as Home } from "./pages/index.ts";
import { Page as About } from "./pages/about/index.ts";

export function render(url: string) {
	let html: string;

	if (url === "/") {
		html = Home();
	} else if (url === "/about") {
		html = About();
	} else {
		throw new Error("Unknown page");
	}

	return { html };
}
