import Footer from "#src/pages/index/Footer.jsx"
import MarketplaceHeader from "./MarketplaceHeader.jsx"
import type { JSXElement } from "solid-js"

const MarketplaceLayout = (props: { children: JSXElement }) => {
	return (
		<div class="bg-surface-50 min-h-screen">
			<MarketplaceHeader />
			<div class="w-full px-4 min-h-[calc(100vh_-_107px_-_480px)]">
				<div class="max-w-7xl mx-auto">{props.children}</div>
			</div>
			<Footer />
		</div>
	)
}

export default MarketplaceLayout
