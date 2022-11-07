import { onMount } from "solid-js";
import { navigate } from "vite-plugin-ssr/client/router";

export function Page() {
	onMount(() => {
		// redirect
		navigate("/documentation/intro");
	});
}
