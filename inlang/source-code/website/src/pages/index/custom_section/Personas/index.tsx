import { createSignal, For, Switch, type Setter, Match } from "solid-js";
import DeveloperSlide from "./Developer.jsx";
import TranslatorSlide from "./Translator.jsx";
import DesignrSlide from "./Designer.jsx";
import * as m from "#src/paraglide/messages.js";

type slideOptions = "developer" | "translator" | "designer";

const [slide, setSlide] = createSignal<slideOptions>("developer");

const Personas = () => {
	const slideMap: Array<{
		id: slideOptions;
		title: string;
		function: Setter<slideOptions>;
	}> = [
		{
			id: "developer",
			title: m.home_personas_developer_title(),
			function: () => setSlide("developer"),
		},
		{
			id: "translator",
			title: m.home_personas_translator_title(),
			function: () => setSlide("translator"),
		},
		{
			id: "designer",
			title: m.home_personas_designer_title(),
			function: () => setSlide("designer"),
		},
	];

	return (
		<div id="personas" class="pt-16 flex flex-col items-center">
			<p class="bg-background px-4 py-1.5 rounded-full text-sm font-medium w-fit border shadow border-surface-300">
				{m.home_personas_tag()}
			</p>
			<h2 class="font-bold text-2xl md:text-4xl text-surface-900 text-center mt-6">
				{m.home_personas_title()}
			</h2>
			<div class="w-full flex justify-center gap-2 mt-8 flex-wrap">
				<For each={slideMap}>
					{(slideItem) => (
						<button
							class={`${
								slideItem.id === slide()
									? "text-surface-900 bg-surface-200"
									: "text-surface-500 bg-surface-100"
							} md:text-lg font-bold px-4 py-2 rounded-full`}
							onClick={slideItem.function}
						>
							{slideItem.title}
						</button>
					)}
				</For>
			</div>
			<Switch>
				<Match when={slide() === "developer"}>
					<div class="grid grid-cols-12 lg:h-[496px] mt-8 w-full">
						<div class="col-span-12 lg:col-span-10 lg:col-start-2 bg-background h-full rounded-2xl border border-surface-200">
							<DeveloperSlide />
						</div>
					</div>
				</Match>
				<Match when={slide() === "translator"}>
					<div class="grid grid-cols-12 lg:h-[496px] mt-8 w-full">
						<div class="col-span-12 lg:col-span-10 lg:col-start-2 bg-background h-full rounded-2xl border border-surface-200">
							<TranslatorSlide />
						</div>
					</div>
				</Match>
				<Match when={slide() === "designer"}>
					<div class="grid grid-cols-12 lg:h-[496px] mt-8 w-full">
						<div class="col-span-12 lg:col-span-10 lg:col-start-2 bg-background h-full rounded-2xl border border-surface-200">
							<DesignrSlide />
						</div>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default Personas;
