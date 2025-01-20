export { default as ParaglideSveltekitProvider } from "./adapter.provider.svelte";

/**
 * @type {import('@sveltejs/kit').Reroute}
 */
export const i18nRouting = (request) => {
	if (request.url.pathname === "/de") {
		return "/";
	}

	return request.url.pathname;
};
