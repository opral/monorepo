import { Page as Homepage } from "./pages/index.js";
import { Page as About } from "./pages/about/index.js";

export function App() {
	let Page: () => string;

	// // tree-shaking unused page
	// if (import.meta.env.PAGE === "home") {
	// 	Page = Homepage;
	// } else if (import.meta.env.PAGE === "about") {
	// 	Page = About;
	// } else {
	// 	throw new Error("Unknown page");
	// }

	return About();
}
