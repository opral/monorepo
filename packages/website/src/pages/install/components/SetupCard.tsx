import type { JSXElement } from "solid-js"

export const SetupCard = (props: { error?: boolean; children: JSXElement }) => {
	return (
		<div
			class={
				"p-6 rounded-lg border flex flex-col gap-8 max-w-lg " +
				(props.error ? "border-danger/20 bg-danger/20" : "border-surface-100")
			}
		>
			{props.children}
		</div>
	)
}
