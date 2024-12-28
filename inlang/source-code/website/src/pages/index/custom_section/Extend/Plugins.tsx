import Link from "#src/renderer/Link.jsx";
import { registry } from "@inlang/marketplace-registry";
import { For, Show } from "solid-js";
import { Arrow } from "../Personas/Developer.jsx";
import { Button } from "../../components/Button.jsx";
import * as m from "#src/paraglide/messages.js";

const PluginSection = () => {
	const getPlugins = () => [
		"plugin.inlang.messageFormat",
		"plugin.inlang.tFunctionMatcher",
		"plugin.inlang.i18next",
		"plugin.inlang.json",
	];

	const getCheckList = () => [
		m.home_extend_plugins_list_integrate(),
		m.home_extend_plugins_list_customize(),
	];

	return (
		<div class="lg:grid grid-cols-12 w-full">
			<div class="col-span-10 col-start-2 bg-surface-100 px-6 md:px-8 pt-3 pb-6 md:py-8 rounded-2xl border border-surface-200">
				<div class="md:grid grid-cols-12 gap-8 lg:gap-0">
					<div class="col-span-4 flex flex-col justify-between py-4 lg:pl-4 pb-10 md:pb-0">
						<div class="md:mt-6 flex flex-col gap-3 pb-8">
							<h3 class="font-semibold text-surface-900 text-2xl">
								{m.home_extend_plugins_title()}
							</h3>
							<p class="text-surface-500 mt-2">
								{m.home_extend_plugins_description()}
							</p>
							<div class="mt-4">
								<For each={getCheckList()}>
									{(item) => (
										<div class="flex gap-2 items-center">
											<CheckIcon />
											<p class="text-surface-900">{item}</p>
										</div>
									)}
								</For>
							</div>
						</div>
						<div class="flex flex-wrap gap-x-4 gap-y-2">
							<Button type="secondaryOnGray" href="/c/plugins">
								{m.home_extend_plugins_button()}
							</Button>
							<Button type="text" href="/g/00162hsd" chevron>
								Why Plugins?
							</Button>
						</div>
					</div>
					<div class="col-span-8">
						<div class="grid grid-rows-4 sm:grid-rows-2 sm:grid-cols-2 gap-4 w-full lg:translate-x-16">
							<For each={getPlugins()}>
								{(plugin) => {
									const manifest = registry.find(
										(manifest) => manifest.id === plugin
									);
									if (!manifest) {
										return undefined;
									}
									const displayName = () =>
										typeof manifest.displayName === "object"
											? manifest.displayName.en
											: manifest.displayName;
									const description = () =>
										typeof manifest.description === "object"
											? manifest.description.en
											: manifest.description;

									return (
										<Link
											href={`/m/${manifest.uniqueID}/${manifest.id.replaceAll(".", "-")}`}
											class="col-span-1 bg-background border border-surface-200 hover:border-surface-400 rounded-2xl px-6 py-5 flex flex-col gap-6 transition-all"
										>
											<div class="flex justify-between items-center">
												<Show
													when={manifest.icon}
													fallback={
														<div class="w-10 h-10 font-semibold text-xl line-clamp-2 rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
															{displayName().split(" ")[0]![0]}
														</div>
													}
												>
													<img
														class="rounded w-10 h-10"
														src={manifest.icon}
														alt={displayName()}
													/>
												</Show>
												<div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
													<Arrow />
												</div>
											</div>
											<div class="flex flex-col gap-1">
												<div class="font-bold text-surface-600">
													{displayName()}
												</div>
												<div class="line-clamp-2 text-surface-500 text-sm">
													{description()}
												</div>
											</div>
										</Link>
									);
								}}
							</For>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PluginSection;

function CheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="25"
			fill="none"
			viewBox="0 0 24 25"
		>
			<path
				fill="#06B6D4"
				d="M9.55 18.502l-5.7-5.7 1.425-1.425 4.275 4.275 9.175-9.175 1.425 1.425-10.6 10.6z"
			/>
		</svg>
	);
}
