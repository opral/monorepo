import { query } from "@inlang/core/query";
import { createMemo, For, Match, Switch } from "solid-js";
import { Messages } from "./Messages.jsx";
import {
	resources,
	inlangConfig,
	repositoryIsCloned,
	routeParams,
} from "./state.js";
import { Layout as EditorLayout } from "./Layout.jsx";
import type * as ast from "@inlang/core/ast";
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";
import { Meta, Title } from "@solidjs/meta";

export function Page() {
	/**
	 * Messages for a particular message id in all languages
	 *
	 * @example
	 * 	{
	 *    "hello.welcome": {
	 *      "en": { ... },
	 *      "de": { ... },
	 *    }
	 *  }
	 */
	const messages = createMemo(() => {
		const result: {
			[id: string]: {
				[language: string]: ast.Message | undefined;
			};
		} = {};
		for (const resource of resources) {
			for (const id of query(resource).includedMessageIds()) {
				// defining the initial object, otherwise the following assignment will fail
				// with "cannot set property 'x' of undefined"
				if (result[id] === undefined) {
					result[id] = {};
				}
				// assigning the message
				result[id][resource.languageTag.language] = query(resource).get({ id });
			}
		}
		return result;
	});

	return (
		<>
			<Title>
				{routeParams().owner}/{routeParams().repository}
			</Title>
			<Meta
				name="description"
				content={`Contribute translations to ${
					routeParams().repository
				} via inlangs editor.`}
			></Meta>
			<EditorLayout>
				<Switch
					fallback={
						<p class="text-danger">
							Switch fallback. This is likely an error. Please report it with
							code e329jafs.
						</p>
					}
				>
					<Match when={repositoryIsCloned.error?.message.includes("404")}>
						<RepositoryDoesNotExistOrNotAuthorizedCard></RepositoryDoesNotExistOrNotAuthorizedCard>
					</Match>
					<Match when={repositoryIsCloned.error}>
						<p class="text-danger">{repositoryIsCloned.error.message}</p>
					</Match>
					<Match when={inlangConfig.error}>
						<p class="text-danger">
							An error occured while initializing the config:{" "}
							{inlangConfig.error.message}
						</p>
					</Match>
					<Match when={repositoryIsCloned.loading || inlangConfig.loading}>
						<div class="flex flex-col grow justify-center items-center min-w-full gap-2">
							{/* sl-spinner need a own div otherwise the spinner has a bug. The wheel is rendered on the outer div  */}
							<div>
								{/* use font-size to change the spinner size    */}
								<sl-spinner class="text-4xl"></sl-spinner>
							</div>

							<p class="text-lg">
								cloning repositories can take a few minutes...
							</p>
						</div>
					</Match>
					<Match when={inlangConfig() === undefined}>
						<NoInlangConfigFoundCard></NoInlangConfigFoundCard>
					</Match>
					<Match when={inlangConfig()}>
						<div class="space-y-2">
							<For each={Object.keys(messages())}>
								{(id) => <Messages messages={messages()[id]}></Messages>}
							</For>
						</div>
					</Match>
				</Switch>
			</EditorLayout>
		</>
	);
}

function NoInlangConfigFoundCard() {
	return (
		<div class="flex grow items-center justify-center">
			<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
				<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center"></MaterialSymbolsUnknownDocumentOutlineRounded>
				<h1 class="font-semibold pt-5">
					The{" "}
					<code class="bg-secondary-container py-1 px-1.5 rounded text-on-secondary-container">
						inlang.config.js
					</code>{" "}
					file has not been found.
				</h1>
				<p class="pt-1.5">
					Make sure that the inlang.config.js file exists at the root of the
					repository, see discussion{" "}
					<a
						href="https://github.com/inlang/inlang/discussions/258"
						target="_blank"
						class="link link-primary"
					>
						#258
					</a>
					.
				</p>
				<a
					class="self-end pt-5"
					href="https://inlang.com/documentation/getting-started"
					target="_blank"
				>
					<sl-button prop:variant="text">
						I need help with getting started
						<MaterialSymbolsArrowOutwardRounded slot="suffix"></MaterialSymbolsArrowOutwardRounded>
					</sl-button>
				</a>
			</div>
		</div>
	);
}

function RepositoryDoesNotExistOrNotAuthorizedCard() {
	return (
		<div class="flex grow items-center justify-center">
			<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
				<h1 class="self-center text-5xl font-light">404</h1>
				<h2 class="font-semibold pt-5">The repository has not been found.</h2>
				<p class="pt-1.5">
					Make sure that you the repository owner{" "}
					<code class="bg-secondary-container py-1 px-1.5 rounded text-on-secondary-container">
						{routeParams().owner}
					</code>{" "}
					and the repository name{" "}
					<code class="bg-secondary-container py-1 px-1.5 rounded text-on-secondary-container">
						{routeParams().repository}
					</code>{" "}
					contain no mistake.
					<span class="pt-2 block">
						Alternatively, you might not have access to the repository.
					</span>
				</p>
				<a
					class="self-end pt-5"
					href="https://github.com/inlang/inlang/discussions/categories/help-questions-answers"
					target="_blank"
				>
					<sl-button prop:variant="text">
						I need help
						<MaterialSymbolsArrowOutwardRounded slot="suffix"></MaterialSymbolsArrowOutwardRounded>
					</sl-button>
				</a>
			</div>
		</div>
	);
}
