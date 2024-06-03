import { Show } from "solid-js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded"
import MaterialSymbolsDownloading from "~icons/material-symbols/downloading"
import { Chip } from "./Chip.jsx"
import { typeOfIdToTitle } from "../marketplace/helper/utilities.js"

const DocHeader = (props: { manifest: MarketplaceManifest }) => {
	const displayName = () =>
		typeof props.manifest.displayName === "object"
			? props.manifest.displayName.en
			: props.manifest.displayName

	return (
		<div class="product-header w-full px-4 h-14 bg-surface-100 border-b border-t border-surface-200 sticky top-[128px] sm:top-[106px] z-50">
			<div class="max-w-7xl mx-auto flex justify-between items-center h-full">
				<div class="flex gap-4 items-center">
					<Show
						when={props.manifest.icon}
						fallback={
							<div class="w-7 h-7 font-semibold line-clamp-2 text-sm rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
								{displayName().split(" ")[0]![0]}
							</div>
						}
					>
						<img class="w-7 h-7" src={props.manifest.icon} alt="product icon" />
					</Show>

					<h2 class="font-semibold m-0">{displayName()}</h2>
					<Chip
						text={typeOfIdToTitle(props.manifest.id)}
						color={"#475569"}
						customClasses="text-xs"
					/>
				</div>
				<Show when={props.manifest.website}>
					<a href={props.manifest.website}>
						<div class="h-8 flex text-[14px] items-center justify-center bg-surface-700 hover:bg-surface-900 text-surface-50 rounded-md">
							<p class="hidden sm:block pl-4">
								{props.manifest.id.includes("plugin.") ||
								props.manifest.id.includes("messageLintRule.")
									? "Install"
									: "Open"}
							</p>
							<Show
								when={
									props.manifest.id.includes("plugin.") ||
									props.manifest.id.includes("messageLintRule.")
								}
								fallback={<MaterialSymbolsArrowOutwardRounded class="ml-2 mr-3 w-5 h-5" />}
							>
								<MaterialSymbolsDownloading class="ml-2 mr-3 w-5 h-5" />
							</Show>
						</div>
					</a>
				</Show>
			</div>
		</div>
	)
}

export default DocHeader
