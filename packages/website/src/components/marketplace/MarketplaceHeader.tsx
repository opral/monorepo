import { Button } from "#src/pages/index/components/Button.jsx"
import MarketplaceSearchBar from "./MarketplaceSearchBar.jsx"
import CategoryTabs from "./CategoryTabs.jsx"
import { Show } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"

const MarketplaceHeader = () => {
	return (
		<header class="sticky top-0 w-full z-[9999] bg-background border-b border-surface-200 px-4">
			<div class="max-w-7xl mx-auto flex justify-between items-center relative sm:static mb-10 sm:mb-0">
				<a href={"/"} class="flex items-center w-fit pointer-events-auto py-4">
					<img class={"h-8 w-8"} src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
					<span class={"self-center pl-2 text-left font-semibold text-surface-900"}>inlang</span>
				</a>
				<div class="absolute sm:static top-16 sm:top-0 w-full sm:max-w-sm mx-auto sm:mx-0">
					<MarketplaceSearchBar />
				</div>
				<div class="flex">
					<Button type="text" href="/documentation">
						Developer
					</Button>
				</div>
			</div>
			<Show when={!currentPageContext.urlParsed.pathname.includes("/m/")}>
				<CategoryTabs />
			</Show>
		</header>
	)
}

export default MarketplaceHeader
