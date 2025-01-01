interface FeatureGitTitleProps {
	titleColor: string;
	circleColor: string;
	title: string;
}

export const FeatureGitTitle = (props: FeatureGitTitleProps) => {
	return (
		<div class="relative h-full">
			<h2 class={"text-3xl font-semibold " + "text-" + props.titleColor}>
				{props.title}
			</h2>
			<div
				class={
					"absolute top-[calc(50%_-_22px)] rounded-full opacity-20 h-11 w-11 -ml-[61px] " +
					"bg-" +
					props.circleColor
				}
			/>
			<div
				class={
					"absolute top-[calc(50%_-_8px)] rounded-full border-2 bg-background h-4 w-4 -ml-[47px] " +
					"border-" +
					props.circleColor
				}
			/>
		</div>
	);
};
