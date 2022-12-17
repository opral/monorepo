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
import { clientSideEnv } from "@env";
import { Config as InlangConfig, initialize$import } from "@inlang/core/config";
import { createStore } from "solid-js/store";
import type * as ast from "@inlang/core/ast";
import { Result } from "@inlang/utilities/result";
import type { LocalStorageSchema } from "@src/services/local-storage/schema.js";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
import { createAuthHeader } from "@src/services/auth/index.js";

/**
 * `<StateProvider>` initializes state with a computations such resources.
 *
 * Otherwise, the resources would be created with no root element.
 * See https://www.solidjs.com/docs/latest/api#createroot. Avoiding
 * to use Context https://www.solidjs.com/tutorial/stores_context
 * for simplicity.
 */
export function StateProvider(props: { children: JSXElement }) {
	const [localStorage] = useLocalStorage();

	// re-fetched if currentPageContext changes
	[repositoryIsCloned] = createResource(
		// the fetch must account for the user and currentpagecontext to properly re-fetch
		// when the user logs-in or out.
		() => [currentPageContext, localStorage.user],
		() => cloneRepository(currentPageContext(), localStorage.user)
	);
	// re-fetched if respository has been cloned
	[inlangConfig] = createResource(repositoryIsCloned, readInlangConfig);
	// re-fetched if the file system changes
	[unpushedChanges] = createResource(
		() => [fsChange(), lastPush()],
		() => _unpushedChanges()
	);

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

	//! Unexpected UX. If if the user conducted no changes,
	//! the files might change due to reactivity.
	createEffect(async () => {
		const config = inlangConfig();
		if (config === undefined || localStorage.user === undefined) {
			return;
		}
		await writeBundles(config, bundles, localStorage.user);
	});

	return props.children;
}

export let unpushedChanges: Resource<Awaited<ReturnType<typeof raw.log>>>;

/**
 * Whether a repository is cloned and when it was cloned.
 *
 * The value is `false` if the repository is not cloned. Otherwise,
 * a Date is provided that reflects the time of when the repository
 * was cloned.
 */
export let repositoryIsCloned: Resource<undefined | Date>;

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
export const [fsChange, setFsChange] = createSignal(new Date());

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

/**
 *  Date of the last push to the Repo
 */
const [lastPush, setLastPush] = createSignal<Date>();

// ------------------------------------------

const $import = initialize$import({ basePath: "/", fs: fs.promises, fetch });

async function cloneRepository(
	pageContext: PageContext,
	user: LocalStorageSchema["user"]
): Promise<Date | undefined> {
	const { host, organization, repository } = pageContext.routeParams;
	if (
		host === undefined ||
		organization === undefined ||
		repository === undefined
	) {
		return undefined;
	}
	await raw.clone({
		fs: fs,
		http,
		dir: "/",
		headers: user
			? createAuthHeader({
					encryptedAccessToken: user.encryptedAccessToken,
			  })
			: undefined,
		corsProxy: clientSideEnv.VITE_GIT_REQUEST_PROXY_PATH,
		url: `https://${host}/${organization}/${repository}`,
	});
	// triggering a side effect here to trigger a re-render
	// of components that depends on fs
	const date = new Date();
	setFsChange(date);
	return date;
}

/**
 * Pushed changes and pulls right afterwards.
 */
export async function pushChanges(
	pageContext: PageContext,
	user: NonNullable<LocalStorageSchema["user"]>
): Promise<Result<void, Error>> {
	const { host, organization, repository } = pageContext.routeParams;
	if (
		host === undefined ||
		organization === undefined ||
		repository === undefined
	) {
		return Result.err(Error("h3ni329 Invalid route params"));
	}
	const args = {
		fs: fs,
		http,
		dir: "/",
		author: {
			name: user.username,
		},
		headers: createAuthHeader({
			encryptedAccessToken: user.encryptedAccessToken,
		}),
		corsProxy: clientSideEnv.VITE_GIT_REQUEST_PROXY_PATH,
		url: `https://${host}/${organization}/${repository}`,
	};
	try {
		const push = await raw.push(args);
		if (push.ok === false) {
			return Result.err(Error("Failed to push", { cause: push.error }));
		}
		await raw.pull(args);
		const time = new Date();
		// triggering a rebuild of everything fs related
		setFsChange(time);
		setLastPush(time);
		return Result.ok(undefined);
	} catch (error) {
		return Result.err((error as Error) ?? "h3ni329 Unknown error");
	}
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

async function writeBundles(
	config: InlangConfig,
	bundles: ast.Bundle[],
	user: NonNullable<LocalStorageSchema["user"]>
) {
	await config.writeBundles({ $import, $fs: fs.promises, bundles });
	const status = await raw.statusMatrix({ fs, dir: "/" });
	const filesWithUncomittedChanges = status.filter(
		// files with unstaged and uncomitted changes
		(row) => row[2] === 2 && row[3] === 1
	);
	// auto commit
	for (const file of filesWithUncomittedChanges) {
		await raw.add({ fs, dir: "/", filepath: file[0] });
		await raw.commit({
			fs,
			dir: "/",
			author: {
				name: user.username,
			},
			message: "inlang: update translations",
		});
	}
	// triggering a side effect here to trigger a re-render
	// of components that depends on fs
	setFsChange(new Date());
}

async function _unpushedChanges() {
	const repositoryClonedTime = repositoryIsCloned();
	const lastPushTime = lastPush();
	if (repositoryClonedTime === undefined) {
		return [];
	}

	const unpushedChanges = await raw.log({
		fs,
		dir: "/",
		since: lastPushTime ? lastPushTime : repositoryClonedTime,
	});
	return unpushedChanges;
}
