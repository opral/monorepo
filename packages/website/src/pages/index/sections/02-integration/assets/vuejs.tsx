const Vuejs = (props: { size: number; startColor: string; endColor: string }) => {
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
				d="M35.053 3H27.5L22 11.842 17.286 3H0l22 38.293L44 3h-8.947zM5.47 6.194h5.284L22 25.974l11.236-19.78h5.284L22 34.956 5.47 6.194z"
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

export default Vuejs
