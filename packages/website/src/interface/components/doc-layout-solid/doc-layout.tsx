import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { Show, createEffect, createSignal, onMount, type JSXElement } from "solid-js"
import MenuIcon from "~icons/material-symbols/menu"
import InlangDocNavigation from "./doc-layout-nav.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import InlangDocMeta from "./doc-layout-meta.jsx"

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
		const productHeader: HTMLCollectionOf<Element> =
			document.getElementsByClassName("product-header")

		if (header[0] && drawerIsOpen()) {
			// @ts-ignore
			header[0].style = "z-index: 1"
		} else if (header[0]) {
			// @ts-ignore
			header[0].style = "z-index: 50"
		}

		if (productHeader[0] && drawerIsOpen()) {
			// @ts-ignore
			productHeader[0].style = "z-index: 1"
		} else if (productHeader[0]) {
			// @ts-ignore
			productHeader[0].style = "z-index: 40"
		}
	})

	onMount(() => {
		setIsLoaded(true)
	})

	createEffect(() => {
		if (currentPageContext?.urlParsed) {
			setDrawerIsOpen(false)
		}
	})

	return (
		<div class="flex w-full h-full">
			<div class="hidden sm:block sticky top-[164px] w-[230px] h-[calc(100vh_-_164px)]">
				<div class="w-full h-full overflow-y-scroll pb-8 pl-3 -ml-3">
					<InlangDocNavigation manifest={props.manifest} currentRoute={props.currentRoute} />
				</div>
			</div>
			<div class="flex-1 w-min overflow-hidden h-full px-0 sm:px-5 xl:px-10 min-h-screen">
				{props.children}
				<div class="block xl:hidden w-full">
					<InlangDocMeta
						manifest={props.manifest}
						contentInHtml={(props.children as HTMLElement).children}
						currentRoute={props.currentRoute}
					/>
				</div>
				<div
					class="fixed bottom-[24px] right-[24px] sm:hidden"
					onClick={() => setDrawerIsOpen(true)}
				>
					<div class="flex justify-center items-center w-12 h-12 bg-background border border-surface-200 shadow rounded-full">
						<MenuIcon class="w-6 h-6" />
					</div>
				</div>
			</div>
			<div class="hidden xl:block sticky top-[164px] w-[230px] h-[calc(100vh_-_164px)]">
				<div class="w-full h-full overflow-y-scroll pb-8 pr-4">
					<InlangDocMeta
						manifest={props.manifest}
						contentInHtml={(props.children as HTMLElement).children}
						currentRoute={props.currentRoute}
					/>
				</div>
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
