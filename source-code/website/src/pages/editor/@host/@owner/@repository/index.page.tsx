import { query } from "@inlang/core/query"
import { createMemo, For, Match, Switch } from "solid-js"
import { Messages } from "./Messages.jsx"
import { Layout as EditorLayout } from "./Layout.jsx"
import type * as ast from "@inlang/core/ast"
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded"
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded"
import { Meta, Title } from "@solidjs/meta"
import { EditorStateProvider, useEditorState } from "./State.jsx"
import NoMatchPlaceholder from "./components/NoMatchPlaceholder.jsx"
import type { Language } from "@inlang/core/ast"

export function Page() {
	return (
		<EditorStateProvider>
			<EditorLayout>
				<TheActualPage />
			</EditorLayout>
		</EditorStateProvider>
	)
}

/**
 * The actual page that contains markup.
 *
 * This is separated from the Page component because the EditorStateProvider
 * is required to use the useEditorState hook.
 */
function TheActualPage() {
	const { inlangConfig, resources, routeParams, repositoryIsCloned, doesInlangConfigExist } =
		useEditorState()
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
				[language: Language]: ast.Message | undefined
			}
		} = {}
		for (const resource of resources) {
			for (const id of query(resource).includedMessageIds()) {
				// defining the initial object, otherwise the following assignment will fail
				// with "cannot set property 'x' of undefined"
				if (result[id] === undefined) {
					result[id] = {}
				}
				// assigning the message
				result[id][resource.languageTag.name] = query(resource).get({ id })
			}
		}
		return result
	})

	return (
		<>
			<Title>
				{routeParams().owner}/{routeParams().repository}
			</Title>
			<Meta
				name="description"
				content={`Contribute translations to ${routeParams().repository} via inlangs editor.`}
			/>
			<Switch
				fallback={
					<p class="text-danger">
						Switch fallback. This is likely an error. Please report it with code e329jafs.
					</p>
				}
			>
				<Match when={repositoryIsCloned.error?.message.includes("404")}>
					<RepositoryDoesNotExistOrNotAuthorizedCard />
				</Match>
				<Match when={repositoryIsCloned.error}>
					<p class="text-danger">{repositoryIsCloned.error.message}</p>
				</Match>
				<Match when={inlangConfig.error}>
					<p class="text-danger">
						An error occured while initializing the config: {inlangConfig.error.message}
					</p>
				</Match>
				<Match when={repositoryIsCloned.loading || inlangConfig.loading}>
					<div class="flex flex-col grow justify-center items-center min-w-full gap-2">
						{/* sl-spinner need a own div otherwise the spinner has a bug. The wheel is rendered on the outer div  */}
						<div>
							{/* use font-size to change the spinner size    */}
							<sl-spinner class="text-4xl" />
						</div>

						<p class="text-lg font-medium">Cloning large repositories can take a few minutes...</p>
						<br />
						<p class="max-w-lg">
							TL;DR you are currently cloning a real git repo, in the browser, on top of a virtual
							file system, which might lead to a new generation of software (see{" "}
							<a
								class="link link-primary"
								href="https://inlang.com/documentation/the-next-git"
								target="_blank"
							>
								next git
							</a>
							).
							<br />
							<br />
							We are working on increasing the performance. Progress can be tracked in{" "}
							<a
								href="https://github.com/orgs/inlang/projects/9"
								target="_blank"
								class="link link-primary"
							>
								project #9
							</a>
							.
						</p>
					</div>
				</Match>
				<Match when={!doesInlangConfigExist()}>
					<NoInlangConfigFoundCard />
				</Match>
				<Match when={doesInlangConfigExist()}>
					<div class="mb-16 empty-parent">
						{/* <PreviewMessageFeatures /> */}
						<For each={Object.keys(messages())}>
							{(id) => <Messages messages={messages()[id]} />}
						</For>
						<div
							class={
								"show-child flex flex-col h-[calc(100vh_-_288px)] grow justify-center items-center min-w-full gap-2"
							}
						>
							<NoMatchPlaceholder />
							<p class="text-base font-medium text-left text-on-background">
								No results matched your search.
							</p>
							<p class="text-[13px] text-center text-on-surface-variant">
								Please remove some filters to get more matches.
							</p>
						</div>
					</div>
				</Match>
			</Switch>
		</>
	)
}

function NoInlangConfigFoundCard() {
	return (
		<div class="flex grow items-center justify-center">
			<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
				<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center" />
				<h1 class="font-semibold pt-5">
					The{" "}
					<code class="bg-secondary-container py-1 px-1.5 rounded text-on-secondary-container">
						inlang.config.js
					</code>{" "}
					file has not been found.
				</h1>
				<p class="pt-1.5">
					Make sure that the inlang.config.js file exists at the root of the repository, see
					discussion{" "}
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
						<MaterialSymbolsArrowOutwardRounded slot="suffix" />
					</sl-button>
				</a>
			</div>
		</div>
	)
}

function RepositoryDoesNotExistOrNotAuthorizedCard() {
	const { routeParams } = useEditorState()

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
						<MaterialSymbolsArrowOutwardRounded slot="suffix" />
					</sl-button>
				</a>
			</div>
		</div>
	)
}
