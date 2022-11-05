import { currentPageContext } from "@src/renderer/state.js";
import type { PageHead } from "@src/renderer/types.js";
import { createSignal, Match, onMount, Switch } from "solid-js";
import { clone } from "../state.js";

export const Head: PageHead = () => {
	return {
		title: "Editor",
		description: "Editor",
	};
};

export function Page() {
	return (
		<Switch fallback={<p>switch fallback trigerred. something went wrong</p>}>
			<Match when={clone.loading}>
				<p>loading repository ...</p>
			</Match>
			<Match when={clone.error}>
				<p>error loading repository</p>
				<p>{clone.error}</p>
			</Match>
			<Match when={clone()}>
				<p>cloning complete</p>
			</Match>
		</Switch>
	);
}
