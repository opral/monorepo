import Link from "#src/renderer/Link.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import { For, type JSX } from "solid-js";

const SubcategoryPills = (props: {
	links: { name: string; param: string; icon?: JSX.Element }[];
}) => {
	return (
		<nav class="flex gap-[5px]">
			<For each={props.links}>
				{(link) => (
					<Link href={"/c/apps/?q=" + link.param}>
						<div
							class={
								(JSON.stringify(currentPageContext.urlParsed.search).includes(
									link.param
								)
									? "bg-primary text-background border border-primary "
									: "bg-background text-surface-600 border border-surface-200 hover:shadow-lg hover:shadow-surface-100 hover:border-surface-300 active:border-surface-400") +
								" px-3 py-[6px] font-medium cursor-pointer rounded-lg flex items-center gap-1 transition-all"
							}
						>
							{link.icon}
							{link.name}
						</div>
					</Link>
				)}
			</For>
		</nav>
	);
};

export default SubcategoryPills;
