import { currentPageContext } from "#src/renderer/state.js"
import { For, type JSX } from "solid-js"

const SubcategoryPills = (props: {
	links: { name: string; param: string; icon?: JSX.Element }[]
}) => {
	return (
		<nav class="flex gap-[5px]">
			<For each={props.links}>
				{(link) => (
					<a
						href={
							currentPageContext.urlParsed.origin +
							"//" +
							currentPageContext.urlParsed.pathname +
							"/?search=" +
							link.param
						}
					>
						<div
							class={
								(JSON.stringify(currentPageContext.urlParsed.search).includes(link.param)
									? "bg-primary text-background "
									: "bg-background text-surface-600 border border-surface-200 hover:border-surface-400") +
								" px-3 py-[6px] font-medium cursor-pointer rounded-lg flex items-center gap-1"
							}
						>
							{link.icon}
							{link.name}
						</div>
					</a>
				)}
			</For>
		</nav>
	)
}

export default SubcategoryPills
