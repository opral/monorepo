import { Show, type JSXElement } from "solid-js"

/* This component is used to prevent Solid from rendering components that are only meant to be rendered on the client. */
export default function OnClient(props: { children: JSXElement }) {
	return <Show when={typeof window !== "undefined"}>{props.children}</Show>
}
