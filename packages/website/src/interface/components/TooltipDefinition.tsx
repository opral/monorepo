import type { JSXElement } from "solid-js";

/**
 * A tooltip that provides additional information about a term.
 *
 * @deprecated WORK IN PROGRESS! Don't use yet.
 *
 * Read https://carbondesignsystem.com/components/tooltip/usage/#definition-tooltip.
 */
export function TooltipDefinition(props: {
	class?: string;
	content: JSXElement;
	children: JSXElement;
}) {
	return (
		<sl-tooltip class={props.class}>
			<div slot="content">{props.content}</div>
			<span class="underline decoration-dotted underline-offset-2 hover:cursor-pointer">
				{props.children}
			</span>
		</sl-tooltip>
	);
}
