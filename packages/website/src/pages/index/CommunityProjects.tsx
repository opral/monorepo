import { For, Show } from "solid-js"
import { repositories } from "./repositories.js"
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward"
import { useLocalStorage } from "@src/services/local-storage/index.js"

export function CommunityProjects() {
	const [store] = useLocalStorage()

	return (
		<div class="pb-16">
			{/* Recent projects */}
			<Show when={store?.recentProjects.length > 0}>
				<div class="w-full flex justify-between items-end pb-6">
					<h2 class="text-2xl font-medium text-slate-900">Recent projects</h2>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 w-full auto-rows-min pb-12">
					<For each={store.recentProjects}>
						{(recentProjects) => <RepositoryCard repository={recentProjects} />}
					</For>
				</div>
			</Show>
			{/* START repository grid */}
			<div class="w-full flex justify-between items-end pb-6">
				<div class="flex flex-col gap-2 grow">
					<h2 class="text-2xl font-medium text-slate-900">Projects that use inlang</h2>
					<p class="text-md font-regular text-outline-variant">
						Explore projects in the inlang community or contribute translations.
					</p>
				</div>
				<a
					href="https://github.com/inlang/inlang/tree/main/source-code/website/src/pages/index/repositories.ts"
					target="_blank"
				>
					<sl-button
						prop:variant="default"
						prop:size="medium"
						onClick={(event) => console.log(event)}
					>
						Add your repository
						<MaterialSymbolsArrowOutward slot="suffix" />
					</sl-button>
				</a>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 w-full auto-rows-min">
				<For each={repositories}>{(repository) => <RepositoryCard repository={repository} />}</For>
			</div>
			{/* END repository grid */}
		</div>
	)
}

/**
 * A card that displays a repository.
 */
export function RepositoryCard(props: {
	repository: {
		owner: string
		repository: string
		description: string
		lastOpened?: number
	}
}) {
	const getRelativeTime = (timestamp: number) => {
		console.log(timestamp)
		// Calculate the time difference
		const currentTime = new Date().getTime()
		const timeDifference = currentTime - timestamp

		// Create a new RelativeTimeFormat object for "en-US" locale
		const rtf = new Intl.RelativeTimeFormat("en-US")

		// Convert the time difference to relative time
		let relativeTime

		if (timeDifference < 60000) {
			// Less than 1 minute
			relativeTime = "just now"
		} else if (timeDifference < 3600000) {
			// Less than 1 hour
			relativeTime = rtf.format(-Math.floor(timeDifference / (1000 * 60)), "minute")
		} else if (timeDifference < 86400000) {
			// Less than 1 day
			relativeTime = rtf.format(-Math.floor(timeDifference / (1000 * 60 * 60)), "hour")
		} else if (timeDifference < 2592000000) {
			// Less than 1 month
			relativeTime = rtf.format(-Math.floor(timeDifference / (1000 * 60 * 60 * 24)), "day")
		} else if (timeDifference < 31536000000) {
			// Less than 1 year
			relativeTime = rtf.format(-Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 30)), "month")
		} else {
			// At least 1 year or more
			relativeTime = rtf.format(-Math.floor(timeDifference / (1000 * 60 * 60 * 24 * 365)), "year")
		}
		return relativeTime
	}

	return (
		<a
			href={`/editor/github.com/${props.repository.owner}/${props.repository.repository}`}
			class="rounded-xl bg-surface-100 hover:bg-surface-200 border border-surface-2 p-6 flex flex-col justify-between gap-5"
		>
			<div>
				<div class="flex flex-col">
					<img
						class="w-10 h-10 rounded-md m-0 shadow-lg"
						src={`https://github.com/${props.repository.owner}.png?size=40`}
					/>
					<p class="m-0 text-surface-900 font-semibold text-lg break-all pt-4">
						{props.repository.owner}
					</p>
					<p class="m-0 text-surface-500 font-normal text-sm break-all leading-6 tracking-wide">
						{props.repository.repository}
					</p>
				</div>
				{/* break all in case the repository name is too long */}
				<p class="pt-6 font-normal leading-6 text-ellipsis w-full h-[72px] overflow-hidden text-sm tracking-wide text-surface-500">
					{props.repository.lastOpened
						? getRelativeTime(props.repository.lastOpened)
						: props.repository.description}
				</p>
			</div>
		</a>
	)
}

// /**
//  * Prompting the user to add their repository.
//  */
// function AddRepositoryCard() {
// 	return (
// 		<div
// 			class={`rounded border p-4 flex flex-col justify-between gap-6 border-secondary bg-secondary-container text-on-secondary-container`}
// 		>
// 			{/* empty div to achieve justify-between effect whereas the p is centered */}
// 			<div />
// 			<p>Get contributions for your project.</p>
// 			<a
// 				href="https://github.com/inlang/inlang/tree/main/source-code/website/src/pages/index/repositories.ts"
// 				target="_blank"
// 			>
// 				{/* @ts-ignore By accident, the button looks really cool without a variant in this case. */}
// 				<sl-button class="w-full" prop:variant="neutral">
// 					Add your repository
// 					<MaterialSymbolsArrowOutward slot="suffix" />
// 				</sl-button>
// 			</a>
// 		</div>
// 	)
// }
