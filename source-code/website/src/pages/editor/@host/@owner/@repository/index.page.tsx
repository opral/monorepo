import { query } from "@inlang/core/query";
import type { PageHead } from "@src/renderer/types.js";
import { For, Match, Switch } from "solid-js";
import { Messages } from "./Messages.jsx";
import {
	resources,
	inlangConfig,
	referenceResource,
	repositoryIsCloned,
} from "./state.js";
import { Layout as EditorLayout } from "./Layout.jsx";
import type * as ast from "@inlang/core/ast";
import type { EditorRouteParams } from "./types.js";
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";
import { isCollaborator, onForkRepository } from "./index.telefunc.js";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
let owner: string;
let repository: string;
export const Head: PageHead = (props) => {
	const routeParams = props.pageContext.routeParams as EditorRouteParams;
	owner = routeParams.owner;
	repository = routeParams.repository;
	return {
		title: routeParams.owner + "/" + routeParams.repository,
		description: `Contribute translations to ${routeParams.repository} via inlangs editor.`,
	};
};

export function Page() {
	/** Messages from all resources for an id */
	const messages = (id: ast.Message["id"]["name"]) => {
		const result: Record<string, ast.Message | undefined> = {};
		for (const resource of resources) {
			result[resource.languageTag.language] = query(resource).get({ id });
		}
		return result;
	};
	const inludedMessageIds = () => {
		const _referenceResource = referenceResource();
		if (_referenceResource === undefined) {
			return [];
		}
		return query(_referenceResource).includedMessageIds();
	};
	const [localStorage] = useLocalStorage();
	return (
		<EditorLayout>
			<sl-button
				onClick={async () => {
					if (localStorage.user && repository) {
						const collaborator = await isCollaborator({
							encryptedAccessToken: localStorage.user.encryptedAccessToken,
							owner: owner,
							repository: repository,
							username: localStorage.user.username,
						});
						if (!collaborator) {
							const forking = await onForkRepository({
								encryptedAccessToken: localStorage.user.encryptedAccessToken,
								owner: owner,
								repository: repository,
								username: localStorage.user.username,
							});
							console.log(collaborator, "colla");
							console.log(forking, "forking");
						}
					}
				}}
			>
				Fork
			</sl-button>
			<Switch
				fallback={
					<p class="text-danger">
						Switch fallback. This is likely an error. Please report it with code
						e329jafs.
					</p>
				}
			>
				<Match when={repositoryIsCloned.error || inlangConfig.error}>
					<p class="text-danger">
						{repositoryIsCloned.error ?? inlangConfig.error}
					</p>
				</Match>
				<Match when={repositoryIsCloned.loading || inlangConfig.loading}>
					<p>loading ...</p>
				</Match>
				<Match when={inlangConfig() === undefined}>
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
								Make sure that the inlang.config.js file exists at the root of
								the repository, see discussion{" "}
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
				</Match>
				<Match when={inlangConfig()}>
					<div class="space-y-2">
						<For each={inludedMessageIds()}>
							{(id) => <Messages messages={messages(id)}></Messages>}
						</For>
					</div>
				</Match>
			</Switch>
		</EditorLayout>
	);
}
