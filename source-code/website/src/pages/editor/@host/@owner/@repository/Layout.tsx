import {
	fsChange,
	unpushedChanges,
	routeParams,
	StateProvider as EditorStateProvider,
	pushChanges,
	userIsCollaborator,
	forkingRepository,
} from "./state.js";
import {
	createEffect,
	createResource,
	createSignal,
	JSXElement,
	onCleanup,
	Show,
} from "solid-js";
import { raw } from "@inlang/git-sdk/api";
import { fs } from "@inlang/git-sdk/fs";
import { subSeconds, isAfter } from "date-fns";
import { currentPageContext } from "@src/renderer/state.js";
import { showToast } from "@src/components/Toast.jsx";
import { Layout as RootLayout } from "@src/pages/Layout.jsx";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
import type { EditorRouteParams } from "./types.js";
import { isCollaborator } from "@src/services/github/isCollaborator.telefunc.js";
import { onFork } from "@src/services/github/index.js";
import e, { response } from "express";
import type { LocalStorageSchema } from "@src/services/local-storage/index.js";
import { navigate } from "vite-plugin-ssr/client/router";
import { boolean } from "zod";

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<RootLayout>
			<EditorStateProvider>
				<div class="py-4 w-full space-y-2">
					<ForkingBanner></ForkingBanner>
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<Breadcrumbs></Breadcrumbs>
							<BranchMenu></BranchMenu>
						</div>

						<HasChangesAction></HasChangesAction>
					</div>

					<hr class="h-px w-full bg-outline-variant my-2"></hr>
					{props.children}
				</div>
			</EditorStateProvider>
		</RootLayout>
	);
}

function Breadcrumbs() {
	return (
		<div class="flex flex-row items-center space-x-2 text-lg font-medium">
			{/* repository icon */}
			<svg class="w-4 h-4" viewBox="0 0 16 16">
				<path
					fill="currentColor"
					fill-rule="evenodd"
					d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7a.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z"
				/>
			</svg>
			<h3>{routeParams().owner}</h3>
			<h3>/</h3>
			<h3>{routeParams().repository}</h3>
		</div>
	);
}

/**
 * The menu to select the branch.
 */
function BranchMenu() {
	const [branches] = createResource(fsChange, () => {
		return raw.listBranches({ fs: fs, dir: "/", remote: "origin" });
	});

	const [currentBranch] = createResource(fsChange, () => {
		return raw.currentBranch({ fs: fs, dir: "/" });
	});

	return (
		<Show when={(branches() ?? []).length > 0}>
			<sl-dropdown>
				<sl-button slot="trigger" prop:caret={true} prop:size="small">
					<div slot="prefix">
						{/* branch icon from github */}
						<svg class="w-4 h-4">
							<path
								fill="currentColor"
								fill-rule="evenodd"
								d="M11.75 2.5a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0a.75.75 0 0 1-1.5 0z"
							/>
						</svg>
					</div>
					{currentBranch() ?? "undefined"}
				</sl-button>
				<sl-menu class="w-48 min-w-full">
					<div class="p-4">
						Not implemented yet. Discussion is ongoing in{" "}
						<a
							href="https://github.com/inlang/inlang/discussions/166"
							class="link link-primary"
							target="blank"
						>
							#166
						</a>
					</div>
					{/* <For each={branches()}>
						{(branch) => (
							<a
							href={`${currentPageContext().urlParsed.pathname}?branch=${branch}`}
							>
							<sl-menu-item prop:checked={currentBranch() === branch}>
							{branch}
							</sl-menu-item>
							</a>
							)}
						</For> */}
				</sl-menu>
			</sl-dropdown>
		</Show>
	);
}

