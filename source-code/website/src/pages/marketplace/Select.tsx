import { Show, For, JSXElement, Accessor } from "solid-js"
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
	select: Accessor<boolean>
	item: MarketplaceItem
	selectedModules: Accessor<string[]>
	setSelectedModules: (items: string[]) => void
	children: JSXElement
}) {
	return (
		<>
			{props.select() ? (
				<div
					class={
						"outline outline-0 transition-all duration-75 rounded-xl h-64 " +
						(props.item.type !== "app"
							? "cursor-pointer " +
							  (props
									.selectedModules()
									.some((module) => props.item.type !== "app" && module === props.item.module)
									? "outline-4"
									: "outline-transparent hover:outline-4") +
							  (props.item.type === "plugin" ? " outline-[#BF7CE4]" : " outline-[#06B6D4]")
							: "opacity-75 cursor-not-allowed")
					}
					onClick={(e) => {
						e.stopPropagation()

						if (props.item.type !== "app") {
							if (props.selectedModules().length > 0) {
								for (const module of props.selectedModules()) {
									if (props.item.module === module) {
										props.setSelectedModules(
											props.selectedModules().filter((item) => item !== module),
										)
									} else {
										props.setSelectedModules([...props.selectedModules(), props.item.module])
									}
								}
							} else {
								props.setSelectedModules([...props.selectedModules(), props.item.module])
							}
						}
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
