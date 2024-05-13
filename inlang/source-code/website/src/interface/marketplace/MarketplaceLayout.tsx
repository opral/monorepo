import Footer from "#src/pages/index/Footer.jsx"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import DocHeader from "../components/doc-header.jsx"
import MarketplaceHeader from "./MarketplaceHeader.jsx"
import { Show, type JSXElement } from "solid-js"

const MarketplaceLayout = (props: { children: JSXElement; manifest?: MarketplaceManifest }) => {
	return (
		<div class="bg-surface-50 min-h-screen">
			<MarketplaceHeader withBorder={props.manifest ? false : true} />
			<Show when={props.manifest}>
				<DocHeader manifest={props.manifest!} />
			</Show>
			<div class="w-full px-4 min-h-[calc(100vh_-_107px_-_480px)]">
				<div class="max-w-7xl mx-auto">{props.children}</div>
			</div>
			<Footer />
		</div>
	)
}

export default MarketplaceLayout
