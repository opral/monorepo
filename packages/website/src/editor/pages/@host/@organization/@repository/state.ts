import { currentPageContext } from "@src/renderer/state.js";
import {
	createEffect,
	createResource,
	createSignal,
	JSXElement,
	Resource,
} from "solid-js";
import type { EditorRouteParams, EditorSearchParams } from "./types.js";
import { fs } from "@inlang/git-sdk/fs";
import type { PageContext } from "@src/renderer/types.js";
import { http, raw } from "@inlang/git-sdk/api";
import { onAuth } from "./index.telefunc.js";
import { clientSideEnv } from "@env";
import { Config as InlangConfig, initialize$import } from "@inlang/core/config";
import { createStore } from "solid-js/store";
import type * as ast from "@inlang/core/ast";

/**
 * `<StateProvider>` initializes state with a computations such resources.
 *
 * Otherwise, the resources would be created with no root element.
 * See https://www.solidjs.com/docs/latest/api#createroot. Avoiding
 * to use Context https://www.solidjs.com/tutorial/stores_context
 * for simplicity.
 */
export function StateProvider(props: { children: JSXElement }) {
	// re-fetched if currentPageContext changes
	[repositoryIsCloned] = createResource(currentPageContext, cloneRepository);
	// re-fetched if respository has been cloned
	[inlangConfig] = createResource(repositoryIsCloned, readInlangConfig);

	// if the config is loaded, read the bundles
	//! will lead to weird ux since this effect does not
	//! account for user intent
	createEffect(async () => {
		const config = inlangConfig();
		if (config === undefined) {
			return;
		}
		setBundles(await readBundles(config));
	});

	createEffect(() => {
		console.log(bundles);
	});

	// if bundle changes, write to filesystem
	// createEffect(async () => {
	// 	// TODO write to filesystem
	// });

	return props.children;
}

/**
 * Whether a repository is cloned and when it was cloned.
 *
 * The value is `false` if the repository is not cloned. Otherwise,
 * the number is a UNIX timestamp of when the repository was cloned.
 */
export let repositoryIsCloned: Resource<false | number>;

/**
 * The current inlang config.
 *
 * Undefined if no inlang config exists/has been found.
 */
export let inlangConfig: Resource<InlangConfig | undefined>;

/**
 * Route parameters like `/github.com/inlang/website`.
 */
export const routeParams = () =>
	currentPageContext().routeParams as EditorRouteParams;

/**
 * Search parameters of editor route like `?branch=main`.
 */
export const searchParams = () =>
	currentPageContext().urlParsed.search as EditorSearchParams;

/**
 * The filesystem is not reactive, hence setFsChange to manually
 * trigger re-renders.
 *
 * setFsChange manually to `Date.now()`
 */
export const [fsChange, setFsChange] = createSignal(Date.now());

/**
 * The bundles.
 */
export const [bundles, setBundles] = createStore<ast.Bundle[]>([]);

/**
 * The reference bundle.
 */
export const referenceBundle = () =>
	bundles.find(
		(bundle) => bundle.id.name === inlangConfig()?.referenceBundleId
	);

// ------------------------------------------

const $import = initialize$import({ basePath: "/", fs: fs.promises, fetch });

async function cloneRepository(
	pageContext: PageContext
): Promise<false | number> {
	const { host, organization, repository } = pageContext.routeParams;
	if (
		host === undefined ||
		organization === undefined ||
		repository === undefined
	) {
		return false;
	}
	await raw.clone({
		fs: fs,
		http,
		dir: "/",
		onAuth: onAuth,
		corsProxy: clientSideEnv().VITE_CORS_PROXY_URL,
		url: `https://${host}/${organization}/${repository}`,
	});
	// triggering a side effect here to trigger a re-render
	// of components that depends on fs
	setFsChange(Date.now());
	return Date.now();
}

async function readInlangConfig(): Promise<InlangConfig | undefined> {
	const file = await fs.promises.readFile("./inlang.config.js", "utf-8");
	if (file === undefined) {
		return undefined;
	}
	const withMimeType =
		"data:application/javascript;base64," + btoa(file.toString());

	const module = await import(/* @vite-ignore */ withMimeType);
	return module.config;
}

async function readBundles(config: InlangConfig) {
	const bundles = await config.readBundles({ $import, $fs: fs.promises });
	return bundles;
}

async function writeBundles(config: InlangConfig) {
	// await config({ $import, $fs: fs.promises });
}
