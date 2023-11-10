import { For } from "solid-js"
import * as m from "#src/paraglide/messages.js"
import Card from "#src/interface/components/Card.jsx"
import { registry } from "@inlang/marketplace-registry"

const Guides = () => {
	const getGuides = () => [
		"guide.niklasbuchfink.howToSetupInlang",
		"guide.niklasbuchfink.whatIsInlang",
		"guide.nilsjacobsen.buildAGlobalSvelteApp",
		"guide.nilsjacobsen.useParaglideJsInMonorepos",
	]
	return (
		<div class="w-full flex gap-4 mt-4 md:mt-10 mb-10 flex-col-reverse md:flex-row">
			<div class="w-full">
				<h2 class="pb-4 text-surface-900 font-semibold text-2xl leading-snug tracking-tight">
					{m.home_guides_title()}
				</h2>
				<div class="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
					<For each={getGuides()}>
						{(guide) => {
							const manifest = registry.find((manifest) => manifest.id === guide)
							if (!manifest) {
								return undefined
							}
							const displayName = () =>
								typeof manifest.displayName === "object"
									? manifest.displayName.en
									: manifest.displayName
							return <Card item={manifest} displayName={displayName()} />
						}}
					</For>
				</div>
			</div>
		</div>
	)
}

export default Guides
