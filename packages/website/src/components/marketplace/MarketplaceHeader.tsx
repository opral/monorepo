import { Button } from "#src/pages/index/components/Button.jsx"
import { For } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"
import MarketplaceSearchBar from "./MarketplaceSearchBar.jsx"

const MarketplaceHeader = () => {
	const getCategories = () => {
		return [
			{
				name: `Application`,
				href: "/application",
			},
			{
				name: `Website`,
				href: "/website",
			},
			{
				name: `Markdown`,
				href: "/markdown",
			},
			{
				name: `Missing something?`,
				href: "https://github.com/orgs/inlang/discussions",
			},
		]
	}

	console.log(currentPageContext.urlParsed.pathname)

	return (
		<header class="sticky top-0 w-full z-[9999] bg-background border-b border-surface-200">
			<div class="max-w-7xl mx-auto flex justify-between items-center">
				<a href={"/"} class="flex items-center w-fit pointer-events-auto py-4">
					<img class={"h-8 w-8"} src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
					<span class={"self-center pl-2 text-left font-semibold text-surface-900"}>inlang</span>
				</a>
				<MarketplaceSearchBar />
				<div class="flex">
					<Button type="text" href="/developer">
						Developer
					</Button>
				</div>
			</div>
			<nav class="max-w-7xl mx-auto flex">
				<For each={getCategories()}>
					{(link) => (
						<div
							class={
								(currentPageContext.urlParsed.pathname.includes(link.href)
									? "border-b-[2px] border-hover-primary "
									: " ") + " py-[4px] text-sm bg-transparent group"
							}
						>
							<a href={link.href}>
								<div
									class={
										(currentPageContext.urlParsed.pathname.includes(link.href)
											? "text-primary "
											: "text-surface-600 ") +
										" px-2 py-[6px] group-hover:bg-surface-100 rounded-md font-medium cursor-pointer "
									}
								>
									{link.name}
								</div>
							</a>
						</div>
					)}
				</For>
			</nav>
		</header>
	)
}

export default MarketplaceHeader
