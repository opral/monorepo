import type { JSXElement } from "solid-js";
// children get a default style use content for custome style
export function Callout(props: {
	title: string;
	variant: "info" | "warning" | "danger";
	children: JSXElement;
}) {
	return (
		<div class="not-prose bg-primary-container border border-outline p-4 my-4 rounded-md">
			<h3 class="text-on-primary-container font-display font-bold text-lg pb-2">
				{props.title}
			</h3>
			{props.children}
		</div>
	);
}
