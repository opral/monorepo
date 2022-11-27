import type { JSXElement } from "solid-js";
// children get a default style use content for custome style
export function Callout(props: {
	title: string;
	variant: "info" | "warning" | "danger";
	children: JSXElement;
}) {
	const color = () => {
		switch (props.variant) {
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
			<h3 class="font-bold text-lg pb-2">{props.title}</h3>
			{props.children}
		</div>
	);
}
