import { For } from "solid-js"
import { Icon } from "@src/components/Icon.jsx"

const plugins = [
	{
		id: "inlang-plugin-json",
		icon: "https://avatars.githubusercontent.com/u/58117316?s=200&v=4",
		repository: "https://github.com/samuelstroschein/inlang-plugin-json",
		keywords: ["json", "i18next", "svelte-intl-precompile"],
	},
	{
		id: "plugin-i18next",
		icon: "https://avatars.githubusercontent.com/u/58117316?s=200&v=4",
		repository: "https://github.com/samuelstroschein/inlang-plugin-json",
		keywords: ["json", "i18next", "svelte-intl-precompile"],
	},
	{
		id: "inlang-lint",
		icon: "https://avatars.githubusercontent.com/u/58117316?s=200&v=4",
		repository: "https://github.com/samuelstroschein/inlang-plugin-json",
		keywords: ["json", "i18next", "svelte-intl-precompile"],
	},
]

export const Registry = () => {
	console.log(plugins)
	return (
		<div>
			<div>Search</div>
			<div class="grid grid-cols-2 flex-col gap-4 ">
				<For each={plugins}>
					{(plugin) => {
						const user = plugin.repository.split("/")[3]
						return (
							<div class="relative">
								<div class="flex flex-col gap-4 bg-surface-100 hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
									<div class="flex items-center gap-4">
										<img class="w-8 h-8 rounded m-0" src={plugin.icon} />
										<p class="m-0 text-surface-900 font-semibold text-md">{plugin.id}</p>
									</div>
									<div class="flex gap-2 items-center pt-4">
										<img
											class="w-6 h-6 rounded-full m-0"
											src={"https://github.com/" + user + ".png"}
										/>
										<p class="m-0 text-surface-600">{user}</p>
									</div>
								</div>
								<div class="absolute top-0 right-0 -translate-x-4 translate-y-4">
									<Icon name={"external"} class="h-6 w-6 text-info/50" />
								</div>
							</div>
						)
					}}
				</For>
			</div>
		</div>
	)
}
