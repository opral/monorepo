import { createSignal, For, Switch, type Setter, Match } from "solid-js"
import DeveloperSlide from "./Developer.jsx"
import TranslatorSlide from "./Translator.jsx"
import DesignrSlide from "./Designer.jsx"

type slideOptions = "developer" | "translator" | "designer"

const [slide, setSlide] = createSignal<slideOptions>("developer")

const slideMap: Array<{ id: slideOptions; title: string; function: Setter<slideOptions> }> = [
	{
		id: "developer",
		title: "🛠️ Developer",
		function: () => setSlide("developer"),
	},
	{
		id: "translator",
		title: "✈️ Translator",
		function: () => setSlide("translator"),
	},
	{
		id: "designer",
		title: "🎨 Designer",
		function: () => setSlide("designer"),
	},
]

const Personas = () => {
	return (
		<div class="pt-20">
			<h2 class="font-bold text-4xl text-surface-900 text-center">
				Different Users. Different Tools.
				<br />
				One Ecosystem.
			</h2>
			<div class="flex justify-center gap-2 mt-8">
				<For each={slideMap}>
					{(slideItem) => (
						<button
							class={`${
								slideItem.id === slide()
									? "text-surface-900 bg-surface-200"
									: "text-surface-500 bg-surface-100"
							} text-lg font-bold px-4 py-2 rounded-full`}
							onClick={slideItem.function}
						>
							{slideItem.title}
						</button>
					)}
				</For>
			</div>
			<Switch>
				<Match when={slide() === "developer"}>
					<div class="grid grid-cols-12 h-[496px] mt-8">
						<div class="col-span-10 col-start-2 bg-background h-full rounded-2xl border border-surface-200">
							<DeveloperSlide />
						</div>
					</div>
				</Match>
				<Match when={slide() === "translator"}>
					<div class="grid grid-cols-12 h-[496px] mt-8">
						<div class="col-span-10 col-start-2 bg-background h-full rounded-2xl border border-surface-200">
							<TranslatorSlide />
						</div>
					</div>
				</Match>
				<Match when={slide() === "designer"}>
					<div class="grid grid-cols-12 h-[496px] mt-8">
						<div class="col-span-10 col-start-2 bg-background h-full rounded-2xl border border-surface-200">
							<DesignrSlide />
						</div>
					</div>
				</Match>
			</Switch>
		</div>
	)
}

export default Personas
