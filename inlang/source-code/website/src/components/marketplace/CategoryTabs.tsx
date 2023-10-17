import { For } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"

const CategoryTabs = () => {
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
				href: "https://github.com/inlang/monorepo/discussions",
			},
		]
	}
	return (
		<nav class="max-w-7xl mx-auto flex gap-4 overflow-x-scroll">
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
						<a href={link.href}>
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
						</a>
					</div>
				)}
			</For>
		</nav>
	)
}

export default CategoryTabs
