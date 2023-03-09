import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import KeyVisual from "./keyVisual.jsx"

const Hero = () => {
	return (
		<SectionLayout type="lightGrey">
			<div class="w-full flex pt-16">
				<div class="w-1/2 flex flex-col gap-8 px-10 py-32">
					<h1 class="text-5xl font-bold text-surface-900">
						Localization infrastructure for software
					</h1>
					<p class="font-medium text-surface-600 w-3/4">
						inlang makes localization (l10n) simple by leveraging git repositories as collaboration
						and automation hub for localization.
					</p>
					<div class="flex gap-6">
						<Button type="primary">Get started</Button>
						<Button type="text">View on GitHub</Button>
					</div>
				</div>
				<div class="w-1/2 -ml-[8px]">
					<KeyVisual />
				</div>
			</div>
		</SectionLayout>
	)
}

export default Hero
