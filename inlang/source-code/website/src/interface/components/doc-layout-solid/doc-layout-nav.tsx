import Link from "#src/renderer/Link.jsx"
import { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { Show, For } from "solid-js"

const InlangDocNavigation = (props: {
	manifest: MarketplaceManifest & { uniqueID: string }
	currentRoute: string
}) => {
	const basePath = () => {
		if (props.manifest.slug) {
			return `/m/${props.manifest.uniqueID}/${props.manifest.slug}`
		} else {
			return `/m/${props.manifest.uniqueID}/${props.manifest.id.replaceAll(".", "-")}`
		}
	}

	const displayName = () => {
		if (typeof props.manifest.displayName === "object") {
			return props.manifest.displayName.en
		} else {
			return props.manifest.displayName
		}
	}

	return (
		<div class="flex flex-col pt-12 gap-8">
			<div class="flex sm:hidden flex-col gap-[2px]">
				<img class="w-[36px] h-[36px] mb-3" src={props.manifest.icon} />
				<p class="font-semibold m-0">{displayName()}</p>
				<p class="text-sm m-0 text-surface-500">{`by ${props.manifest.publisherName}`}</p>
			</div>
			<Show when={props.manifest.pages}>
				<div class="-ml-3 p-0 flex flex-col">
					<For each={Object.entries(props.manifest.pages!)}>
						{([key, value]) => {
							if (typeof value === "string") {
								const route = key
								const navTitle = route.split("/").pop()

								return (
									<Link
										class={`flex items-center justify-between h-[34px] px-3 text-sm capitalize rounded-md ${
											props.currentRoute === route
												? "bg-primary-container/40 text-primary font-medium hover:bg-primary-container/40 hover:text-primary"
												: "text-surface-600 hover:text-surface-900 hover:bg-surface-100 font-normal"
										}`}
										href={basePath() + route}
									>
										{navTitle ? navTitle.replaceAll("-", " ") : "Introduction"}
									</Link>
								)
							} else {
								return (
									<>
										<div class="flex items-center h-[34px] px-3 text-surface-900 text-sm capitalize font-semibold">
											{key}
										</div>
										<For each={Object.entries(value)}>
											{([route, path]) => {
												const navTitle = route.split("/").pop()
												const isLink =
													(path as string).endsWith(".md") || (path as string).endsWith(".html")
														? false
														: true
												return (
													<Link
														class={`flex items-center justify-between h-[34px] px-3 text-sm capitalize rounded-md ${
															props.currentRoute === route
																? "bg-primary-container/40 text-primary font-medium hover:bg-primary-container/40 hover:text-primary"
																: "text-surface-500 hover:text-surface-900 hover:bg-surface-100 font-normal"
														}`}
														href={isLink ? (path as string) : basePath() + route}
													>
														<Show when={navTitle} fallback={"Introduction"}>
															<p>{navTitle!.replaceAll("-", " ")}</p>
														</Show>
														<Show when={isLink}>
															<div class="w-[14px] h-[14px] text-surface-400">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="100%"
																	height="100%"
																	fill="none"
																	viewBox="0 0 16 16"
																>
																	<path
																		fill="currentColor"
																		d="M15.716 8.433l-5.759 5.784a.96.96 0 01-1.64-.683c0-.256.1-.501.28-.683l4.12-4.136H.96A.958.958 0 010 7.751a.966.966 0 01.96-.964h11.758L8.599 2.648A.968.968 0 019.28 1c.255 0 .5.102.68.283l5.76 5.784a.963.963 0 01.207 1.053.965.965 0 01-.21.313z"
																	/>
																</svg>
															</div>
														</Show>
													</Link>
												)
											}}
										</For>
										<div class="w-full h-6" />
									</>
								)
							}
						}}
					</For>
				</div>
			</Show>
		</div>
	)
}

export default InlangDocNavigation
