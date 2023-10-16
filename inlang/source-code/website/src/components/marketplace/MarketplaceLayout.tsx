import Footer from "#src/pages/index/Footer.jsx"
import MarketplaceHeader from "./MarketplaceHeader.jsx"
import type { JSXElement } from "solid-js"

const MarketplaceLayout = (props: { children: JSXElement }) => {
	return (
		<div class="px-4 bg-surface-50">
			<MarketplaceHeader />
			<div class="max-w-7xl mx-auto">{props.children}</div>
			<Footer />
		</div>
	)
}

export default MarketplaceLayout
