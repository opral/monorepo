import {
	IconFlutter,
	IconJavascript,
	IconNextjs,
	IconReact,
	IconSvelte,
	IconVue,
} from "#src/interface/custom-icons/subcategoryIcon.jsx"
import Link from "#src/renderer/Link.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import { For } from "solid-js"
import * as m from "@inlang/paraglide-js/inlang-marketplace/messages"

const Stack = () => {
	const getSubCategies: boolean | any[] | null | undefined = [
		{
			name: "Svelte",
			param: "svelte",
			icon: <IconSvelte class="-ml-1 w-8 h-8" />,
		},
		{
			name: "React",
			param: "react",
			icon: <IconReact class="-ml-1 w-8 h-8" />,
		},
		{
			name: "Next.js",
			param: "nextjs",
			icon: <IconNextjs class="-ml-1 w-8 h-8" />,
		},
		{
			name: "Vue",
			param: "vue",
			icon: <IconVue class="-ml-1 w-8 h-8" />,
		},
		{
			name: "Javascript",
			param: "javascript",
			icon: <IconJavascript class="-ml-1 w-8 h-8" />,
		},
		{
			name: "Flutter",
			param: "flutter",
			icon: <IconFlutter class="-ml-1 w-8 h-8" />,
		},
	]
	return (
		<div class="w-full flex gap-4 mt-4 md:mt-10 mb-10 flex-col-reverse md:flex-row">
			<div class="w-full">
				<p class="pb-2 text-surface-500 text-sm">{m.home_stack_title()}</p>
				<div class="flex gap-2 overflow-x-scroll hide-scrollbar">
					<For each={getSubCategies}>
						{(link) => (
							<Link href={"/search/?q=" + link.param} class="flex-grow">
								<div
									class={
										(currentPageContext.urlParsed.searchOriginal?.includes(link.param)
											? "bg-primary text-background "
											: "bg-background text-surface-600 border border-surface-200 hover:shadow-lg hover:shadow-surface-100 hover:border-surface-300 active:border-surface-400") +
										" px-6 py-3 flex-grow font-medium cursor-pointer rounded-lg flex items-center gap-2 transition-all"
									}
								>
									{link.icon}
									{link.name}
								</div>
							</Link>
						)}
					</For>
				</div>
			</div>
		</div>
	)
}

export default Stack
