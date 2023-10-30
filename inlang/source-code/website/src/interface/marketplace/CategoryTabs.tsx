import { For } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"
import Link from "#src/renderer/Link.jsx"
import * as m from "@inlang/paraglide-js/inlang-marketplace/messages"
import { setSearchInput } from "../components/SearchBar.jsx"

const CategoryTabs = () => {
	const getCategories = () => {
		return [
			{
				name: m.marketplace_header_category_application(),
				href: "/c/application",
			},
			{
				name: m.marketplace_header_category_website(),
				href: "/c/website",
			},
			{
				name: m.marketplace_header_category_markdown(),
				href: "/c/markdown",
			},
			{
				name: m.marketplace_header_category_lint(),
				href: "/c/lint-rules",
			},
			{
				name: m.marketplace_header_category_missing_something(),
				href: "https://github.com/inlang/monorepo/discussions",
			},
		]
	}
	return (
		<nav class="max-w-7xl mx-auto flex gap-4 overflow-x-scroll hide-scrollbar">
			<For each={getCategories()}>
				{(link) => (
					<div
						class={
							(currentPageContext.urlParsed.pathname.includes(link.href)
								? "border-hover-primary "
								: "border-background ") +
							" border-b-[2px] py-[4px] text-sm bg-transparent group content-box"
						}
					>
						<Link
							href={link.href}
							onClick={() => setSearchInput("")}
							target={link.href.includes("github.com") ? "_blank" : "_default"}
						>
							<div
								class={
									(currentPageContext.urlParsed.pathname.includes(link.href)
										? "text-primary "
										: "text-surface-600 ") +
									" px-2 py-[6px] group-hover:bg-surface-100 rounded-md font-medium cursor-pointer w-max"
								}
							>
								{link.name}
							</div>
						</Link>
					</div>
				)}
			</For>
		</nav>
	)
}

export default CategoryTabs
