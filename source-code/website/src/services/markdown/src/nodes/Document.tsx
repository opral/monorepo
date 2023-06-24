import type { JSXElement } from "solid-js"

export function Document(props: { children: JSXElement }) {
	// the style comes from https://tailwindcss.com/docs/typography-plugin
	return (
		<article
			class="pt-24 md:pt-10 prose w-full mx-auto max-w-3xl"
			classList={{ [codeStyle]: true, [fontStyle]: true }}
		>
			{props.children}
		</article>
	)
}

const codeStyle =
	"prose-code:py-0.5 prose-code:px-1 prose-code:bg-secondary-container prose-code:text-on-secondary-container prose-code:font-medium prose-code:rounded prose-code:before:hidden prose-code:after:hidden"

const fontStyle =
	"prose-p:text-base prose-sm prose-slate prose-li:py-1 prose-li:text-base prose-headings:font-semibold prose-headings:text-active-info prose-p:leading-7 prose-p:opacity-90 prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-t prose-h2:border-surface-3 prose-h2:pt-8 prose-h2:pb-4 prose-h3:text-[19px] prose-h3:pb-2"
