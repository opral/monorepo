import type { JSXElement } from "solid-js";
import IconWarning from "~icons/material-symbols/warning-outline-rounded";
import IconInfo from "~icons/material-symbols/info-outline-rounded";
import IconSuccess from "~icons/material-symbols/check-circle-outline-rounded";
import IconDanger from "~icons/material-symbols/dangerous-outline-rounded";

// children get a default style use content for custome style
export function Callout(props: {
	title: string;
	variant: "info" | "warning" | "danger" | "success";
	children: JSXElement;
}) {
	const Icon = () => {
		switch (props.variant) {
			case "success":
				return <IconSuccess />;

			case "info":
				return <IconInfo />;
			case "warning":
				return <IconWarning />;
			case "danger":
				return <IconDanger />;
			default:
				break;
		}
	};

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
				<Icon></Icon>
				{props.title}
			</h3>
			{props.children}
		</div>
	);
}
