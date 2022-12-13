import { query } from "@inlang/core/query";
import { fs } from "@inlang/git-sdk/fs";
import type { PageHead } from "@src/renderer/types.js";
import { createResource, For, Match, Show, Switch } from "solid-js";
import { Messages } from "./Messages.jsx";
import {
	bundles,
	inlangConfig,
	referenceBundle,
	repositoryIsCloned,
} from "@src/pages/editor/state.js";
import { Layout as EditorLayout } from "@src/pages/editor/Layout.jsx";
import type * as ast from "@inlang/core/ast";

export const Head: PageHead = () => {
	return {
		title: "Editor",
		description: "Editor",
	};
};

export function Page() {
	/** Messages from all bundles for an id */
	const messages = (id: ast.Message["id"]["name"]) => {
		const result: Record<ast.Bundle["id"]["name"], ast.Message | undefined> =
			{};
		for (const bundle of bundles) {
			result[bundle.id.name] = query(bundle).get({ id });
		}
		return result;
	};

	const inludedMessageIds = () => {
		const _referenceBundle = referenceBundle();
		if (_referenceBundle === undefined) {
			return [];
		}
		return query(_referenceBundle).includedMessageIds();
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
				<Match when={inlangConfig() && referenceBundle()}>
					<div class="space-y-2">
						<For each={inludedMessageIds()}>
							{(id) => (
								<Messages
									referenceBundleId={referenceBundle()!.id.name}
									messages={messages(id)}
								></Messages>
							)}
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
