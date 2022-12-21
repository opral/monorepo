import { Icon } from "@src/components/Icon.jsx";
import type { JSXElement } from "solid-js";
import type { SemanticColorTokens } from "../../../../tailwind.config.cjs";

// children get a default style use content for custome style
export function Callout(props: {
	variant: SemanticColorTokens[number];
	children: JSXElement;
}) {
	return (
		<div
			class={`
				not-prose 
				bg-${props.variant}-container
				text-on-${props.variant}-container
				border border-${props.variant} p-4 my-4 rounded-md
			`}
		>
			<h3 class="font-semibold flex items-center gap-1.5">
				<Icon name={props.variant} class="text-bold"></Icon>
				{props.variant.toUpperCase()}
			</h3>
			{props.children}
		</div>
	);
}
