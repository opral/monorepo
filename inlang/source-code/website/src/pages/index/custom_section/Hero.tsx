import { For, Show } from "solid-js"
import { registry } from "@inlang/marketplace-registry"
import { Chip } from "#src/components/Chip.jsx"
import { colorForTypeOf } from "#src/pages/m/utilities.js"

const featuredArray = [
	"app.inlang.editor",
	"library.inlang.paraglideJsSveltekit",
	"app.inlang.cli",
	"plugin.inlang.i18next",
	"library.inlang.languageTag",
]

const Hero = () => {
	return (
		<div class="w-full flex gap-4 mt-4 md:mt-10 mb-8 flex-col-reverse md:flex-row">
			<div class="w-full md:w-1/4">
				<p class="pb-2 text-surface-500 text-sm">Featured</p>
				<ul class="-ml-3">
					<For each={featuredArray}>
						{(feature) => {
							const m = registry.find((m) => m.id === feature)
							return (
								<a href={"/m/" + m?.id}>
									<div class="flex gap-4 hover:bg-surface-200 px-3 py-[10px] rounded-lg items-center border-b border-surface-200">
										<img
											class="w-9 h-9 rounded-md m-0 shadow-lg object-cover object-center"
											src={m?.icon}
											alt={m?.id}
										/>
										<div class="flex flex-1 flex-col gap-1">
											<h3 class="flex-1 text-sm text-surface-800 font-semibold whitespace-nowrap overflow-hidden">
												{(m?.displayName as { en: string }).en}
											</h3>
											<Show when={m}>
												<Chip
													text={m?.id.split(".")[0]}
													color={colorForTypeOf(m!.id)}
													customClasses="w-fit"
												/>
											</Show>
										</div>
									</div>
								</a>
							)
						}}
					</For>
				</ul>
			</div>
			<div class="flex-1 flex flex-col gap-4 md:pl-4 py-8 md:py-0">
				<h1 class="text-xl text-surface-700 font-medium">
					Welcome to inlang, <br />
					the ecosystem to go global.
				</h1>
				<p class="text-md text-surface-500">💡 Expand to new markets and acquire more customers</p>
				<div class="w-full lg:w-[80%] pt-8 hidden md:block ">
					<img src="./images/expandV03.png" alt="Expand Graphic" />
				</div>
			</div>
		</div>
	)
}

export default Hero
