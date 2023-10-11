import { Icon } from "#src/components/Icon.jsx"
import { Button } from "#src/pages/index/components/Button.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"

const GlobalAppBanner = () => {
	return (
		<SectionLayout showLines={true} type="lightGrey">
			<div class="px-6 md:px-4 pt-16 pb-4">
				<div class="px-6 py-4 bg-surface-800 rounded-lg flex justify-between items-center text-surface-400">
					<div class="flex items-center gap-4">
						<Icon name={"fast"} class="text-surface-400 w-8 h-8" />
						<p class="text-xl text-surface-200">
							Global App <span class="text-surface-500">is live</span>
						</p>
					</div>
					<p class="w-max max-w-[700px]">
						Adapt your application to different markets with Tools like the web editor, vs-code
						extension, CLI, badge or figma plugin parrot.
					</p>
					<Button type="secondary" href="/app">
						Try now
					</Button>
				</div>
			</div>
		</SectionLayout>
	)
}

export default GlobalAppBanner
