import { Show, For, JSXElement, Accessor } from "solid-js"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import ArrowDown from "~icons/material-symbols/expand-more"
import { setSearchParams } from "../install/helper/setSearchParams.js"
import type { MarketplaceItem } from "@inlang/marketplace"

/**
 * This file provides helper Components for the marketplace pages.
 */

export function SelectRepo(props: { size: "small" | "medium"; packages: any[] }) {
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
										}&package=${props.packages?.join(",")}`,
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
	selectedPackages: Accessor<string[]>
	setSelectedPackages: (items: string[]) => void
	children: JSXElement
}) {
	function removeDuplicates(array: string[]) {
		return array.filter((item, index) => array.indexOf(item) === index)
	}

	return (
		<>
			{props.select() ? (
				<div
					class={
						"outline outline-0 transition-all duration-75 rounded-xl h-64 " +
						(props.item.type !== "app"
							? "cursor-pointer " +
							  (props
									.selectedPackages()
									.some((pkg) => props.item.type !== "app" && pkg === props.item.package)
									? "outline-4"
									: "outline-transparent hover:outline-4") +
							  (props.item.type === "plugin" ? " outline-[#BF7CE4]" : " outline-[#06B6D4]")
							: "opacity-75 cursor-not-allowed")
					}
					onClick={(e) => {
						e.stopPropagation()

						if (props.item.type !== "app") {
							const packageToRemove = props.item.package
							const isSelected = props.selectedPackages().includes(packageToRemove)

							if (isSelected) {
								props.setSelectedPackages(
									props.selectedPackages().filter((item) => item !== packageToRemove),
								)
							} else {
								props.setSelectedPackages(
									removeDuplicates([...props.selectedPackages(), packageToRemove]),
								)
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
