const Python = (props: { size: number; startColor: string; endColor: string }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			fill="none"
			viewBox="0 0 44 44"
		>
			<g clip-path="url(#clip0_321_915)">
				<path
					fill={"url(#paint0_linear_" + props.startColor + "_" + props.endColor}
					d="M16.48.432c-4.44.786-5.245 2.426-5.245 5.46V9.89h10.5v1.336H7.296c-3.054 0-5.726 1.836-6.56 5.323-.963 3.997-1.002 6.491 0 10.665.746 3.104 2.524 5.323 5.578 5.323H9.92v-4.792c0-3.467 2.996-6.521 6.56-6.521h10.49c2.917 0 5.244-2.407 5.244-5.333V5.883c0-2.848-2.396-4.98-5.244-5.46-3.516-.58-7.337-.55-10.49.01zm-.658 2.79c1.08 0 1.974.903 1.974 2.003s-.884 1.994-1.974 1.994a1.985 1.985 0 01-1.974-1.994c.01-1.11.884-2.004 1.974-2.004zm18.189 7.994v4.665c0 3.614-3.065 6.659-6.56 6.659H16.96c-2.868 0-5.244 2.455-5.244 5.332v9.998c0 2.848 2.475 4.518 5.244 5.333 3.32.972 6.512 1.15 10.49 0 2.641-.766 5.244-2.308 5.244-5.333v-3.997h-10.48v-1.336H37.95c3.054 0 4.184-2.13 5.244-5.323 1.1-3.29 1.051-6.452 0-10.665-.756-3.035-2.19-5.323-5.244-5.323H34.01v-.01zm-5.903 25.319c1.09 0 1.974.893 1.974 1.993 0 1.11-.884 2.004-1.974 2.004-1.08 0-1.974-.904-1.974-2.004.01-1.11.894-1.993 1.974-1.993z"
				/>
			</g>
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
				<clipPath id="clip0_321_915">
					<path fill="#fff" d="M0 0H44V44H0z" />
				</clipPath>
			</defs>
		</svg>
	)
}

export default Python
