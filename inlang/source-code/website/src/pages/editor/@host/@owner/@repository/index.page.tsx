import { For, Match, Switch, onMount } from "solid-js"
import { Layout as EditorLayout } from "./Layout.jsx"
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded"
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded"
import { Meta, Title } from "@solidjs/meta"
import { EditorStateProvider, useEditorState } from "./State.jsx"
import NoMatchPlaceholder from "./components/NoMatchPlaceholder.jsx"
import { ListHeader, messageCount } from "./components/Listheader.jsx"
import { TourHintWrapper } from "./components/Notification/TourHintWrapper.jsx"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import type { RecentProjectType } from "#src/services/local-storage/src/schema.js"
import { Message } from "./Message.jsx"
import { Errors } from "./components/Errors.jsx"

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
	const { project, routeParams, doesInlangConfigExist, tourStep, lixErrors } = useEditorState()
	const [, setLocalStorage] = useLocalStorage()

	onMount(() => {
		setLocalStorage("recentProjects", (prev) => {
			let recentProjects = prev[0] !== undefined ? prev : []

			recentProjects = recentProjects.filter(
				(project) =>
					!(
						project.owner === routeParams().owner && project.repository === routeParams().repository
					),
			)

			const newProject: RecentProjectType = {
				owner: routeParams().owner,
				repository: routeParams().repository,
				description: "",
				lastOpened: new Date().getTime(),
			}
			recentProjects.push(newProject)

			return recentProjects.sort((a, b) => b.lastOpened - a.lastOpened).slice(0, 7)
		})
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
				<Match when={lixErrors().some((e) => e.message.includes("401"))}>
					<RepositoryDoesNotExistOrNotAuthorizedCard code={401} />
				</Match>
				<Match when={lixErrors().some((e) => e.message.includes("404"))}>
					<RepositoryDoesNotExistOrNotAuthorizedCard code={404} />
				</Match>
				<Match when={lixErrors().length > 0}>
					<Errors
						errors={lixErrors()}
						message="An error occurred while cloning the repository:"
						messagePlural="errors occurred while cloning the repository:"
					/>
				</Match>
				<Match when={project() === undefined}>
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
				<Match when={project()?.errors().length !== 0 && project()}>
					<Errors
						errors={project()?.errors() || []}
						message="An error occurred while initializing the project file:"
						messagePlural="errors occurred while initializing the project file:"
					/>
				</Match>
				<Match when={!doesInlangConfigExist()}>
					<NoInlangConfigFoundCard />
				</Match>
				<Match
					when={
						doesInlangConfigExist() && project()?.query.messages.includedMessageIds() !== undefined
					}
				>
					<div>
						<ListHeader ids={project()?.query.messages.includedMessageIds() || []} />
						<TourHintWrapper
							currentId="textfield"
							position="bottom-left"
							offset={{ x: 110, y: 144 }}
							isVisible={tourStep() === "textfield"}
						>
							<For each={project()!.query.messages.includedMessageIds()}>
								{(id) => {
									return <Message id={id} />
								}}
							</For>
						</TourHintWrapper>
						<div
							class="flex flex-col h-[calc(100vh_-_288px)] grow justify-center items-center min-w-full gap-2"
							classList={{
								["hidden"]:
									messageCount(project()?.query.messages.includedMessageIds() || []) !== 0,
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
						{/* @ts-ignore */}
						<MaterialSymbolsArrowOutwardRounded slot="suffix" />
					</sl-button>
				</a>
			</div>
		</div>
	)
}

function RepositoryDoesNotExistOrNotAuthorizedCard(args: { code: number }) {
	const { routeParams } = useEditorState()

	return (
		<div class="flex grow items-center justify-center">
			<div class="border border-outline p-12 rounded-xl flex flex-col max-w-lg">
				<h1 class="text-5xl font-light pt-2">{args.code}</h1>
				<h2 class="font-semibold pt-12">
					Repo does not exist or you don't have sufficient access rights.
				</h2>
				<ul class="pt-8 list-disc pl-4">
					<li>
						Make sure that you the repository owner{" "}
						<code class="bg-secondary-container py-1 px-1.5 rounded text-on-secondary-container">
							{routeParams().owner}
						</code>{" "}
						and the repository name{" "}
						<code class="bg-secondary-container py-1 px-1.5 rounded text-on-secondary-container">
							{routeParams().repository}
						</code>{" "}
						contain no mistake.
					</li>
					<li class="pt-2">Alternatively, you might not have access to the repository.</li>
					<li class="pt-2">
						If this is a <span class="font-bold">private repository</span> please sign in at the
						bottom of the page.
					</li>
				</ul>
				<a
					class="self-end pt-5"
					href="https://github.com/inlang/monorepo/discussions/categories/help-questions-answers"
					target="_blank"
				>
					<sl-button prop:variant="text">
						I need help
						{/* @ts-ignore */}
						<MaterialSymbolsArrowOutwardRounded slot="suffix" />
					</sl-button>
				</a>
			</div>
		</div>
	)
}
