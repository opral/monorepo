interface IconLixProps {
	className?: string
}

const IconLix = ({ className }: IconLixProps) => {
	return (
		<svg
			width="26.48"
			height="18"
			viewBox="0 0 189 129"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className || "text-[#07B6D4]"}
		>
			<path
				d="M107.415 40L123.438 70.5114L163.858 0H188.688L139.404 83.6364L165.369 127.273H140.654L123.438 97.1023L106.506 127.273H81.5059L107.415 83.6364L82.4149 40H107.415Z"
				fill="currentColor"
			/>
			<path d="M43.5938 127.273V40H67.7983V127.273H43.5938Z" fill="currentColor" />
			<path d="M24 0.261719V128.262H0V0.261719H24Z" fill="currentColor" />
			<path d="M44 0.261719H108V20.2617H44V0.261719Z" fill="currentColor" />
		</svg>
	)
}

export default IconLix
