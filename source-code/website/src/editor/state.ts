import { fs } from "@inlang/git-sdk/fs";
import type * as AST from "@inlang/core/ast";
import { createResource, createSignal } from "solid-js";
import { currentPageContext } from "@src/renderer/state.js";
import { http, raw } from "@inlang/git-sdk/api";
import { getAccessToken } from "./pages/index.telefunc.js";
import { clientSideEnv } from "@env";

const repositoryUrl = () => currentPageContext().routeParams.repositoryUrl;

/**
 * The path within the repository.
 */
export const [path, setPath] = createSignal("/");

export const [clone] = createResource([repositoryUrl], async () => {
	await raw.clone({
		fs,
		http,
		dir: "/",
		onAuth: async () => ({
			username: "samuelstroschein",
			password: await getAccessToken(),
		}),
		corsProxy: clientSideEnv().VITE_CORS_PROXY_URL,
		url: "https://github.com/samuelstroschein/launchhouse-demo",
	});
	return true;
});
