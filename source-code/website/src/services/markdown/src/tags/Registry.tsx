import { Accessor, For, Show, createEffect, createSignal, onMount } from "solid-js"
import { Icon } from "@src/components/Icon.jsx"
import { plugins, InlangPluginManifest } from "@inlang/plugin-registry"
import { SearchIcon } from "@src/pages/editor/@host/@owner/@repository/components/SearchInput.jsx"

export const Registry = () => {
	const [textValue, setTextValue] = createSignal<string>("")
	const [filteredPlugins, setFilteredPlugins] = createSignal<InlangPluginManifest[]>(plugins)

	createEffect(() => {
		const filteredPlugins = plugins.filter((plugin) => {
			const isKeyWordMatching: boolean = plugin.keywords.some((keyword) =>
				keyword.includes(textValue()),
			)
			return plugin.id.includes(textValue()) || isKeyWordMatching
		})
		setFilteredPlugins(filteredPlugins)
	})

	return (
		<div class="flex flex-col gap-4 pt-4">
			<Search
				placeholder={"Search for plugins, SDKs, frameworks, languages ..."}
				textValue={textValue}
				setTextValue={setTextValue}
			/>
			<div class="grid grid-cols-1 md:grid-cols-2 flex-col gap-4 ">
				<For each={filteredPlugins()}>
					{(plugin) => {
						const user = plugin.repository.split("/")[3]
						return (
							<a href={plugin.repository} target="_blanc" class="relative no-underline">
								<div class="flex flex-col gap-4 bg-surface-100 hover:bg-surface-200 p-6 rounded-xl border border-surface-2 cursor-pointer">
									<div class="flex items-center gap-4">
										<img class="w-10 h-10 rounded-md m-0 shadow-lg" src={plugin.icon} />
										<p class="m-0 text-surface-900 font-semibold text-md">{plugin.id}</p>
									</div>
									<Description repository={plugin.repository} />
									<div class="flex gap-2 items-center pt-6">
										<img
											class="w-6 h-6 rounded-full m-0"
											src={"https://github.com/" + user + ".png"}
										/>
										<p class="m-0 text-surface-600 no-underline hover:text-surface-900">{user}</p>
									</div>
								</div>
								<div class="absolute top-0 right-0 -translate-x-4 translate-y-4">
									<Icon name={"external"} class="h-6 w-6 text-info/50" />
								</div>
							</a>
						)
					}}
				</For>
			</div>
		</div>
	)
}

interface SearchInputProps {
	placeholder: string
	textValue: Accessor<string>
	setTextValue: (value: string) => void
}

const Search = (props: SearchInputProps) => {
	return (
		<div>
			<sl-input
				style={{
					padding: "0px",
					border: "none",
					"--tw-ring-color": "#06B6D4",
					"border-radius": "4px",
				}}
				prop:placeholder={props.placeholder}
				prop:size={"medium"}
				prop:value={props.textValue()}
				onInput={(e) => props.setTextValue(e.currentTarget.value)}
			>
				<div slot={"suffix"}>
					<SearchIcon />
				</div>
			</sl-input>
		</div>
	)
}

import { markdownToTxt } from "markdown-to-txt"

const Description = (props: { repository: string }) => {
	const [description, setDescription] = createSignal<undefined | string>(undefined)

	const fetchReadMeFromRepoURL = async function (repository: string) {
		await fetchDataFromRepo(repository).then((data) => {
			if (data) {
				const pattern = /(?<=\n\n|^)(?![###|####])((?!\n\n).)+/g
				const paragraphs = data.match(pattern)
				if (paragraphs?.length !== 0 && paragraphs !== null) {
					const REGEX_STARTS_WITH_CHARACTER = /^\w+/

					const description = markdownToTxt(
						(paragraphs.find((p) => REGEX_STARTS_WITH_CHARACTER.test(p)) || "").replace(
							/\.\\/g,
							".",
						),
					)

					setDescription(description.length < 80 ? description : description.slice(0, 80) + "...")
				}
			}
		})
	}

	onMount(() => fetchReadMeFromRepoURL(getRawUrl(props.repository, "README.md")))

	return (
		<div class="h-8">
			<Show fallback={"Repository description..."} when={description()}>
				<div class="m-0 font-normal leading-6 text-sm tracking-wide text-surface-500">
					{description()}
				</div>
			</Show>
		</div>
	)
}

const fetchDataFromRepo = async (url: string) => {
	let _data: string | undefined
	await fetch(url)
		.then((response) => {
			return response.text()
		})
		.then((data) => {
			_data = data
		})
		.catch((err) => {
			console.warn("Could not fetch url: " + url, err)
		})
	return _data
}

const getRawUrl = (repository: string, filepath: string) => {
	if (repository.includes("/tree/main/")) {
		//in monorepo
		return (
			repository.replace("github.com", "raw.githubusercontent.com").replace("/tree", "") + filepath
		)
	} else {
		//own repo
		return (
			repository.replace("github.com", "raw.githubusercontent.com").replace("/tree", "") +
			"/main/" +
			filepath
		)
	}
}
