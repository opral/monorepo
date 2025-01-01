import { resolveRoute } from "vike/routing";
import type { PageContext } from "vike/types";

export const route = (pageContext: PageContext) => {
	return resolveRoute("/m/@uid/*", pageContext.urlParsed.pathname);
};
