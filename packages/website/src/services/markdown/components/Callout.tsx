import { Icon } from "@src/components/Icon.jsx";
import type { JSXElement } from "solid-js";
import type { SemanticColorTokens } from "../../../../tailwind.config.cjs";

// children get a default style use content for custome style
export function Callout(props: {
	title: string;
	variant: SemanticColorTokens[number];
	children: JSXElement;
}) {
	const color = () => {
		switch (props.variant) {
			case "success":
				return "bg-success-container text-on-success-container";
			case "info":
				return "bg-primary-container text-on-primary-container";
			case "warning":
				return "bg-warning-container text-on-warning-container";
			case "danger":
				return "bg-danger-container text-on-danger-container";
		}
	};
	return (
		<div
			class={`not-prose ${color()} border border-outline p-4 my-4 rounded-md`}
		>
			<h3 class="font-bold text-lg pb-2 flex items-center	gap-2">
				<Icon name={props.variant}></Icon>
				{props.title}
			</h3>
			{props.children}
		</div>
	);
}
