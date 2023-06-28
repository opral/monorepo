import { query } from "@inlang/core/query"
import { createMemo, createResource, createSignal, For, Match, Switch, Show } from "solid-js"
import { Messages } from "./Messages.jsx"
import { Layout as EditorLayout } from "./Layout.jsx"
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded"
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded"
import { Meta, Title } from "@solidjs/meta"
import { EditorStateProvider, useEditorState } from "./State.jsx"
import NoMatchPlaceholder from "./components/NoMatchPlaceholder.jsx"
import type { Language } from "@inlang/core/ast"
import type { LintedMessage } from "@inlang/core/lint"
import { rpc } from "@inlang/rpc"
import { ListHeader, messageCount } from "./components/Listheader.jsx"
import { TourHintWrapper } from "./components/Notification/TourHintWrapper.jsx"

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
	const {
		inlangConfig,
		resources,
		routeParams,
		repositoryIsCloned,
		doesInlangConfigExist,
		filteredLanguages,
		textSearch,
		filteredLintRules,
		tourStep,
	} = useEditorState()
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
				[language: Language]: LintedMessage | undefined
			}
		} = {}
		for (const resource of resources) {
			for (const id of query(resource).includedMessageIds()) {
				// defining the initial object, otherwise the following assignment will fail
				// with "cannot set property 'x' of undefined"
				if (result[id] === undefined) {
					result[id] = {}
				}
				const message = query(resource).get({ id }) as LintedMessage
				result[id]![resource.languageTag.name] = message
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
				<Match when={repositoryIsCloned.error?.message.includes("401")}>
					<p class="text-lg font-medium text-center flex justify-center items-center h-full grow">
						You want to access a private repository, please sign-in at the bottom.
					</p>
				</Match>
				<Match when={repositoryIsCloned.error}>
					<p class="text-danger">{repositoryIsCloned.error.message}</p>
				</Match>
				<Match when={inlangConfig.error}>
					<p class="text-danger">
						An error occurred while initializing the config: {inlangConfig.error.message}
					</p>
				</Match>
				<Match when={Object.keys(messages()).length === 0}>
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
								href="https://www.youtube.com/watch?v=vJ3jGgCrz2I"
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
					<div>
						<ListHeader messages={messages} />
						<TourHintWrapper
							currentId="textfield"
							position="bottom-left"
							offset={{ x: 110, y: 144 }}
							isVisible={tourStep() === "textfield"}
						>
							<For each={Object.keys(messages())}>
								{(id) => {
									return <Messages messages={messages()[id]!} />
								}}
							</For>
						</TourHintWrapper>
						<div
							class="flex flex-col h-[calc(100vh_-_288px)] grow justify-center items-center min-w-full gap-2"
							classList={{
								["hidden"]:
									messageCount(messages, filteredLanguages(), textSearch(), filteredLintRules()) !==
									0,
							}}
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
	const { fs, setFsChange } = useEditorState()

	const [shouldGenerateConfig, setShouldGenerateConfig] = createSignal(false)

	const [successGeneratingConfig, { refetch }] = createResource(shouldGenerateConfig, async () => {
		const [configFile, error] = await rpc.generateConfigFile({
			applicationId: "EDITOR",
			resolveFrom: "/",
			fs: fs(),
		})
		if (error) {
			return false
		} else {
			await fs().writeFile("/inlang.config.js", configFile)
			setFsChange(new Date())
			return true
		}
	})

	return (
		<div class="flex grow items-center justify-center">
			<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
				<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center" />
				<h1 class="font-semibold pt-5">Inlang has not been set up for this repository yet.</h1>
				<p class="pt-1.5 pb-8">
					Please refer to the documentation and write the config file manually.
				</p>
				<a class="self-center" href="/documentation" target="_blank">
					<sl-button prop:variant="text">
						Take me to the documentation
						<MaterialSymbolsArrowOutwardRounded slot="suffix" />
					</sl-button>
				</a>
			</div>
		</div>
	)
}

/**
 * Deactivated because bug https://github.com/inlang/inlang/issues/838#issuecomment-1560745678
 */
function NoInlangConfigFoundCardWithAutoGeneration() {
	const { fs, setFsChange } = useEditorState()

	const [shouldGenerateConfig, setShouldGenerateConfig] = createSignal(false)

	const [successGeneratingConfig, { refetch }] = createResource(shouldGenerateConfig, async () => {
		const [configFile, error] = await rpc.generateConfigFile({
			applicationId: "EDITOR",
			resolveFrom: "/",
			fs: fs(),
		})
		if (error) {
			return false
		} else {
			await fs().writeFile("/inlang.config.js", configFile)
			setFsChange(new Date())
			return true
		}
	})

	return (
		<Show when={successGeneratingConfig() !== false} fallback={<CouldntGenerateConfigCard />}>
			<div class="flex grow items-center justify-center">
				<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
					<MaterialSymbolsUnknownDocumentOutlineRounded class="w-10 h-10 self-center" />
					<h1 class="font-semibold pt-5">Inlang has not been set up for this repository yet.</h1>
					<p class="pt-1.5 pb-8">
						We can try to automatically the config for you. (The inlang.config.js file has not been
						found at the root of the repository.)
					</p>
					<Switch>
						<Match when={successGeneratingConfig() === undefined}>
							<sl-button
								prop:variant="primary"
								prop:loading={successGeneratingConfig.loading}
								onClick={() => {
									setShouldGenerateConfig(true)
									refetch()
								}}
							>
								Try to generate config
							</sl-button>
						</Match>
					</Switch>
				</div>
			</div>
		</Show>
	)
}

function CouldntGenerateConfigCard() {
	return (
		<div class="flex grow items-center justify-center">
			<div class="border border-outline p-8 rounded flex flex-col max-w-lg">
				<p class="text-4xl self-center" slot="suffix">
					😔
				</p>
				<h1 class="font-semibold pt-5">Couldn't generate the config file.</h1>
				<p class="pt-1.5 pb-8">
					Please refer to the documentation and write the config file manually.
				</p>
				<a class="self-center" href="/documentation" target="_blank">
					<sl-button prop:variant="text">
						Take me to the documentation
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
