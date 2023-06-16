import { For } from "solid-js"
import { repositories } from "./repositories.js"
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward"

export function CommunityProjects() {
	return (
		<div class="pb-16">
			{/* START repository grid */}
			<div class="w-full flex justify-between items-center pb-6">
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
function RepositoryCard(props: { repository: (typeof repositories)[number] }) {
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
					{props.repository.description}
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
