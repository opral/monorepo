import { Button } from "#src/pages/index/components/Button.jsx";
import { Show } from "solid-js";

interface TitleSectionProps {
	title: string;
	description: string;
	buttonLink?: string;
	buttonText?: string;
	icon?: string;
}
const TitleSection = (props: TitleSectionProps) => {
	return (
		<div class="flex justify-between items-center border-b border-surface-200 pb-4 mb-8 pt-6 mt-4 gap-6 flex-wrap">
			<Show when={props.icon}>
				<div class="flex md:justify-center items-stretch">
					<img
						class="w-10 md:w-14 h-10 md:h-14"
						src={props.icon}
						alt={props.title}
					/>
				</div>
			</Show>
			<div class="flex-1 min-w-[70%]">
				<h1 class="text-2xl font-semibold  text-surface-900 max-w-[400px] leading-snug tracking-tight">
					{props.title}
				</h1>
				<h2 class="text-surface-500 font-regular max-w-[500px] pt-2">
					{props.description}
				</h2>
			</div>
			<Show when={props.buttonLink && props.buttonText}>
				<Button href={props.buttonLink} type="textPrimary" chevron>
					{props.buttonText}
				</Button>
			</Show>
		</div>
	);
};

export default TitleSection;