/** Actions that can be conducted if a commit has been made but not pushed yet. */
function HasChangesAction() {
	const [latestChange, setLatestChange] = createSignal<Date>();
	const [showPulse, setShowPulse] = createSignal(false);
	const [isLoading, setIsLoading] = createSignal(false);
	const [localStorage] = useLocalStorage();

	createEffect(() => {
		if (unpushedChanges()) {
			setLatestChange(new Date());
		}
	});

	// show the pulse if less than X seconds ago a change has been conducted
	const interval = setInterval(() => {
		const _latestChange = latestChange();
		if (_latestChange === undefined) {
			return setShowPulse(false);
		}
		const eightSecondsAgo = subSeconds(new Date(), 8);
		return setShowPulse(isAfter(_latestChange, eightSecondsAgo));
	}, 1000);

	onCleanup(() => clearInterval(interval));

	async function triggerPushChanges() {
		if (localStorage.user === undefined) {
			return showToast({
				title: "Failed to push changes",
				message: "Please login first",
				variant: "warning",
			});
		}
		setIsLoading(true);
		const result = await pushChanges(
			currentPageContext.routeParams as EditorRouteParams,
			localStorage.user
		);
		setIsLoading(false);
		if (result.isErr) {
			return showToast({
				title: "Failed to push changes",
				message: "Please try again or file a bug. " + result.error,
				variant: "danger",
			});
		} else {
			return showToast({
				title: "Changes have been pushed",
				variant: "success",
			});
		}
	}

	return (
		<sl-button
			prop:disabled={(unpushedChanges() ?? []).length === 0}
			onClick={triggerPushChanges}
			prop:loading={isLoading()}
		>
			Push changes
			<Show when={(unpushedChanges() ?? []).length > 0}>
				<sl-badge prop:pill={true} prop:pulse={showPulse() ? true : false}>
					{(unpushedChanges() ?? []).length}
				</sl-badge>
			</Show>
		</sl-button>
	);
}

// function Test() {
// 	const [localStorage] = useLocalStorage();
// 	createEffect(() => forking());
// 	const [allowtoFork, setallowtoFork] = createSignal();

// 	async function forking() {
// 		if (localStorage.user?.username !== undefined) {
// 			const responseCollaborator = await userIsCollaborator();
// 			console.log(localStorage.user?.username, "hallo", responseCollaborator);
// 			if (responseCollaborator === false) {
// 				setallowtoFork(true);
// 				console.log("ich bin kein colla", allowtoFork);
// 				// const response = await onFork({
// 				// 	owner: (currentPageContext.routeParams as EditorRouteParams).owner,
// 				// 	repository: (currentPageContext.routeParams as EditorRouteParams)
// 				// 		.repository,
// 				// 	encryptedAccessToken: localStorage.user.encryptedAccessToken,
// 				// 	username: localStorage.user.username,
// 				// });
// 				// if (response.type === "success") {
// 				// 	console.log(response);
// 				// 	return navigate(
// 				// 		`/editor/github.com/${response.owner}/${response.repository}`
// 				// 	);
// 				// } else {
// 				// 	console.log(response);
// 				// 	return response;
// 				// }
// 				return;
// 			} else {
// 				setallowtoFork(false);
// 				return;
// 			}
// 		} else if (localStorage.user?.username === undefined) {
// 			setallowtoFork(false);

// 			console.log(localStorage.user?.username, "username ist nicht definiert");
// 			return;
// 		}
// 	}

// 	// if (localStorage.user === undefined) {
// 	// 	console.log(localStorage.user, "wo ist mein button");
// 	// 	return <sl-button onClick={forking}>forkinfffg</sl-button>;
// 	// }
// 	return (
// 		<Show when={allowtoFork() === true}>
// 			<sl-button onClick={forking}>forkinfffg</sl-button>;
// 		</Show>
// 	);
// 	// return <sl-button onClick={forking}>forkinfffg</sl-button>;
// }

function ForkingBanner() {
	const [localStorage] = useLocalStorage();
	createEffect(() => colla());
	const [allowToFork, setallowToFork] = createSignal();

	async function colla() {
		if (localStorage.user?.username !== undefined) {
			const responseCollaborator = await userIsCollaborator();
			if (responseCollaborator === false) {
				return setallowToFork(true);
			} else {
				return setallowToFork(false);
			}
		} else {
			return setallowToFork(false);
		}
	}
	async function forking() {
		const response = await onFork({
			owner: (currentPageContext.routeParams as EditorRouteParams).owner,
			repository: (currentPageContext.routeParams as EditorRouteParams)
				.repository,
			encryptedAccessToken: localStorage.user!.encryptedAccessToken,
			username: localStorage.user!.username,
		});
		if (response.type === "success") {
			console.log(response);
			return navigate(
				`/editor/github.com/${response.owner}/${response.repository}`
			);
		} else {
			console.log(response);
			return response;
		}
	}
	return (
		<Show when={allowToFork() === true}>
			<sl-alert prop:variant="primary" prop:open={true}>
				<div class="flex space-x-4">
					<p>
						You’re making changes in a project you don’t have write access to.
						We’ve created a fork of this project for you to commit your proposed
						changes to. Submitting a change will write it to a new branch in
						your fork, so you can send a pull request.
					</p>

					<sl-button onClick={forking}>Fork your Repo</sl-button>
				</div>
			</sl-alert>
		</Show>
	);
}
