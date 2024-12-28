import { For, Show } from "solid-js";
import * as m from "#src/paraglide/messages.js";
import { registry } from "@inlang/marketplace-registry";
import Link from "#src/renderer/Link.jsx";
import { Chip } from "#src/interface/components/Chip.jsx";
import { colorForTypeOf } from "#src/pages/m/utilities.js";

const Features = () => {
	const getProducts = () => [
		"library.inlang.paraglideJs",
		"app.inlang.finkLocalizationEditor",
		"app.inlang.ideExtension",
		"app.inlang.cli",
	];
	return (
		<div class="w-full flex gap-4 mt-4 md:mt-10 mb-10 flex-col-reverse md:flex-row">
			<div class="w-full">
				<h2 class="pb-4 text-surface-900 font-semibold text-2xl leading-snug tracking-tight">
					{m.home_popular_products_title()}
				</h2>
				<div class="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
					<For each={getProducts()}>
						{(apps) => {
							const manifest = registry.find(
								(manifest) => manifest.id === apps
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
									class={
										"px-6 py-6 relative no-underline z-10 flex justify-between gap-4 overflow-hidden flex-col group w-full bg-background transition-all border border-surface-200 rounded-xl hover:shadow-lg hover:shadow-surface-100 hover:border-surface-300 active:border-surface-400"
									}
								>
									<div class="flex flex-1 flex-col gap-4">
										<div class="w-full flex gap-4 items-start">
											<div class="flex items-center gap-8 flex-shrink-0">
												<Show
													when={manifest.icon}
													fallback={
														<div class="w-10 h-10 font-semibold text-xl line-clamp-2 rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
															{displayName().split(" ")[0]![0]}
														</div>
													}
												>
													<img
														alt={
															// @ts-ignore
															displayName().en
														}
														class="w-10 h-10 rounded-lg m-0 object-cover object-center"
														src={manifest.icon}
													/>
												</Show>
											</div>
											<div class="flex flex-col justify-between items-start">
												<h4
													// eslint-disable-next-line solid/style-prop
													style="text-wrap: balance;"
													class="m-0 text-sm text-surface-800 line-clamp-2 leading-none no-underline font-semibold group-hover:text-surface-900 transition-colors"
												>
													{displayName()}
												</h4>

												<div class="flex items-center mt-2 gap-1 flex-wrap">
													<Chip
														text={"app"}
														color={colorForTypeOf("app.x.x")}
														customClasses="text-xs"
													/>
												</div>
											</div>
										</div>
										<p class="text-sm line-clamp-2 text-surface-500 transition-colors group-hover:text-surface-600">
											{description()}
										</p>
									</div>
									{/* <div class="flex items-center gap-2 justify-between">
										<Show when={props.item.publisherIcon}>
											<div class="flex gap-2">
												<img
													alt={
														// @ts-ignore
														props.item.publisherName.en
													}
													class="w-5 h-5 rounded-full object-cover object-center"
													src={props.item.publisherIcon}
												/>
												<p class="text-sm text-surface-500 group-hover:text-surface-600 transition-colors">
													{props.item.publisherName}
												</p>
											</div>
										</Show>
										<div>
											<Show
												when={props.item.keywords
													.map((keyword: string) => keyword.toLowerCase())
													.includes("lix")}
											>
												<div class="w-5 text-primary group transition-colors">
													<LixBadge />
												</div>
											</Show>
										</div>
									</div> */}
								</Link>
							);
						}}
					</For>
				</div>
			</div>
		</div>
	);
};

export default Features;
