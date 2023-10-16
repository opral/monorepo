import type { JSXElement } from "solid-js"

const landingpageGrid = "max-w-screen-xl w-full mx-auto"
type sectionType = "white" | "lightGrey" | "blue" | "dark"

const bgColor = (type: sectionType) => {
	switch (type) {
		case "white":
			return "bg-background"
		case "lightGrey":
			return "bg-surface-50"
		case "blue":
			return "bg-surface-800"
		case "dark":
			return "bg-surface-900"
		default:
			return "bg-background"
	}
}

interface SectionLayoutProps {
	children: JSXElement
	type: sectionType
	showLines: boolean
}

export const SectionLayout = (props: SectionLayoutProps) => {
	return (
		<div class={"w-full"}>
			<div class={"relative " + landingpageGrid}>{props.children}</div>
		</div>
	)
}
