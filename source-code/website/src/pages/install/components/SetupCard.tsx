import type { JSXElement } from "solid-js"

export const SetupCard = (props: { children: JSXElement }) => {
	return (
		<div class="p-6 rounded-lg border border-surface-100 flex flex-col gap-8 max-w-lg">
			{props.children}
		</div>
	)
}
