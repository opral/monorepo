import type { JSXElement } from "solid-js"

const landingpageGrid = "max-w-screen-xl w-full mx-auto px-4 sm:px-8"
type sectionType = "white" | "lightGrey" | "dark"

const bgColor = (type: sectionType) => {
	switch (type) {
		case "white":
			return "bg-background"
		case "lightGrey":
			return "bg-surface-50"
		case "dark":
			return "bg-surface-800"
		default:
			return "bg-background"
	}
}

interface SectionLayoutProps {
	children: JSXElement
	type: sectionType
}

export const SectionLayout = (props: SectionLayoutProps) => {
	return (
		<div class={"relative w-full " + bgColor(props.type)}>
			<div class="absolute top-0 left-0 h-full w-full z-0" />
			<div class={"relative h-24 z-1 " + landingpageGrid}>{props.children}</div>
		</div>
	)
}
