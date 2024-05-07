import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { Show, createEffect, createSignal, onMount, type JSXElement } from "solid-js"
import MenuIcon from "~icons/material-symbols/menu"
import InlangDocNavigation from "./doc-layout-nav.jsx"
import InlangDocInPage from "./doc-layout-in-page.jsx"

const InlangDoclayout = (props: {
	children: JSXElement
	manifest: MarketplaceManifest & { uniqueID: string }
	currentRoute: string
}) => {
	const [drawerIsOpen, setDrawerIsOpen] = createSignal(false)
	const [isLoaded, setIsLoaded] = createSignal(false)

	createEffect(() => {
		// remove header element when drawer is open
		const header: HTMLCollectionOf<HTMLElement> = document.getElementsByTagName("header")

		if (header[0] && drawerIsOpen()) {
			// @ts-ignore
			header[0].style = "z-index: 1"
		} else if (header[0]) {
			// @ts-ignore
			header[0].style = "z-index: 1000"
		}
	})

	onMount(() => {
		setIsLoaded(true)
	})

	return (
		<div class="flex w-full h-full">
			<div class="hidden sm:block sticky top-[140px] w-[230px] h-full">
				<InlangDocNavigation manifest={props.manifest} currentRoute={props.currentRoute} />
			</div>
			<div class="flex-1 w-min overflow-hidden h-full px-0 sm:px-5 xl:px-10">
				{props.children}
				<div
					class="fixed bottom-[24px] right-[24px] sm:hidden"
					onClick={() => setDrawerIsOpen(true)}
				>
					<div class="flex justify-center items-center w-12 h-12 bg-background border border-surface-200 shadow rounded-full">
						<MenuIcon class="w-6 h-6" />
					</div>
				</div>
			</div>
			<div class="hidden xl:block sticky top-[140px] w-[230px] h-[calc(100vh_-_107px_-_64px)]">
				<div class="w-full h-full overflow-y-scroll pb-20">
					<InlangDocInPage
						manifest={props.manifest}
						contentInHtml={(props.children as HTMLElement).children}
						currentRoute={props.currentRoute}
					/>
				</div>

				<div class="absolute h-[60px] w-full bottom-0 bg-gradient-to-t from-surface-50 pointer-events-none"></div>
			</div>
			<Show when={isLoaded()}>
				<sl-drawer
					prop:open={drawerIsOpen()}
					on:sl-after-hide={() => {
						setDrawerIsOpen(false)
					}}
				>
					<InlangDocNavigation manifest={props.manifest} currentRoute={props.currentRoute} />
				</sl-drawer>
			</Show>
		</div>
	)
}

export default InlangDoclayout
