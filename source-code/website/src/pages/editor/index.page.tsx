import type { PageHead } from "@src/renderer/types.js";
import { For } from "solid-js";
import { Layout as RootLayout } from "../Layout.jsx";
import { repositories } from "./repositories.js";
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward";

export const Head: PageHead = (props) => ({
	title: "inlang Editor",
	description:
		"Manage translations and localization processes with inlang's editor.",
});

export function Page() {
	return (
		<RootLayout>
			{/* START search bar */}

				

			{/* END search bar */}
			{/* START repository grid */}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 w-full auto-rows-min">
				<For each={repositories}>
					{(repository) => (
						<RepositoryCard repository={repository}></RepositoryCard>
					)}
				</For>
				<AddRepositoryCard></AddRepositoryCard>
			</div>
			{/* END repository grid */}
		</RootLayout>
	);
}

/**
 * A card that displays a repository.
 */
function RepositoryCard(props: { repository: typeof repositories[number] }) {
	const isExampleRepository = () =>
		props.repository.owner === "inlang" &&
		props.repository.repository === "example";

	return (
		<div
			class={`rounded border p-4 flex flex-col justify-between gap-6 ${
				isExampleRepository()
					? "border-primary bg-primary-container text-on-primary-container"
					: "border-outline"
			}`}
		>
			<div>
				<div class="flex items-center justify-between gap-2">
					<p class="font-medium">
						{props.repository.owner}/{props.repository.repository}
					</p>
					<img
						class="w-8 h-8 rounded-sm"
						src={`https://github.com/${props.repository.owner}.png?size=40`}
					></img>
				</div>
				<p class="pt-4">{props.repository.description}</p>
			</div>
			<a
				href={`/editor/github.com/${props.repository.owner}/${props.repository.repository}`}
			>
				<sl-button
					class="w-full"
					prop:variant={isExampleRepository() ? "primary" : undefined}
				>
					Open
				</sl-button>
			</a>
		</div>
	);
}

/**
 * Prompting the user to add their repository.
 */
function AddRepositoryCard() {
	return (
		<div
			class={`rounded border p-4 flex flex-col justify-between gap-6 border-outline text-on-secondary-container bg-secondary-container`}
		>
			{/* empty div to achieve justify-between effect whereas the p is centered */}
			<div></div>
			<p>You can add your repository to this list by opening a pull request.</p>
			<a
				href="https://github.com/inlang/inlang/tree/main/source-code/website/src/pages/editor/repositories.ts"
				target="_blank"
			>
				{/* @ts-ignore By accident, the button looks really cool without a variant in this case. */}
				<sl-button class="w-full" prop:variant="">
					Add your repository
					<MaterialSymbolsArrowOutward slot="suffix"></MaterialSymbolsArrowOutward>
				</sl-button>
			</a>
		</div>
	);
}
