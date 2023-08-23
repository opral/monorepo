import type { JSXElement } from "solid-js"

export const SetupCard = (props: { error?: boolean; success?: boolean; children: JSXElement }) => {
	return (
		<div class={"p-8 rounded-lg flex flex-col items-center gap-8 w-[400px]"}>{props.children}</div>
	)
}
