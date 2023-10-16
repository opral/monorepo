import { Button } from "#src/pages/index/components/Button.jsx"
import MarketplaceBar from "#src/pages/index/components/MarketplaceBar.jsx"
import IconClose from "~icons/material-symbols/close-rounded"
import IconMenu from "~icons/material-symbols/menu-rounded"
import { Show, For, createSignal } from "solid-js"

const MarketplaceHeader = () => {
	const getMarketplaceLinks = () => {
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

	const getLinks = () => {
		return [
			{
				name: `Developers`,
				href: "/documentation",
			},
		]
	}

	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false)

	return (
		<header class="sticky top-0 w-full z-[100]">
			<div class={`w-full h-full relative z-10`}>
				<nav class={"md:p-0 max-w-7xl w-full flex justify-center mx-auto h-full"}>
					<div class="md:py-4 max-lg:hidden">
						<MarketplaceBar links={getMarketplaceLinks()} type={"light"} />
					</div>

					<Show when={mobileMenuIsOpen()}>
						<ol class="pl-8 pb-8 space-y-3 relativ w-full pt-24 overflow text-surface-100 bg-background border border-surface-200 h-[480px]">
							<For each={[getMarketplaceLinks(), getLinks()].flat()}>
								{(link) => (
									<>
										<Show when={link.name === "Developers"}>
											<div class="py-4">
												<div class="w-24 h-[1px] bg-surface-200 ml-8" />
											</div>
										</Show>
										<sl-tree>
											<a
												class="grow min-w-full w-full text-on-surface"
												href={link.href}
												onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
											>
												<sl-tree-item>{link.name}</sl-tree-item>
											</a>
										</sl-tree>
									</>
								)}
							</For>
						</ol>
					</Show>
				</nav>
			</div>

			<div class="lg:pl-4 xl:pl-0 absolute z-[90] top-0 h-[72px] left-0 w-full text-surface-200 pointer-events-none">
				<div class="max-w-[1280px] w-full mx-auto">
					<a href={"/"} class="flex items-center w-fit pt-[18px] pointer-events-auto">
						<img
							class={"h-9 w-9 " + !mobileMenuIsOpen()}
							src="/favicon/safari-pinned-tab.svg"
							alt="Company Logo"
						/>
						<span class={"self-center pl-2 text-left font-semibold text-surface-900"}>inlang</span>
					</a>
				</div>
			</div>
			<div class="absolute xl:pr-0 z-[90] top-0 h-[72px] left-0 w-full text-surface-200 pointer-events-none">
				<div class="max-w-[1280px] w-full mx-auto justify-end hidden lg:flex gap-8 items-center pt-[18px]">
					<For each={getLinks()}>
						{(link) => (
							<>
								<Button type="text" href={link.href}>
									{link.name}
								</Button>
							</>
						)}
					</For>
				</div>
				<div class="lg:hidden flex items-center justify-end h-[76px] pr-4">
					<button
						onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
						type="button"
						class="inline-flex items-center justify-center text-primary pointer-events-auto"
					>
						<span class="sr-only">{mobileMenuIsOpen() ? "Close menu" : "Open menu"}</span>
						{mobileMenuIsOpen() ? <IconClose class="w-6 h-6" /> : <IconMenu class="w-6 h-6" />}
					</button>
				</div>
			</div>
		</header>
	)
}

export default MarketplaceHeader
