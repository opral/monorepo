const Flutter = (props: { size: number; startColor: string; endColor: string }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			fill="none"
			viewBox="0 0 44 44"
		>
			<path
				fill={"url(#paint0_linear_" + props.startColor + "_" + props.endColor}
				d="M39.373 0L10.74 28.97 4 22.163 25.903 0h13.47zm-.083 20.481H25.82L14.088 32.352 25.607 44H38.97L27.54 32.37 39.29 20.481z"
			/>
			<defs>
				<linearGradient
					id={"paint0_linear_" + props.startColor + "_" + props.endColor}
					x1="22"
					x2="22"
					y1="0"
					y2="44"
					gradientUnits="userSpaceOnUse"
				>
					<stop />
					<stop offset="0" stop-color={props.startColor} />
					<stop offset="1" stop-color={props.endColor} />
				</linearGradient>
			</defs>
		</svg>
	)
}

export default Flutter
