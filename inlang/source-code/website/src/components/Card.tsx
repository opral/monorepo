import { Show } from "solid-js"
import { Chip } from "./Chip.jsx"
import { colorForTypeOf, typeOfIdToTitle } from "./sections/marketplace/utilities.js"
import Plus from "~icons/material-symbols/add-rounded"

export default function Card(props: { item: any; displayName: string; highlight?: boolean }) {
	return (
		<>
			<a
				href={`/m/${props.item.id}`}
				class={
					"relative no-underline flex gap-4 flex-col justify-between group w-full bg-background hover:bg-surface-50 transition-colors border border-surface-200 rounded-xl p-5 " +
					(props.highlight ? "h-96" : "h-60")
				}
			>
				<Show when={props.highlight && props.item.gallery}>
					<img class="h-64 object-cover object-top rounded-lg" src={props.item.gallery[0]} />
				</Show>
				<div class="flex flex-col gap-4">
					<div class="w-full flex gap-4 items-start">
						<div class="flex items-center gap-8 flex-shrink-0">
							<img class="w-10 h-10 rounded-lg m-0" src={props.item.icon} />
						</div>
						<div class="flex flex-col justify-between gap-0.5 items-start">
							<p class="m-0 mb-2 text-lg text-surface-600 leading-none no-underline font-semibold group-hover:text-surface-900 transition-colors">
								{props.displayName}
							</p>
							<Chip
								text={typeOfIdToTitle(props.item.id)}
								color={colorForTypeOf(props.item.id)}
								customClasses="text-xs"
							/>
						</div>
					</div>
					<Show when={!props.highlight}>
						<p class="line-clamp-2 text-surface-500 transition-colors group-hover:text-surface-600">
							{props.item.description.en}
						</p>
					</Show>
				</div>
				<Show when={!props.highlight}>
					<div>
						<p class="m-0 mb-2 text-surface-400 group-hover:text-surface-500 transition-colors leading-none no-underline text-sm">
							{props.item.publisherName}
						</p>
					</div>
				</Show>
				<Show
					when={
						props.item.id.split(".")[0] === "plugin" ||
						props.item.id.split(".")[0] === "messageLintRule"
					}
				>
					<sl-tooltip prop:content={`Install ${props.displayName}`}>
						<a
							onClick={(e) => {
								e.stopPropagation()
							}}
							href={`/install?module=${props.item.id}`}
							class="absolute top-5 right-5 flex-shrink-0 rounded-full p-2 w-8 h-8 flex items-center justify-center text-background hover:text-background hover:bg-surface-700 bg-surface-900 transition-all"
						>
							<svg
								width="100%"
								height="100%"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M11.6 5.54982L11.6 5.5498L8.99999 8.14981L11.6 5.54982ZM8.69999 8.87407L11.5962 5.97782L12.5794 6.99612L7.99999 11.5755L3.42056 6.99612L4.40374 5.97782L7.29999 8.87407V0.299805H8.69999V8.87407ZM14.3 14.2998V11.2998H15.7V13.9998C15.7 14.4696 15.5362 14.8643 15.2004 15.2002C14.8645 15.536 14.4698 15.6998 14 15.6998H1.99999C1.53019 15.6998 1.13547 15.536 0.79962 15.2002C0.463765 14.8643 0.299988 14.4696 0.299988 13.9998V11.2998H1.69999V14.2998H14.3Z"
									fill="currentColor"
								/>
							</svg>
						</a>
					</sl-tooltip>
				</Show>
			</a>
		</>
	)
}

export function CardBuildOwn() {
	return (
		<>
			<a
				href="/documentation/publish-marketplace"
				class="relative no-underline h-60 flex flex-col justify-center pt-8 items-center gap-4 group w-full bg-background hover:bg-surface-50 transition-colors border border-surface-200 rounded-xl p-5"
			>
				<Plus class="w-12 h-12 text-surface-600 group-hover:text-surface-900 transition-colors" />
				<div class="flex flex-col justify-center items-center">
					<p class="m-0 mb-2 text-surface-600 leading-none no-underline text-center font-semibold group-hover:text-surface-900 transition-colors">
						Can't find what you are looking for?
					</p>
					<p class="line-clamp-3 text-surface-500 transition-colors text-center group-hover:text-surface-600">
						Build your own solution!
					</p>
				</div>
			</a>
		</>
	)
}
