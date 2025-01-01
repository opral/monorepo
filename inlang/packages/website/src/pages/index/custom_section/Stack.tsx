import {
	IconFlutter,
	IconJavascript,
	IconNextjs,
	IconReact,
	IconSvelte,
	IconSolid,
	IconVue,
	IconAstro,
} from "#src/interface/custom-icons/subcategoryIcon.jsx";
import Link from "#src/renderer/Link.jsx";
import { currentPageContext } from "#src/renderer/state.js";
import { For } from "solid-js";
import * as m from "#src/paraglide/messages.js";

const Stack = () => {
	const getSubCategories: boolean | any[] | null | undefined = [
		{
			name: "Svelte",
			param: "svelte",
			icon: <IconSvelte class="-ml-1 w-8 h-8" />,
		},
		{
			name: "Solid",
			param: "solid",
			icon: <IconSolid class="-ml-1 w-8 h-8" />,
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
			name: "Astro",
			param: "astro",
			icon: <IconAstro class="-ml-1 w-8 h-8" />,
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
	];
	return (
		<div class="w-full flex gap-4 mb-28 mt-10 flex-col-reverse md:flex-row">
			<div class="w-full">
				<h2 class="pb-4 text-surface-900 font-semibold text-2xl leading-snug tracking-tight">
					{m.home_stack_title()}
				</h2>
				<div class="flex gap-2 overflow-x-scroll hide-scrollbar">
					<For each={getSubCategories}>
						{(link) => (
							<Link href={"/c/" + link.param} class="flex-grow">
								<div
									class={
										(currentPageContext.urlParsed.searchOriginal?.includes(
											link.param
										)
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
	);
};

export default Stack;
