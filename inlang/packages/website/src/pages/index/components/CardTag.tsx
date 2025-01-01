import { Show } from "solid-js";

export const CardTag = (props: { text: string; globalPrefix?: boolean }) => {
	return (
		<div class="z-30 absolute bottom-4 left-4">
			<div class="flex gap-1 font-semibold bg-surface-700 text-md text-background w-fit px-5 py-2 rounded-full">
				<Show when={props.globalPrefix}>
					<p class="font-light">Global</p>
				</Show>
				<p>{props.text}</p>
			</div>
		</div>
	);
};
