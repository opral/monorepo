import { Button } from "#src/pages/index/components/Button.jsx"
import MarketplaceSearchBar from "./MarketplaceSearchBar.jsx"
import CategoryTabs from "./CategoryTabs.jsx"
import { For, Show } from "solid-js"
import { currentPageContext } from "#src/renderer/state.js"
import IconTwitter from "~icons/cib/twitter"
import IconGithub from "~icons/cib/github"
import IconDiscord from "~icons/cib/discord"

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
			<div class="max-w-7xl mx-auto flex justify-between items-center relative sm:static mb-10 sm:mb-0">
				<a
					href={
						currentPageContext.urlParsed.pathname === "/"
							? currentPageContext.urlParsed.origin + "//" + currentPageContext.urlParsed.pathname
							: "/"
					}
					class="flex items-center w-fit pointer-events-auto py-4"
				>
					<img class={"h-8 w-8"} src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
					<span class={"self-center pl-2 text-left font-semibold text-surface-900"}>inlang</span>
				</a>
				<Show when={!currentPageContext.urlParsed.pathname.includes("/documentation")}>
					<div class="absolute sm:static top-16 sm:top-0 w-full sm:max-w-sm mx-auto sm:mx-0">
						<MarketplaceSearchBar />
					</div>
				</Show>
				<div class="flex gap-8">
					<Button type="text" href="/documentation">
						Developers
					</Button>
					<div class="flex gap-[2px] items-center">
						<For each={socialMediaLinks}>
							{(link) => (
								<a
									target="_blank"
									class={"text-surface-700 hover:text-primary flex space-x-2 items-center p-2"}
									href={link.href}
								>
									<link.Icon class="w-5 h-5" />
									<span class="sr-only">{link.name}</span>
								</a>
							)}
						</For>
					</div>
				</div>
			</div>
			<Show
				when={
					!currentPageContext.urlParsed.pathname.includes("/m/") &&
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
