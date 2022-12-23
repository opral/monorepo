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
import { http, raw } from "@inlang/git-sdk/api";
import { clientSideEnv } from "@env";
import {
	ConfigSchema as InlangConfigSchema,
	EnvironmentFunctions,
	initialize$import,
} from "@inlang/core/config";
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
	console.log("calling state provider ", new Date());
	const [localStorage] = useLocalStorage();

	// re-fetched if currentPageContext changes
	[repositoryIsCloned] = createResource(
		// the fetch must account for the user and currentpagecontext to properly re-fetch
		// when the user logs-in or out.
		() => ({
			routeParams: currentPageContext.routeParams as EditorRouteParams,
			user: localStorage.user,
		}),
		cloneRepository
	);

	createEffect(() => {
		console.log(currentPageContext.routeParams, new Date());
	});

	// re-fetched if respository has been cloned
	[inlangConfig] = createResource(repositoryIsCloned, readInlangConfig);
	// re-fetched if the file system changes
	[unpushedChanges] = createResource(
		() => ({
			repositoryClonedTime: repositoryIsCloned()!,
			lastPushTime: lastPush(),
			// while unpushed changes does not require last fs change,
			// unpushed changed should react to fsCahnge. Hence, pass
			// the signal to _unpushedChanges
			lastFsChange: fsChange(),
		}),
		_unpushedChanges
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
export let inlangConfig: Resource<InlangConfigSchema | undefined>;

/**
 * Route parameters like `/github.com/inlang/website`.
 */
export const routeParams = () =>
	currentPageContext.routeParams as EditorRouteParams;

/**
 * Search parameters of editor route like `?branch=main`.
 */
export const searchParams = () =>
	currentPageContext.urlParsed.search as EditorSearchParams;

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

const environmentFunctions: EnvironmentFunctions = {
	$import: initialize$import({ basePath: "/", fs: fs.promises, fetch }),
	$fs: fs.promises,
};

async function cloneRepository(args: {
	routeParams: EditorRouteParams;
	user: LocalStorageSchema["user"];
}): Promise<Date | undefined> {
	const { host, organization, repository } = args.routeParams;
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
		headers: args.user
			? createAuthHeader({
					encryptedAccessToken: args.user.encryptedAccessToken,
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
	routeParams: EditorRouteParams,
	user: NonNullable<LocalStorageSchema["user"]>
): Promise<Result<void, Error>> {
	const { host, organization, repository } = routeParams;
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

async function readInlangConfig(): Promise<InlangConfigSchema | undefined> {
	const file = await fs.promises.readFile("./inlang.config.js", "utf-8");
	if (file === undefined) {
		return undefined;
	}
	const withMimeType =
		"data:application/javascript;base64," + btoa(file.toString());

	const module = await import(/* @vite-ignore */ withMimeType);
	const initialized = await module.config({ ...environmentFunctions });
	return initialized;
}

async function readBundles(config: InlangConfigSchema) {
	const bundles = await config.readBundles({ ...environmentFunctions });
	return bundles;
}

async function writeBundles(
	config: InlangConfigSchema,
	bundles: ast.Bundle[],
	user: NonNullable<LocalStorageSchema["user"]>
) {
	await config.writeBundles({ ...environmentFunctions, bundles });
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

async function _unpushedChanges(args: {
	repositoryClonedTime: Date;
	lastPushTime?: Date;
}) {
	if (args.repositoryClonedTime === undefined) {
		return [];
	}
	const unpushedChanges = await raw.log({
		fs,
		dir: "/",
		since: args.lastPushTime ? args.lastPushTime : args.repositoryClonedTime,
	});
	return unpushedChanges;
}
