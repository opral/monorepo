import { Show } from "solid-js"
import Link from "#src/renderer/Link.jsx"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded"
import { Chip } from "./Chip.jsx"
import { typeOfIdToTitle } from "../marketplace/helper/utilities.js"

const DocHeader = (props: { manifest: MarketplaceManifest }) => {
	const displayName = () =>
		typeof props.manifest.displayName === "object"
			? props.manifest.displayName.en
			: props.manifest.displayName

	return (
		<div class="product-header w-full px-4 h-14 bg-surface-100 border-b border-t border-surface-200 sticky top-[128px] sm:top-[106px] z-[9999]">
			<div class="max-w-7xl mx-auto flex justify-between items-center h-full">
				<div class="flex gap-4 items-center">
					<img class="w-7 h-7" src={props.manifest.icon} alt="product icon" />
					<h2 class="font-semibold m-0">{displayName()}</h2>
					<Chip
						text={typeOfIdToTitle(props.manifest.id)}
						color={"#475569"}
						customClasses="text-xs"
					/>
				</div>
				<Show when={props.manifest.website}>
					<Link href={props.manifest.website}>
						<div class="h-8 flex text-[14px] items-center justify-center bg-surface-700 hover:bg-surface-900 text-surface-50 rounded-md">
							<p class="hidden sm:block pl-4">Open</p>
							<MaterialSymbolsArrowOutwardRounded class="mx-3" />
						</div>
					</Link>
				</Show>
			</div>
		</div>
	)
}

export default DocHeader
