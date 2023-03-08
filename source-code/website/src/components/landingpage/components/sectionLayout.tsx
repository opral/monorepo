import { JSXElement } from "solid-js"

const landingpageGrid = "max-w-screen-xl w-full mx-auto px-4 sm:px-8"

export const SectionLayout = (props: { children: JSXElement }) => {
	return (
		<div class={"bg-surface-2 "}>
			<div class={landingpageGrid}>{props.children}</div>
		</div>
	)
}
