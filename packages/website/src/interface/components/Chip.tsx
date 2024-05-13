/**
 * Displays a short text. Color should be a valid HEX color.
 */
export function Chip(props: { text: string | undefined; color: string; customClasses?: string }) {
	return (
		<div
			style={{
				color: props.color,
				background: `${props.color}16`,
			}}
			class={`text-xs px-1.5 py-[2px] hover:opacity-80 opacity-100 rounded ${props.customClasses}`}
		>
			{props.text}
		</div>
	)
}
