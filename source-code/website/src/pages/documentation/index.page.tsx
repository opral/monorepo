import { onMount } from "solid-js";

export function Page() {
	// onMount because window is not available in a server-side environment....
	onMount(() => {
		// server side routing trigger
		// see https://vite-plugin-ssr.com/navigate#page-content
		window.location.href = "documentation/intro";
	});
}
