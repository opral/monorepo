import { For } from "solid-js";
import { currentPageContext } from "#src/renderer/state.js";
import Link from "#src/renderer/Link.jsx";
import * as m from "#src/paraglide/messages.js";

const CategoryTabs = () => {
	const getCategories = () => {
		return [
			{
				name: "Apps",
				href: "/c/apps",
			},
			{
				name: m.marketplace_header_plugins_title(),
				href: "/c/plugins",
			},
			// {
			// 	name: m.marketplace_header_lintRules_title(),
			// 	href: "/c/lint-rules",
			// },
			// {
			// 	name: m.marketplace_header_guides_title(),
			// 	href: "/c/guides",
			// },
		];
	};
	return (
		<nav class="max-w-7xl mx-auto flex gap-2 overflow-x-scroll hide-scrollbar items-center px-4 md:px-0 h-16 sm:h-auto bg-surface-50 sm:bg-background border-t sm:border-t-0 border-surface-200">
			<p class="hidden sm:block text-sm pr-4 font-regular text-surface-500">
				{m.footer_category_title() + ":"}
			</p>
			<For each={getCategories()}>
				{(link) => (
					<div
						class={
							(currentPageContext.urlParsed.pathname.includes(link.href)
								? "border-hover-primary "
								: "border-background ") +
							" sm:border-b-[2px] py-[4px] text-sm bg-transparent group content-box"
						}
					>
						<Link
							href={link.href}
							target={link.href.includes("github.com") ? "_blank" : "_default"}
						>
							<div
								class={
									(currentPageContext.urlParsed.pathname.includes(link.href)
										? " bg-hover-primary text-background sm:text-primary sm:bg-background"
										: " text-surface-700 sm:text-surface-600 bg-surface-200 sm:bg-background sm:hover:bg-surface-100 ") +
									" px-3 sm:px-2 py-[6px] rounded-md transition-colors font-medium cursor-pointer w-max"
								}
							>
								{link.name}
							</div>
						</Link>
					</div>
				)}
			</For>
		</nav>
	);
};

export default CategoryTabs;
