/**
 * A chip that displays a short text. Color should be a valid HEX color.
 */
export function Chip(props: { text: string | undefined; color: string; customClasses?: string }) {
	return (
		<div
			style={{
				color: props.color,
				background: props.color + "2A",
			}}
			class={`text-sm right-4 px-2 py-1 rounded-full ${props.customClasses} capitalize`}
		>
			{props.text}
		</div>
	)
}
