const Nuxt = (props: { size: number; startColor: string; endColor: string }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			fill="none"
			//
			viewBox="0 0 900 900"
		>
			<path
				fill={"url(#paint0_linear_" + props.startColor + "_" + props.endColor}
				d="M504.908 750h334.568a60.945 60.945 0 0030.269-8.037 60.252 60.252 0 0022.155-21.964 59.566 59.566 0 008.1-30.002 59.563 59.563 0 00-8.127-29.995L667.187 274.289a60.253 60.253 0 00-22.151-21.96 60.944 60.944 0 00-30.263-8.038 60.94 60.94 0 00-30.262 8.038 60.245 60.245 0 00-22.151 21.96l-57.452 98.69-112.327-192.986a60.287 60.287 0 00-22.161-21.957A60.98 60.98 0 00340.151 150a60.974 60.974 0 00-30.268 8.036 60.282 60.282 0 00-22.162 21.957L8.126 660.002A59.569 59.569 0 000 689.997a59.569 59.569 0 008.1 30.002 60.254 60.254 0 0022.155 21.964A60.944 60.944 0 0060.524 750h210.014c83.21 0 144.574-36.225 186.798-106.899l102.513-175.956 54.908-94.166 164.79 282.855H559.849L504.908 750zm-237.794-94.263l-146.563-.033 219.698-377.118L449.87 467.145l-73.396 126.03c-28.041 45.855-59.897 62.562-109.36 62.562z"
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

export default Nuxt
