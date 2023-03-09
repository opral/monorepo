import type { JSXElement } from "solid-js"

export type buttonType = "primary" | "secondary" | "secondaryOnGray" | "text" | "textPrimary"

const bgColor = (type: buttonType) => {
	switch (type) {
		case "primary":
			return "text-white bg-surface-800 hover:bg-surface-900 px-4 "
		case "secondary":
			return "text-surface-800 bg-surface-200 hover:text-surface-900 hover:bg-surface-300 px-4 "
		case "secondaryOnGray":
			return "text-surface-700 bg-white hover:text-surface-900 hover:bg-surface-300 px-4"
		case "text":
			return "text-surface-700 hover:text-surface-900"
		case "textPrimary":
			return "text-primary-600 hover:text-primary-800"
		default:
			return "text-surface-700 bg-white hover:text-surface-900 hover:bg-surface-300 px-4"
	}
}

interface ButtonProps {
	children: JSXElement
	type: buttonType
	href?: string
}

export const Button = (props: ButtonProps) => {
	return (
		<a href={props.href}>
			<button
				class={
					"flex justify-center items-center h-10 relative gap-2 rounded flex-grow-0 flex-shrink-0 text-sm font-medium text-left" +
					bgColor(props.type)
				}
			>
				{props.children}
			</button>
		</a>
	)
}
