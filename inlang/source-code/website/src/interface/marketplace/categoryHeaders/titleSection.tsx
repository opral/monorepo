import { Button } from "#src/pages/index/components/Button.jsx"

interface TitleSectionProps {
	title: string
	description: string
	buttonLink: string
	buttonText: string
}
const TitleSection = (props: TitleSectionProps) => {
	return (
		<div class="flex flex-col md:flex-row justify-between md:items-end border-b border-surface-200 pb-4 mb-8 pt-6">
			<div>
				<h1 class="text-2xl font-semibold  text-surface-900 max-w-[400px] leading-snug tracking-tight">
					{props.title}
				</h1>
				<h2 class="text-surface-500 font-regular max-w-[500px] pt-2">{props.description}</h2>
			</div>
			<Button class="mt-8" href={props.buttonLink} type="textPrimary" chevron>
				{props.buttonText}
			</Button>
		</div>
	)
}

export default TitleSection
