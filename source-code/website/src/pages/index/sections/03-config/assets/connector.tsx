const SVGConnector = (props: {
	width: number
	height: number
	radius: number
	startColor: string
	endColor: string
}) => {
	console.log(props.width, props.height, props.radius)

	return (
		<svg
			width={props.width + 1}
			height={props.height}
			viewBox={"0 0 " + props.width + " " + props.height}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="none"
		>
			{props.width > 1 ? (
				<path
					d={
						"M" +
						(props.width - 2) +
						" " +
						props.height +
						" " +
						"L" +
						(props.width - 2) +
						" " +
						(props.height - (props.height - 2 * props.radius) / 2) +
						" " +
						"C" +
						(props.width - 2) +
						" " +
						(props.height / 2 + props.radius / 2) +
						" " +
						(props.width - props.radius / 2) +
						" " +
						props.height / 2 +
						" " +
						(props.width - props.radius) +
						" " +
						props.height / 2 +
						" " +
						"L" +
						props.radius +
						" " +
						props.height / 2 +
						" " +
						"C" +
						props.radius / 2 +
						" " +
						props.height / 2 +
						" 1 " +
						(props.height / 2 - props.radius / 2) +
						" 1 " +
						(props.height / 2 - props.radius) +
						" L1 0"
					}
					stroke={"url(#paint0_linear_" + props.startColor + "_" + props.endColor + ")"}
					stroke-width="2"
				/>
			) : (
				<path
					d={"M" + (props.width - 2) + " " + props.height + " " + "L1 0"}
					stroke={"url(#paint0_linear_" + props.startColor + "_" + props.endColor + ")"}
					stroke-width="2"
				/>
			)}
			<defs>
				<linearGradient
					id={"paint0_linear_" + props.startColor + "_" + props.endColor}
					x1={props.width / 2}
					y1="0"
					x2={props.width / 2}
					y2={props.height}
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0" stop-color={props.startColor} />
					<stop offset="1" stop-color={props.endColor} stop-opacity="0" />
				</linearGradient>
			</defs>
		</svg>
	)
}

export default SVGConnector
