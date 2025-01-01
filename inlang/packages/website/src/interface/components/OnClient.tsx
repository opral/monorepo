import { Show, type JSXElement, onMount, createSignal } from "solid-js";

/* This component is used to prevent Solid from rendering components that are only meant to be rendered on the client. */
export default function OnClient(props: { children: JSXElement }) {
	const [loading, setLoading] = createSignal(true);
	onMount(() => setLoading(false));

	return <Show when={!loading}>{props.children}</Show>;
}
