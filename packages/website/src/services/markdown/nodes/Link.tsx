import { JSXElement, Match, Switch } from "solid-js";
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward";

/**
 * Custom Link nodes.
 *
 * @example
 *  [title](href)
 */
export function Link(props: { href: string; children: JSXElement }) {
	/** whether a link is an external link */
	const isExternal = () => props.href.startsWith("http");

	return (
		<Switch>
			<Match when={isExternal()}>
				<a
					href={props.href}
					target="_blank"
					class="inline-flex gap-0.5 items-center"
				>
					{props.children}
					{/* using non-rounded version to increase readability on smaller font settings */}
					<MaterialSymbolsArrowOutward></MaterialSymbolsArrowOutward>
				</a>
			</Match>
			<Match when={isExternal() === false}>
				<a href={props.href}>{props.children}</a>
			</Match>
		</Switch>
	);
}
