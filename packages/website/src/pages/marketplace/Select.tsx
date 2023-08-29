import { Show, For, JSXElement } from "solid-js"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import ArrowDown from "~icons/material-symbols/expand-more"
import { setSearchParams } from "../install/helper/setSearchParams.js"
import type { MarketplaceItem } from "@inlang/marketplace"

/**
 * This file provides helper Components for the marketplace pages.
 */

export function SelectRepo(props: { size: "small" | "medium"; modules: any[] }) {
	const [store] = useLocalStorage()

	return (
		<Show when={store.recentProjects.length > 0}>
			<sl-dropdown>
				<sl-button
					prop:size={props.size}
					slot="trigger"
					prop:variant="text"
					onClick={(e) => {
						e.stopPropagation()
					}}
					style={{
						width: "20px",
					}}
				>
					<button class="text-background hover:text-background/20 w-4" slot="suffix">
						<ArrowDown />
					</button>
				</sl-button>
				<sl-menu>
					<For each={store.recentProjects}>
						{(project) => (
							<sl-menu-item
								onClick={(e) => {
									e.stopPropagation()
									setSearchParams(
										`/install?repo=github.com/${project.owner}/${
											project.repository
										}&module=${props.modules?.join(",")}`,
									)
								}}
							>
								{project.repository}
							</sl-menu-item>
						)}
					</For>
				</sl-menu>
			</sl-dropdown>
		</Show>
	)
}

export function SelectionWrapper(props: {
	select: boolean
	item: MarketplaceItem
	selectedItems: MarketplaceItem[]
	children: JSXElement
}) {
	return (
		<>
			{props.select ? (
				<div
					class="cursor-pointer outline outline-0 outline-primary hover:outline-2 transition-all duration-75 rounded-xl h-64"
					onClick={(e) => {
						e.stopPropagation()
						props.selectedItems.push(props.item)
					}}
				>
					<div class="pointer-events-none h-full">{props.children}</div>
				</div>
			) : (
				props.children
			)}
		</>
	)
}
