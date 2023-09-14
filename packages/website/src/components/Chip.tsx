/**
 * Displays a short text. Color should be a valid HEX color.
 */
export function Chip(props: { text: string | undefined; color: string; customClasses?: string }) {
	return (
		<div
			style={{
				color: props.color,
				background: `${props.color}25`,
			}}
			class={`text-sm px-2 py-1 rounded-full ${props.customClasses}`}
		>
			{props.text}
		</div>
	)
}
