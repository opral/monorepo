import { Show } from "solid-js"
import Arrow from "~icons/material-symbols/chevron-right"

export const CardTag = (props: { text: string; globalPrefix?: boolean }) => {
	return (
		<div class="text-surface-50 flex gap-1 group-hover:pl-6 transition-all px-3 py-1.5 text-xs items-center bg-surface-400/50 rounded-full backdrop-blur-md font-medium absolute z-20 bottom-6 left-8">
			<Arrow class="opacity-0 left-2 absolute group-hover:opacity-100 transition-all w-4 h-4" />
			<Show when={props.globalPrefix}>
				<p class="font-light">Global</p>
			</Show>
			<p>{props.text}</p>
		</div>
	)
}
