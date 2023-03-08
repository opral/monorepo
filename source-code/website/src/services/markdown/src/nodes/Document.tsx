import type { JSXElement } from "solid-js"

export function Document(props: { children: JSXElement }) {
	// the style comes from https://tailwindcss.com/docs/typography-plugin
	return (
		<article class="prose w-full mx-auto max-w-3xl" classList={{ [codeStyle]: true }}>
			{props.children}
		</article>
	)
}

const codeStyle =
	"prose-code:py-0.5 prose-code:px-1 prose-code:bg-secondary-container prose-code:text-on-secondary-container prose-code:rounded prose-code:before:hidden prose-code:after:hidden"
