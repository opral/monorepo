import { Show } from "solid-js";
import type { SemanticColorTokens } from "../../../tailwind.config.cjs";
import { Icon } from "../components/Icon.jsx";

/**
 * Inline notifications show up in task flows, to notify users of the status of an action.
 *
 * Read more https://carbondesignsystem.com/components/notification/usage#inline-notifications
 */
export function InlineNotification(props: {
	title?: string;
	message?: string;
	variant: SemanticColorTokens[number];
}) {
	return (
		<div
			class={`flex rounded gap-2 items-center px-4 py-2 bg-surface-variant text-on-surface border-l-4 border-l-${props.variant}`}
		>
			<Icon name={props.variant} class={`text-${props.variant} mr-1`} />
			<div class="flex gap-1.5">
				<h3 class="font-medium">{props.title}</h3>
				<Show when={props.message}>
					<p>{props.message}</p>
				</Show>
			</div>
		</div>
	);
}
