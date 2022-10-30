import type { JSXElement } from "solid-js";

export function Callout(props: { children?: JSXElement }) {
	return <div class="bg-red-500 p-4">{props?.children}</div>;
}
