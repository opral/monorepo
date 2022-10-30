import type { JSX } from "solid-js";

/**
 * The root layout of the editor.
 *
 * Use STRG-F to find the file where EditorLayout is rendered.
 */
export function EditorLayout(props: { children: JSX.Element }) {
	return <div class="max-w-screen-lg p-4 mx-auto">{props.children}</div>;
}
