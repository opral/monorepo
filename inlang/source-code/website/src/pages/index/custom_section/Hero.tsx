import { For, Show } from "solid-js"
import { registry } from "@inlang/marketplace-registry"
import { Chip } from "#src/components/Chip.jsx"
import { colorForTypeOf } from "#src/pages/m/utilities.js"

const featuredArray = ["app.inlang.editor", "library.inlang.paraglideJsSveltekit", "app.inlang.cli"]

const Hero = () => {
	return (
		<div class="w-full flex gap-4 mt-10">
			<div class="w-1/4">
				<p class="pb-2 text-surface-500 text-sm">Featured</p>
				<ul class="-ml-3">
					<For each={featuredArray}>
						{(feature) => {
							const m = registry.find((m) => m.id === feature)
							return (
								<a href={"/m/" + m?.id}>
									<div class="flex gap-2 hover:bg-background px-3 py-[10px] rounded-lg items-center">
										<img class="w-9 h-9 rounded" src={m?.publisherIcon} alt={m?.id} />
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
			<div class="flex-1 flex flex-col gap-4 pl-4">
				<h1 class="text-xl text-surface-700 font-medium">
					Welcome to inlang, <br />
					the ecosystem to go global.
				</h1>
				<p class="text-md text-surface-500">💡 Expand to new markets and acquire more customers</p>
				<div class="w-[80%] pt-8">
					<img src="./images/expandV03.png" alt="Expand Graphic" />
				</div>
			</div>
		</div>
	)
}

export default Hero
