import { For } from "solid-js"
import { registry } from "@inlang/marketplace-registry"
import { Button } from "../components/Button.jsx"

const featuredArray = ["app.inlang.editor", "library.inlang.paraglideJsSveltekit", "app.inlang.cli"]

const Hero = () => {
	return (
		<div class="w-full flex gap-4 mt-12">
			<div class="w-1/4 bg-background border border-surface-200 rounded-xl p-5">
				<p class="pb-6 text-surface-400">Featured</p>
				<ul class="flex flex-col gap-8">
					<For each={featuredArray}>
						{(feature) => {
							const m = registry.find((m) => m.id === feature)
							return (
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<img class="w-8 h-8 rounded" src={m?.publisherIcon} alt={m?.id} />
										<h3 class="flex-1 text-lg text-surface-700 font-semibold whitespace-nowrap overflow-hidden">
											{(m?.displayName as { en: string }).en}
										</h3>
									</div>
									<p class="line-clamp-2">{(m?.description as { en: string }).en}</p>
									<div class="w-fit">
										<Button chevron={true} type="textPrimary" href={"/m/" + m?.id}>
											See more
										</Button>
									</div>
								</div>
							)
						}}
					</For>
				</ul>
			</div>
			<div class="flex-1 h-[600px] bg-background border border-surface-200 rounded-xl p-5">
				Welcome to inlang
			</div>
		</div>
	)
}

export default Hero
