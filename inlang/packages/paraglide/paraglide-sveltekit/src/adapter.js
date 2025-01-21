export { default as ParaglideSveltekitProvider } from "./adapter.provider.svelte";
import { localizedPath } from "./runtime.js";

/**
 * @type {import('@sveltejs/kit').Reroute}
 */
export const localizedRouting = (request) => {
	return localizedPath(request.url.pathname);
};
