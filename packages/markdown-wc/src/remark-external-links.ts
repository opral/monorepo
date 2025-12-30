import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export type ExternalLinksOptions = {
	/**
	 * Predicate to decide whether a URL is external.
	 *
	 * Defaults to absolute http(s) URLs.
	 *
	 * @example
	 * (href) => href.startsWith("https://") && !href.includes("lix.dev")
	 */
	isExternal?: (href: string) => boolean;
	/**
	 * Target attribute to apply to external links.
	 *
	 * @default "_blank"
	 */
	target?: string;
	/**
	 * Rel attribute to apply to external links.
	 *
	 * @default "noopener noreferrer"
	 */
	rel?: string;
};

/**
 * Remark plugin that annotates external links so `remark-rehype` emits `target` and `rel`.
 *
 * Intended to be used as an opt-in feature from `parse()` or `serializeToHtml()`.
 *
 * @example
 * unified().use(remarkExternalLinks, true)
 */
export const remarkExternalLinks: Plugin<
	[ExternalLinksOptions | boolean | undefined],
	any
> = (options) => {
	if (options === false) {
		return () => {};
	}

	const config: ExternalLinksOptions =
		typeof options === "object" && options != null ? options : {};

	const isExternal =
		config.isExternal ?? ((href: string) => /^https?:\/\//i.test(href));
	const target = config.target ?? "_blank";
	const rel = config.rel ?? "noopener noreferrer";

	return (tree: any) => {
		visit(tree, "link", (node: any) => {
			const url = node?.url;
			if (typeof url !== "string") return;
			if (!isExternal(url)) return;

			const data = (node.data ||= {});
			const hProperties = (data.hProperties ||= {}) as Record<string, any>;
			hProperties.target = target;
			hProperties.rel = rel;
		});
	};
};
