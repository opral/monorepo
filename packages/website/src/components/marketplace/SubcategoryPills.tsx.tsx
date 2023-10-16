import { For } from "solid-js"

const SubcategoryPills = (props: { links: { name: string; param: string }[] }) => {
	return (
		<nav class="flex gap-[5px]">
			<For each={props.links}>
				{(link) => (
					<a
						href={
							window.location.origin + "//" + window.location.pathname + "/?search=" + link.param
						}
					>
						<div
							class={
								(window.location.search.includes(link.param)
									? "bg-primary text-background "
									: "bg-background text-surface-600 border border-surface-200 hover:border-surface-400") +
								" px-3 py-[6px] font-medium cursor-pointer rounded-lg"
							}
						>
							{link.name}
						</div>
					</a>
				)}
			</For>
		</nav>
	)
}

export default SubcategoryPills
