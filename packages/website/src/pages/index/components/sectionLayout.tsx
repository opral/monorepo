import type { JSXElement } from "solid-js"

const landingpageGrid = "max-w-screen-xl w-full mx-auto"
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
	showLines: boolean
}

export const SectionLayout = (props: SectionLayoutProps) => {
	return (
		<div class={"w-full " + bgColor(props.type)}>
			<div class={"relative " + landingpageGrid}>
				{props.showLines && (
					<div class={"invisible xl:visible absolute top-0 left-0 h-full w-full z-0 "}>
						<div class="flex w-full h-full justify-between mx-auto">
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
						</div>
					</div>
				)}
				<div class={"relative z-1"}>{props.children}</div>
			</div>
		</div>
	)
}
