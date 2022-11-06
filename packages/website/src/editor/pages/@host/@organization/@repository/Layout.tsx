import type { JSXElement } from "solid-js";

export function Layout(props: { children: JSXElement }) {
	return <div class="max-w-screen-lg p-4 mx-auto">{props.children}</div>;
}
