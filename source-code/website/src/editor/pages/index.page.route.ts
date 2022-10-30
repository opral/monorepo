/**
 * This file defines a route function.
 *
 * Read more about route function on the vite-plugin-ssr docs
 * https://vite-plugin-ssr.com/route-function
 */

import type { PageContext } from "@src/renderer/types.js";

/**
 * Route parameters of /editor/git.
 */
export type GitRouteParams = {
	provider: string;
	repository: string;
};

export default function (pageContext: PageContext): {
	routeParams: GitRouteParams;
} {
	return {
		routeParams: { provider: "github.com", repository: "xyz" },
	};
}
