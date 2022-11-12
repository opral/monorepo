import type { JSXElement } from "solid-js";
// children get a default style use content for custome style
export function Callout(props: {
	title?: string;
	children?: JSXElement;
	content?: string;
}) {
	return (
		<>
			<div class="bg-primary-container  border border-outline p-4 my-4 rounded-md ">
				<div class="text-on-primary-container font-display font-bold ">
					{props.title}
				</div>
				<p class=" ">{props?.children}</p>
				<div>{props.content}</div>
			</div>
		</>
	);
}
