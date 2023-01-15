import { query } from "@inlang/core/query";
import type { PageHead } from "@src/renderer/types.js";
import { createMemo, For, Match, Switch } from "solid-js";
import { Messages } from "./Messages.jsx";
import { resources, inlangConfig, repositoryIsCloned } from "./state.js";
import { Layout as EditorLayout } from "./Layout.jsx";
import type * as ast from "@inlang/core/ast";
import type { EditorRouteParams } from "./types.js";
import MaterialSymbolsUnknownDocumentOutlineRounded from "~icons/material-symbols/unknown-document-outline-rounded";
import MaterialSymbolsArrowOutwardRounded from "~icons/material-symbols/arrow-outward-rounded";

export const Head: PageHead = (props) => {
	const routeParams = props.pageContext.routeParams as EditorRouteParams;
	return {
		title: routeParams.owner + "/" + routeParams.repository,
		description: `Contribute translations to ${routeParams.repository} via inlangs editor.`,
	};
};

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
						<For each={Object.keys(messages())}>
							{(id) => <Messages messages={messages()[id]}></Messages>}
						</For>
					</div>
				</Match>
			</Switch>
		</EditorLayout>
	);
}
