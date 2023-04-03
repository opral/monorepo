import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import KeyVisual from "./keyVisual.jsx"

const Hero = () => {
	return (
		<SectionLayout showLines={true} type="lightGrey">
			<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row">
				<div class="w-full xl:w-1/2 flex flex-col gap-8 px-10 py-16 md:py-32">
					<h1 class="text-4xl md:text-6xl font-extrabold text-surface-900 pr-16 tracking-tight">
						Localization infrastructure for software
					</h1>
					<p class="text-surface-600 w-full md:w-3/4 leading-relaxed">
						inlang makes localization (l10n) simple by leveraging git repositories as collaboration
						and automation hub for localization.
					</p>
					<div class="flex gap-6">
						<Button type="primary" href="/documentation/getting-started">
							Get started
						</Button>
						<Button type="text" href="https://github.com/inlang/inlang" chevron>
							View on GitHub
						</Button>
					</div>
				</div>
				<div class="relative w-full xl:w-1/2 xl:-ml-[8px]">
					<div class="w-[2px] h-full absolute bg-hover-primary mx-10 xl:mx-[7px] z-2" />
					<div class="w-auto h-full relative z-3 ml-[35px] xl:ml-0">
						<KeyVisual />
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Hero
