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
			class={`text-xs px-2 py-[2px] rounded-full ${props.customClasses}`}
		>
			{props.text}
		</div>
	)
}
