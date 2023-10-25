import { Show, For, type JSXElement, type Accessor, createSignal } from "solid-js"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import ArrowDown from "~icons/material-symbols/expand-more"
import { setSearchParams } from "../install/helper/setSearchParams.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { isModule } from "@inlang/marketplace-registry"

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
										}&module=${props.modules?.join(",")}`
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

/* Deprecated */
export function SelectionWrapper(props: {
	select: Accessor<boolean>
	item: MarketplaceManifest & { uniqueID: string }
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
						(isModule(props.item)
							? "cursor-pointer " +
							  (props
									.selectedPackages()
									.some((pkg) => isModule(props.item) && pkg === (props.item as any)?.module)
									? "outline-4"
									: "outline-transparent hover:outline-4") +
							  (props.item.id.startsWith("plugin.") ? " outline-[#BF7CE4]" : " outline-[#06B6D4]")
							: "opacity-75 cursor-not-allowed")
					}
					onClick={(e) => {
						e.stopPropagation()

						if (isModule(props.item)) {
							const packageToRemove = (props.item as any)?.module
							const isSelected = props.selectedPackages().includes(packageToRemove)

							if (isSelected) {
								props.setSelectedPackages(
									props.selectedPackages().filter((item) => item !== packageToRemove)
								)
							} else {
								props.setSelectedPackages(
									removeDuplicates([...props.selectedPackages(), packageToRemove])
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

export function ScrollFloat(props: { packages: Accessor<string[]> }) {
	const [scroll, setScroll] = createSignal(0)

	window.addEventListener("scroll", () => {
		setScroll(window.scrollY)
	})

	return (
		<div
			class={
				"z-30 sticky left-1/2 -translate-x-[150px] bottom-8 w-[300px] my-16 opacity-0 transition-all " +
				(scroll() > 200 && props.packages().length > 0
					? "animate-slideIn opacity-100"
					: "animate-slideOut opacity-0")
			}
		>
			<div class="w-full flex justify-between items-center rounded-lg bg-inverted-surface shadow-xl p-1.5 pl-3 text-background text-xs gap-1.5 font-medium">
				{props.packages().length > 1 ? "You've choosen packages" : "You've choosen a package"}
				<sl-button
					prop:size="small"
					prop:target="_blank"
					class={"on-inverted"}
					prop:href={`/install?module=${props.packages()}`}
				>
					Install
				</sl-button>
			</div>
		</div>
	)
}
