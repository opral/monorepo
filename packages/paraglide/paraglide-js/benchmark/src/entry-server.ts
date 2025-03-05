import { Page as Home } from "./pages/index.ts";
import { App } from "./app.ts";

export async function render(url: string) {
	let children: string;

	if (url === "/") {
		children = Home();
	} else if (url === "/about") {
		// @ts-expect-error - might not be generated
		const { About } = await import("./pages/about/index.ts");
		children = About();
	} else {
		throw new Error("Unknown page");
	}

	const html = App({ children });

	return { html };
}
