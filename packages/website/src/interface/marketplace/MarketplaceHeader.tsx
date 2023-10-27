import { Button } from "#src/pages/index/components/Button.jsx"
import SearchBar, { setSearchInput } from "#src/interface/components/SearchBar.jsx"
import CategoryTabs from "./CategoryTabs.jsx"
import { For, Show } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"
import IconTwitter from "~icons/cib/twitter"
import IconGithub from "~icons/cib/github"
import IconDiscord from "~icons/cib/discord"
import Link from "#src/renderer/Link.jsx"
import * as m from "@inlang/paraglide-js/inlang-marketplace/messages"
import { LanguagePicker } from "#src/pages/index/LanguagePicker.jsx"

const MarketplaceHeader = () => {
	const socialMediaLinks = [
		{
			name: "Twitter",
			href: "https://twitter.com/inlangHQ",
			Icon: IconTwitter,
			screenreader: "Twitter Profile",
		},
		{
			name: "GitHub",
			href: "https://github.com/inlang/monorepo",
			Icon: IconGithub,
			screenreader: "GitHub Repository",
		},
		{
			name: "Discord",
			href: "https://discord.gg/gdMPPWy57R",
			Icon: IconDiscord,
			screenreader: "Discord Server",
		},
	]

	return (
		<header class="sticky top-0 w-full z-[9999] bg-background border-b border-surface-200 px-4">
			<div
				class={
					"max-w-7xl mx-auto flex justify-between items-center relative sm:static sm:mb-0 " +
					(!currentPageContext.urlParsed.pathname.includes("/documentation") ? "mb-10" : "mb-1")
				}
			>
				<Link
					href={"/"}
					onClick={() => setSearchInput("")}
					class="flex items-center w-fit pointer-events-auto py-4"
				>
					<img class={"h-8 w-8"} src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
					<span class={"self-center pl-2 text-left font-semibold text-surface-900"}>inlang</span>
				</Link>
				<Show when={!currentPageContext.urlParsed.pathname.includes("/documentation")}>
					<div class="absolute lg:absolute lg:top-4 lg:left-1/2 lg:-translate-x-1/2 sm:static top-16 sm:top-0 w-full sm:max-w-sm mx-auto sm:mx-0">
						<SearchBar />
					</div>
				</Show>
				<div class="flex gap-8">
					<Button type="text" href="/documentation">
						{m.marketplace_header_build_on_inlang_button()}
					</Button>

					<div class="gap-[2px] items-center hidden md:flex">
						<For each={socialMediaLinks}>
							{(link) => (
								<Link
									target="_blank"
									class={"text-surface-700 hover:text-primary flex space-x-2 items-center p-2"}
									href={link.href}
								>
									<link.Icon class="w-5 h-5" />
									<span class="sr-only">{link.name}</span>
								</Link>
							)}
						</For>
					</div>
					<LanguagePicker />
				</div>
			</div>
			<Show
				when={
					!currentPageContext.urlParsed.pathname.includes("/m/") &&
					!currentPageContext.urlParsed.pathname.includes("/g/") &&
					!currentPageContext.urlParsed.pathname.includes("/documentation") &&
					!currentPageContext.urlParsed.pathname.includes("/install")
				}
			>
				<CategoryTabs />
			</Show>
		</header>
	)
}

export default MarketplaceHeader
