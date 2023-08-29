import { Show, For } from "solid-js"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import ArrowDown from "~icons/material-symbols/expand-more"
import { setSearchParams } from "../install/helper/setSearchParams.js"

export function SelectRepo(props: { size: "small" | "medium"; modules: any[] }) {
	const [store] = useLocalStorage()
	// const [selectedRepo, setSelectedRepo] = createSignal<Repository | undefined>(undefined)

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
