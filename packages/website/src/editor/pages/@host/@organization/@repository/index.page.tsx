import { clientSideEnv } from "@env";
import { raw, http } from "@inlang/git-sdk/api";
import { fs } from "@inlang/git-sdk/fs";
import { currentPageContext } from "@src/renderer/state.js";
import type { PageContext, PageHead } from "@src/renderer/types.js";
import { createResource, For, Match, Switch } from "solid-js";
import { onAuth } from "./index.telefunc.js";

export const Head: PageHead = () => {
	return {
		title: "Editor",
		description: "Editor",
	};
};

export function Page() {
	const [clone] = createResource(currentPageContext, cloneRepository);
	const [dir] = createResource(
		clone,
		() => fs.promises.readdir("/") as Promise<string[]>
	);

	return (
		<Switch fallback={<p>switch fallback trigerred. something went wrong</p>}>
			<Match when={clone.loading || dir.loading}>
				<p>loading ...</p>
			</Match>
			<Match when={clone.error || dir.error}>
				<p> {clone.error ?? dir.error}</p>
			</Match>
			<Match when={dir()}>
				<For each={dir()}>{(file) => <p>{file}</p>}</For>
			</Match>
		</Switch>
	);
}

async function cloneRepository(pageContext: PageContext): Promise<boolean> {
	const { host, organization, repository } = pageContext.routeParams;
	if (
		host === undefined ||
		organization === undefined ||
		repository === undefined
	) {
		return false;
	}
	await raw.clone({
		fs,
		http,
		dir: "/",
		onAuth: onAuth,
		corsProxy: clientSideEnv().VITE_CORS_PROXY_URL,
		url: "https://github.com/samuelstroschein/launchhouse-demo",
	});
	return true;
}
