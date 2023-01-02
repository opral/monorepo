import { query } from "@inlang/core/query";
import { fs } from "@inlang/git-sdk/fs";
import type { PageHead } from "@src/renderer/types.js";
import { createResource, For, Match, Show, Switch } from "solid-js";
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

export const Head: PageHead = (props) => {
	const routeParams = props.pageContext.routeParams as EditorRouteParams;
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

	return (
		<EditorLayout>
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
					<Directories></Directories>
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

function Directories() {
	const [dir] = createResource(
		repositoryIsCloned,
		() => fs.promises.readdir("/") as Promise<string[]>
	);

	return (
		<>
			<p>
				No inlang.config.js has been found in the current directory. Navigate to
				a directory that contains an inlang.config.js file.
				<span class="text-danger italic">not implemented yet</span>
			</p>
			<Show when={dir.loading}>
				<p>loading ...</p>
			</Show>
			<Show when={dir.error}>
				<p class="text-danger">{dir.error}</p>
			</Show>
			<Show when={dir()}>
				<For each={dir()}>{(file) => <p>{file}</p>}</For>
			</Show>
		</>
	);
}
