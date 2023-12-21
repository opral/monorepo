import { For } from "solid-js"
import * as m from "#src/paraglide/messages.js"
import { registry } from "@inlang/marketplace-registry"
import { Button } from "../components/Button.jsx"
import Link from "#src/renderer/Link.jsx"

const Guides = () => {
	const getGuides = () => [
		"guide.nilsjacobsen.buildAGlobalSvelteApp",
		"guide.niklasbuchfink.whatIsInlang",
		"guide.nilsjacobsen.whatArePlugins",
		"guide.lorissigrist.useParaglideJsWithNextjsAppRouter",
		"guide.floriankiem.localizationStartegy",
	]
	return (
		<div class="w-full flex gap-4 my-28 flex-col-reverse md:flex-row">
			<div class="w-full flex flex-col md:flex-row gap-12">
				<div class="w-full md:w-1/3 flex flex-col gap-4">
					<h2 class="text-surface-900 font-semibold text-2xl leading-snug tracking-tight">
						{m.home_guides_title()}
					</h2>
					<p class="text-surface-500 lg:pr-16 pb-2">{m.home_guides_description()}</p>
					<Button href="/c/guides" type="secondary">
						{m.home_guides_button_text()}
					</Button>
				</div>

				<div class="w-full md:w-2/3 flex flex-col divide-y divide-surface-300 -mt-6">
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
							return (
								<Link
									href={`/g/${manifest.uniqueID}/${manifest.id.replaceAll(".", "-")}`}
									class="gap-4 py-6 flex group hover:cursor-pointer"
								>
									<img class="w-7 h-7 object-cover object-center rounded-lg" src={manifest.icon} />
									<div class="flex flex-col gap-1 flex-1">
										<h3 class="m-0 mb-2 text-surface-800 leading-none no-underline font-semibold">
											{displayName()}
										</h3>
										<p class="text-surface-600 text-sm">
											{(manifest.description as { en: string }).en}
										</p>
									</div>
									<p class="hidden lg:block ml-32 text-sm text-primary hover:text-active-primary">
										{m.home_guides_item_button_text()}
									</p>
								</Link>
							)
						}}
					</For>
				</div>
			</div>
		</div>
	)
}

export default Guides
