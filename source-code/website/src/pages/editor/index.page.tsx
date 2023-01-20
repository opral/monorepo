import { createSignal, For, Show } from "solid-js";
import { Layout as RootLayout } from "../Layout.jsx";
import { repositories } from "./repositories.js";
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward";
import { navigate } from "vite-plugin-ssr/client/router";
import { z } from "zod";
import { Meta, Title } from "@solidjs/meta";

export function Page() {
	/** is not reactive because window is not reactive */
	const isMobile = () => window.screen.width < 640;
	const [input, setInput] = createSignal("");
	const isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github/)
			.safeParse(input()).success;

	function navigateToEditor() {
		const url = new URL(input());
		return navigate(`/editor/${url.host}${url.pathname}`);
	}

	return (
		<>
			<Title>inlang Editor</Title>
			<Meta
				name="description"
				content="Contribute to open source projects and manage translations with inlang's editor."
			></Meta>
			<RootLayout>
				{/* START search bar */}
				<div class="h-64 sm:h-96 pt-4 flex flex-col items-center justify-center">
					{/* using a column to ease responsive design (mobile would be tricky othersie) */}
					<div class="flex flex-col gap-4 justify-center items-center w-full">
						<sl-input
							class="border-none p-0 w-full max-w-xl"
							prop:size={isMobile() ? "medium" : "large"}
							prop:placeholder="Paste a link of a repository on GitHub"
							// when pressing enter
							on:sl-change={() => (isValidUrl() ? navigateToEditor : undefined)}
							onInput={(event) => {
								// @ts-ignore
								setInput(event.target.value);
							}}
						>
							<Show when={input().length > 10 && isValidUrl() === false}>
								<p slot="help-text" class="text-danger p-2">
									The url must be a link to a GitHub repository like
									https://github.com/inlang/example
								</p>
							</Show>
						</sl-input>
						<div class="flex gap-2">
							{/* the button is on the left to resemble a google search */}
							<sl-button
								class="w-32"
								prop:variant={isValidUrl() ? "primary" : "default"}
								prop:size={isMobile() ? "small" : "medium"}
								prop:disabled={isValidUrl() === false}
								onClick={navigateToEditor}
							>
								Open
							</sl-button>
							<a href="/documentation/getting-started">
								<sl-button
									prop:variant="text"
									prop:size={isMobile() ? "small" : "medium"}
								>
									How to get started?
								</sl-button>
							</a>
						</div>
					</div>
				</div>
				{/* END search bar */}
				<hr class="w-full border-t border-outline"></hr>
				{/* START repository grid */}
				<h2 class="text-xl font-medium pt-6 pb-1">Community projects</h2>
				<p class="pb-2">
					Inlang is a great tool that helps communities translate their projects
					by easing contributions.
				</p>
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
		</>
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
			class={`rounded border p-4 flex flex-col justify-between gap-5 ${
				isExampleRepository()
					? "border-secondary bg-secondary-container text-on-secondary-container"
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
				<p class="pt-3">{props.repository.description}</p>
			</div>
			<a
				href={`/editor/github.com/${props.repository.owner}/${props.repository.repository}`}
			>
				<sl-button
					class="w-full"
					prop:variant={isExampleRepository() ? "neutral" : undefined}
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
			class={`rounded border p-4 flex flex-col justify-between gap-6 border-info text-on-info-container bg-info-container`}
		>
			{/* empty div to achieve justify-between effect whereas the p is centered */}
			<div></div>
			<p>Get more contributions by adding your repository to this list.</p>
			<a
				href="https://github.com/inlang/inlang/tree/main/source-code/website/src/pages/editor/repositories.ts"
				target="_blank"
			>
				{/* @ts-ignore By accident, the button looks really cool without a variant in this case. */}
				<sl-button class="w-full" prop:variant="">
					Add your community
					<MaterialSymbolsArrowOutward slot="suffix"></MaterialSymbolsArrowOutward>
				</sl-button>
			</a>
		</div>
	);
}
