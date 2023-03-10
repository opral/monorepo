import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import KeyVisual from "./keyVisual.jsx"

const Hero = () => {
	return (
		<SectionLayout type="lightGrey">
			<div class="w-full flex pt-16">
				<div class="w-1/2 flex flex-col gap-8 px-10 py-32">
					<h1 class="text-6xl font-extrabold text-surface-900 pr-16">
						Localization infrastructure for software
					</h1>
					<p class="text-surface-600 w-3/4 leading-relaxed">
						inlang makes localization (l10n) simple by leveraging git repositories as collaboration
						and automation hub for localization.
					</p>
					<div class="flex gap-6">
						<Button type="primary" href="/documentation">
							Get started
						</Button>
						<Button type="text" href="https://github.com/inlang/inlang">
							View on GitHub
						</Button>
					</div>
				</div>
				<div class="relative w-1/2 -ml-[8px]">
					<div class="w-[2px] h-full absolute bg-hover-primary mx-[7px] z-2" />
					<div class="w-full h-full relative z-3">
						<KeyVisual />
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Hero
