import type { Component } from "solid-js";
import type { PageContextBuiltIn } from "vite-plugin-ssr";
import type { passToClient } from "./_default.page.server.jsx";

/**
 * The <head> content of a page.
 */
export type PageHead = (args: { pageContext: PageContextRenderer }) => {
	title?: string;
	description?: string;
};

/** @deprecated is this type used anywhere? */
export type Page<T> = (props: T) => Component;

/**
 * The page context available during rendering.
 */
export type PageContextRenderer<PageProps = Record<string, unknown>> =
	PageContextBuiltIn<Component> & {
		/**
		 * The properties of a page.
		 */
		props: PageProps;
		/**
		 * Things that a file that contains a Page exports.
		 *
		 * Like a Head object.
		 */
		exports?: {
			Head?: PageHead;
		};
	};

/**
 * The page context that is available on the client.
 *
 * The avaiable page context is determined by the `passToClient`
 * export in [_default.page.server.jsx](./_default.page.server.jsx).
 *
 * @example
 * ```ts
 *		type Props = {
 *   		foo: string;
 * 		};
 *		function Page(pageContext: PageContext<Props>)
 * ```
 *
 */
export type PageContext<PageProps = Record<string, unknown>> = Pick<
	PageContextRenderer<PageProps>,
	typeof passToClient[number]
>;

/**
 * The return of a `onBeforeRender` hook.
 *
 * @example
 * ```ts
 * 		export function onBeforeRender(pageContext: PageContextRenderer): OnBeforeRender {
 * 			// ....
 * 		}
 * ```
 */
export type OnBeforeRender<Props> = (
	pageContext: PageContext<Props>
) => Promise<{
	pageContext: Pick<PageContext<Props>, "props">;
}>;
