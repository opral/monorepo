import { For, Show } from "solid-js"
import { registry } from "@inlang/marketplace-registry"
import { Chip } from "#src/components/Chip.jsx"
import { colorForTypeOf } from "#src/pages/m/utilities.js"
import { Button } from "../components/Button.jsx"

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
			<div class="w-full md:w-1/4 md:pr-8">
				<p class="pb-2 text-surface-500 text-sm">Featured</p>
				<ul class="divide-y divide-surface-3">
					<For each={featuredArray}>
						{(feature) => {
							const m = registry.find((m) => m.id === feature)
							return (
								<li>
									<a href={"/m/" + m?.id}>
										<div class="flex gap-4 hover:bg-background px-1 py-[10px] rounded-lg items-center">
											<img
												class="w-9 h-9 rounded-md m-0 shadow-lg object-cover object-center"
												src={m?.icon}
												alt={m?.id}
											/>
											<div class="flex w-full flex-col gap-1">
												<h3 class="text-sm w-full pr-10 text-surface-800 font-semibold truncate">
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
								</li>
							)
						}}
					</For>
				</ul>
			</div>
			<div class="flex-1 flex flex-col gap-4 md:py-0 bg-background rounded-2xl border border-surface-200 overflow-hidden lg:min-h-[375px]">
				<div class="flex-1 hidden lg:block w-full bg-[url('./images/expandV04.png')] bg-cover bg-center" />
				<img class="lg:hidden" src="./images/expandV04.png" alt="inlang Ecosystem" />
				<div class="flex flex-col md:flex-row items-start md:items-end px-8 pb-6 pt-3">
					<div class="flex flex-col gap-2 flex-1">
						<h1 class="text-md text-surface-900 font-semibold">
							Welcome to <span class="text-primary">inlang</span>, <br />
							the ecosystem to go global.
						</h1>
						<p class="text-sm text-surface-500">
							💡 Expand to new markets and acquire more customers
						</p>
					</div>
					<Button type="textPrimary" href="/" class="-mb-[10px]">
						{"More about the ecosystem >"}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default Hero
