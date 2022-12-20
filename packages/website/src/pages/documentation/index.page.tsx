import { onMount } from "solid-js";
import { navigate } from "vite-plugin-ssr/client/router";
import { Layout } from "@src/pages/Layout.jsx";

export function Page() {
	onMount(() => {
		// redirect
		navigate("/documentation/introduction");
	});
	return <Layout>{""}</Layout>;
}
