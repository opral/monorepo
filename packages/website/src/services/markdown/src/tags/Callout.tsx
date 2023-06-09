import { Icon } from "@src/components/Icon.jsx"
import type { JSXElement } from "solid-js"
import type { SemanticColorTokens } from "../../../../../tailwind.config.cjs"

// children get a default style use content for custome style
export function Callout(props: { variant: SemanticColorTokens[number]; children: JSXElement }) {
	return (
		<div
			class={`
				bg-${props.variant}-container
				text-on-${props.variant}-container
				border border-${props.variant} p-4 my-4 rounded-md
			`}
		>
			{/* not an h3 to escape prosing https://tailwindcss.com/docs/typography-plugin */}
			<div class="font-semibold flex items-center gap-1.5 pb-1">
				<Icon name={props.variant} class="text-bold" />
				{props.variant.toUpperCase()}
			</div>
			{/* wrapped in a div and prose to re-initialize prosing and thereby remove
			unexpected paddings and margins  */}
			<div class="prose prose-p:m-0">{props.children}</div>
		</div>
	)
}
