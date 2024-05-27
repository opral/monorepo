import { useLocalStorage } from "#src/services/local-storage/index.js"
import { createEffect, createSignal, type JSXElement, onMount, Show, on } from "solid-js"
import IconGithub from "~icons/cib/github"
import { useEditorState } from "../State.jsx"
import type { SlDialog } from "@shoelace-style/shoelace"
import { showToast } from "#src/interface/components/Toast.jsx"
import { navigate } from "vike/client/router"
import { currentPageContext } from "#src/renderer/state.js"
import type { EditorRouteParams } from "../types.js"
import {
	SignInDialog,
	ForkPermissionDialog,
	PushPermissionDialog,
} from "#src/services/auth/index.js"
import { posthog as telemetryBrowser } from "posthog-js"
import { TourHintWrapper, type TourStepId } from "./Notification/TourHintWrapper.jsx"
import { getAuthClient } from "@lix-js/client"
import {
	setSignInModalOpen,
	signInModalOpen,
} from "#src/services/auth/src/components/SignInDialog.jsx"
import { WarningIcon } from "./Notification/NotificationHint.jsx"
import IconArrowDownward from "~icons/material-symbols/arrow-downward-alt"
import { debounce } from "throttle-debounce"
import { publicEnv } from "@inlang/env-variables"

const browserAuth = getAuthClient({
	gitHubProxyBaseUrl: publicEnv.PUBLIC_GIT_PROXY_BASE_URL,
	githubAppName: publicEnv.PUBLIC_LIX_GITHUB_APP_NAME,
	githubAppClientId: publicEnv.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
})

export const Gitfloat = () => {
	const {
		repo,
		refetchRepo,
		forkStatus,
		mutateForkStatus,
		refetchForkStatus,
		createFork,
		userIsCollaborator,
		githubRepositoryInformation,
		currentBranch,
		pushChanges,
		mergeUpstream,
		localChanges,
		setLocalChanges,
		setFsChange,
		routeParams,
		refLink,
		setLastPullTime,
		tourStep,
		project,
		projectList,
		lixErrors,
	} = useEditorState()
	const [localStorage] = useLocalStorage()

	// ui states
	const gitState: () => "login" | "loading" | "fork" | "pullrequest" | "hasChanges" = () => {
		// type check for githubRepositoryInformation
		// eslint-disable-next-line prefer-const
		let repoInfo = githubRepositoryInformation()
		const isFork = () => (repoInfo && "isFork" in repoInfo ? repoInfo.isFork : false)

		// check if the user has disabled the fork sync warning
		const disableForkSyncWarning = () =>
			localStorage?.disableForkSyncWarning?.some(
				(repo: { owner: string; repository: string }) =>
					repo.owner === routeParams().owner && repo.repository === routeParams().repository
			)

		if (localStorage?.user === undefined) {
			return "loading"
		} else if (localStorage?.user?.isLoggedIn === false) {
			return "login"
		} else if (
			typeof repoInfo === "undefined" ||
			userIsCollaborator.loading ||
			!projectList() ||
			isForking()
		) {
			return "loading"
		} else if (userIsCollaborator() === false) {
			return "fork"
		} else if (
			hasPushedChanges() &&
			localChanges() === 0 &&
			(isFork() || refLink().includes("ninja-")) &&
			!disableForkSyncWarning()
		) {
			// if changes exist in a fork, show the pull request button
			return "pullrequest"
		}
		// user is logged in and a collaborator, thus show changeStatus
		return "hasChanges"
	}

	const [isLoading, setIsLoading] = createSignal(false)
	const [isForking, setIsForking] = createSignal(false)
	const [isMerging, setIsMerging] = createSignal(false)
	const [hasPushedChanges, setHasPushedChanges] = createSignal(false)

	let signInDialog: SlDialog | undefined
	let forkPermissionDialog: SlDialog | undefined
	let pushPermissionDialog: SlDialog | undefined
	let forkDialog: SlDialog | undefined
	const [forkModalOpen, setForkModalOpen] = createSignal(false)

	createEffect(() => {
		if (signInModalOpen()) {
			signInDialog?.show()
		}
	})

	createEffect(() => {
		if (forkModalOpen()) {
			forkDialog?.show()
		} else {
			forkDialog?.hide()
		}
	})

	async function handleFork() {
		if (!localStorage.user?.isLoggedIn) {
			return
		}
		setIsForking(true)
		const response = await createFork().catch((err) => err)

		telemetryBrowser.capture("EDITOR created fork", {
			owner: routeParams().owner,
			repository: routeParams().repository,
			sucess: response?.status === 202,
		})
		if (response?.status === 202) {
			showToast({
				variant: "success",
				title: "Fork opened successfully.",
				message: `Don't forget to open a pull request`,
			})
			// reset localChanges counter, as changes are not transferred to the fork
			setLocalChanges(0)

			setTimeout(() => {
				// @ts-expect-error - type mismatch fix after refactoring
				navigate(`/github.com/${response.data.full_name}`)
			}, 1000)
			return
		} else if (response?.status === 403) {
			forkPermissionDialog.show()
			return
		} else {
			showToast({
				variant: "danger",
				title: `The creation of the fork failed.`,
				message: `Please try it again or report a bug (status code: ${response?.status})`,
			})
			return response
		}
	}

	async function triggerPushChanges() {
		if (!localStorage?.user?.isLoggedIn) {
			return showToast({
				title: "Failed to push changes",
				message: "Please login first",
				variant: "warning",
			})
		}
		setIsLoading(true)

		// commit & push
		if (!repo()) {
			return showToast({
				title: "Failed to push changes",
				message: "Please try again or file a bug.",
				variant: "danger",
			})
		}

		const pushResult = await pushChanges({
			user: localStorage.user,
			setFsChange,
			setLastPullTime,
		})

		setIsLoading(false)

		telemetryBrowser.capture("EDITOR pushed changes", {
			owner: routeParams().owner,
			repository: routeParams().repository,
			sucess: pushResult.error === undefined,
		})

		if (pushResult.error?.data?.statusCode === 403) {
			pushPermissionDialog.show()
			return
		}

		if (pushResult.error) {
			return showToast({
				title: "Failed to push changes",
				message: "Please try again or file a bug. " + pushResult.error.message,
				variant: "danger",
			})
		} else {
			setLocalChanges(0)
			setHasPushedChanges(true)
			return showToast({
				title: "Changes have been pushed",
				variant: "success",
			})
		}
	}

	const pullrequestUrl = () => {
		const repoInfo = githubRepositoryInformation()
		if (typeof repoInfo === "undefined" || "error" in repoInfo) {
			return
		}
		if (refLink().includes("ninja-")) {
			return `https://github.com/${refLink().replace("ninja-", "")}`
		}
		return `https://github.com/${repoInfo?.parent?.fullName}/compare/${currentBranch()}...${
			routeParams().owner
		}:${
			routeParams().repository
		}:${currentBranch()}?expand=1;title=Update%20translations;body=Describe%20the%20changes%20you%20have%20conducted%20here%0A%0APreview%20the%20messages%20on%20https%3A%2F%2Finlang.com%2Fgithub.com%2F${
			(currentPageContext.routeParams as EditorRouteParams).owner
		}%2F${(currentPageContext.routeParams as EditorRouteParams).repository}%20.`
	}

	interface GitfloatData {
		text: string
		buttontext: string
		icon: () => JSXElement
		onClick: () => void
		href?: string
		tourStepId?: TourStepId
	}

	type GitFloatArray = {
		[state in "login" | "loading" | "fork" | "hasChanges" | "pullrequest"]: GitfloatData
	}

	const data: GitFloatArray = {
		login: {
			text: "Sign in to make changes",
			buttontext: "Sign in",
			icon: () => {
				return <IconGithub />
			},
			onClick: () => setSignInModalOpen(true),
			tourStepId: "github-login",
		},
		loading: {
			text: "Loading...",
			buttontext: "",
			icon: () => {
				return <IconGithub />
			},
			onClick: () => {
				// do nothing
			},
		},
		fork: {
			text: "Fork to make changes",
			buttontext: "Fork",
			icon: IconFork,
			onClick: handleFork,
			tourStepId: "fork-repository",
		},
		hasChanges: {
			text: "changes",
			buttontext: "Push",
			icon: IconPush,
			onClick: triggerPushChanges,
		},
		pullrequest: {
			text: "",
			buttontext: refLink().includes("ninja-") ? "View pull request" : "Open pull request",
			icon: IconPullrequest,
			href: "pullrequest",
			onClick: () => {
				// ToDo: @jannesblobel - has to create an action for view pull request
				if (!refLink().includes("ninja-")) {
					telemetryBrowser.capture("EDITOR opened pull request", {
						owner: routeParams().owner,
						repository: routeParams().repository,
					})
				}
				setHasPushedChanges(false)
			},
		},
	}

	// prevent user from making to changes when not logged in
	createEffect(() => {
		if (gitState() === "login" && localChanges() > 2) setSignInModalOpen(true)
	})

	const debouncedForkModalState = debounce(2000, () => {
		if (gitState() === "hasChanges") {
			setForkModalOpen(false)
		} else if (gitState() === "fork" && localChanges() > 2) {
			setForkModalOpen(true)
		}
	})
	createEffect(on([gitState, localChanges], debouncedForkModalState))

	// prevent user from leaving the page when changes are not pushed
	const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
		event.preventDefault()
		event.returnValue = ""
	}

	// remove event listener when navigating away
	const popstateHandler = (event: BeforeUnloadEvent) => {
		event.preventDefault()
		window.removeEventListener("beforeunload", beforeUnloadHandler)
		window.removeEventListener("popstate", popstateHandler)
	}

	createEffect(() => {
		if (localChanges() > 0) {
			window.addEventListener("beforeunload", beforeUnloadHandler)
			window.addEventListener("popstate", popstateHandler)
		} else {
			window.removeEventListener("beforeunload", beforeUnloadHandler)
			window.removeEventListener("popstate", popstateHandler)
		}
	})

	// animations
	onMount(() => {
		const gitfloat = document.querySelector(".gitfloat")
		gitfloat?.classList.add("animate-slideIn")
		setTimeout(() => gitfloat?.classList.remove("animate-slideIn"), 400)
	})

	createEffect(() => {
		if (localChanges() > 0 && localStorage?.user?.isLoggedIn) {
			const gitfloat = document.querySelector(".gitfloat")
			gitfloat?.classList.add("animate-jump")
			setTimeout(() => gitfloat?.classList.remove("animate-jump"), 1000)
		}
	})

	createEffect(() => {
		if (
			forkStatus().behind > 0 &&
			(tourStep() !== "github-login" || tourStep() !== "fork-repository")
		) {
			const gitfloat = document.querySelector(".syncfork")
			gitfloat?.classList.remove("hidden")
			gitfloat?.classList.add("animate-slideInFromBehind", "-z-10")
			setTimeout(() => gitfloat?.classList.remove("animate-slideInFromBehind", "-z-10"), 400)
		}
	})

	createEffect(() => {
		if (!isMerging()) {
			const gitfloat = document.querySelector(".syncfork")
			gitfloat?.classList.add("animate-slideOutFromBehind", "-z-10")
			setTimeout(() => gitfloat?.classList.remove("animate-slideOutFromBehind", "-z-10"), 400)
			setTimeout(() => gitfloat?.classList.add("hidden"), 400)
		}
	})

	// wait until fork fetch is done and user is collaborator
	createEffect(
		on(userIsCollaborator, () => {
			if (userIsCollaborator()) {
				setIsForking(false)
			}
		})
	)

	const loggedInUser = (
		user: typeof localStorage.user
	): { username: string; avatarUrl?: string } | false => (user?.isLoggedIn ? user : false)

	return (
		<>
			<div class="gitfloat z-30 sticky mx-auto bottom-8 w-[300px] my-16">
				<TourHintWrapper
					currentId={tourStep()}
					position="top-right"
					offset={{ x: 0, y: 60 }}
					isVisible={
						(tourStep() === "github-login" || tourStep() === "fork-repository") &&
						project() !== undefined &&
						gitState() !== "loading" &&
						project()?.errors().length === 0 &&
						lixErrors().length === 0
					}
				>
					<Show
						when={
							forkStatus() &&
							forkStatus().behind > 0 &&
							!forkStatus().conflicts &&
							userIsCollaborator()
						}
					>
						<div class="syncfork w-full relative flex justify-start items-center gap-1.5 rounded-t-lg bg-[#293344] p-1.5 text-xs font-medium text-on-inverted-surface after:content-[''] after:absolute after:w-full after:h-8 after:translate-y-6 after:-m-1.5 after:bg-[#293344] after:-z-10">
							<div class="text-warning-on-inverted-container px-1.5 py-[5px]">
								<WarningIcon />
							</div>
							Get new project changes
							<sl-button
								prop:size="small"
								onClick={async () => {
									setIsMerging(true)
									await mergeUpstream()
									refetchRepo()
									setIsMerging(false)
									setTimeout(() => {
										// optimistic reset
										mutateForkStatus({ ...forkStatus(), behind: 0, conflicts: false })
										refetchForkStatus()
									}, 400)
								}}
								prop:loading={isMerging()}
								class="ml-auto on-inverted"
							>
								{/* @ts-ignore */}
								<IconArrowDownward slot="prefix" class="w-6 h-6 -mx-1 opacity-90" />
								<span class="opacity-90">{forkStatus().behind}</span>
							</sl-button>
						</div>
					</Show>
					<div class="w-full flex justify-start items-center rounded-lg bg-inverted-surface shadow-xl z-20">
						<Show when={loggedInUser(localStorage.user)}>
							{(user) => (
								<div class="absolute flex justify-start items-center self-stretch flex-grow-0 flex-shrink-0 gap-2 p-1.5 rounded-tl-lg rounded-bl-lg border-t-0 border-r border-b-0 border-l-0 border-background/10 animate-blendIn">
									<img
										src={user().avatarUrl}
										alt="user avatar"
										class="flex-grow-0 flex-shrink-0 w-[30px] h-[30px] rounded object-cover bg-on-inverted-surface animate-fadeIn"
									/>
								</div>
							)}
						</Show>
						<div
							class={
								"flex justify-start items-center self-stretch flex-grow relative gap-2 pr-1.5 py-1.5 transition-all duration-200 " +
								(gitState() === "pullrequest" ? "pl-1.5 " : "pl-3 ") +
								(loggedInUser(localStorage.user) && "ml-11")
							}
						>
							<p
								class={
									"flex items-center gap-2 flex-grow text-xs font-medium text-left text-on-inverted-surface transition-all duration-200 " +
									(gitState() === "pullrequest" && "hidden")
								}
							>
								<Show when={gitState() === "hasChanges"}>
									<div
										class={
											"flex flex-col justify-center items-center flex-grow-0 flex-shrink-0 h-5 min-w-[1.25rem] gap-2 py-2 px-1 rounded bg-info " +
											(gitState() === "hasChanges" && "animate-fadeIn")
										}
									>
										<p class="flex-grow-0 flex-shrink-0 text-xs font-medium text-left text-slate-100">
											{localChanges()}
										</p>
									</div>
								</Show>
								{data[gitState()].text}
							</p>
							<sl-button
								prop:size="small"
								onClick={() => data[gitState()].onClick()}
								prop:href={data[gitState()].href === "pullrequest" ? pullrequestUrl() : undefined}
								prop:target="_blank"
								prop:loading={isLoading() || gitState() === "loading"}
								prop:disabled={localChanges() === 0 && gitState() === "hasChanges"}
								class={"on-inverted " + (gitState() === "pullrequest" ? "grow " : "w-[76.8px]")}
							>
								{data[gitState()].buttontext}
								<div slot="suffix">{data[gitState()].icon()}</div>
							</sl-button>
						</div>
					</div>
				</TourHintWrapper>
			</div>
			<SignInDialog
				ref={signInDialog}
				onClickOnSignInButton={() => {
					// hide the sign in dialog to increase UX when switching back to this window
					browserAuth.login({ redirect: window.location.origin + "/auth/auth-callback" })
					signInDialog?.hide()
					setSignInModalOpen(false)
				}}
			/>
			<ForkPermissionDialog
				ref={forkPermissionDialog!}
				onClickForkPermissionButton={() => {
					// hide the sign in dialog to increase UX when switching back to this window
					browserAuth.addPermissions()
					forkPermissionDialog?.hide()
					setIsForking(false)
				}}
			/>
			<PushPermissionDialog
				ref={pushPermissionDialog!}
				onClickPushPermissionButton={() => {
					// hide the sign in dialog to increase UX when switching back to this window
					browserAuth.addPermissions()
					pushPermissionDialog?.hide()
				}}
			/>
			<sl-dialog
				ref={forkDialog}
				on:sl-show={() => setForkModalOpen(true)}
				on:sl-after-hide={() => setForkModalOpen(false)}
			>
				<h3 slot="label">No access to this repo</h3>
				<p>
					To push changes, you must use a fork of this repository and submit changes with a pull
					request. If you already have one, this will be opened, otherwise a new fork will be
					created for you.
				</p>
				<sl-button
					slot="footer"
					prop:variant="primary"
					onClick={() => {
						handleFork()
						forkDialog?.hide()
						setForkModalOpen(false)
					}}
				>
					<div slot="prefix">
						<IconFork />
					</div>
					Open fork
				</sl-button>
			</sl-dialog>
		</>
	)
}

export const IconFork = () => {
	return (
		<svg
			width={20}
			height={20}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="flex-grow-0 flex-shrink-0 w-5 h-5 relative"
			preserveAspectRatio="xMidYMid meet"
		>
			<path
				d="M8.33415 15.0004C8.33415 15.4424 8.50974 15.8664 8.8223 16.1789C9.13486 16.4915 9.55879 16.6671 10.0008 16.6671C10.4428 16.6671 10.8668 16.4915 11.1793 16.1789C11.4919 15.8664 11.6675 15.4424 11.6675 15.0004C11.6675 14.5584 11.4919 14.1345 11.1793 13.8219C10.8668 13.5093 10.4428 13.3337 10.0008 13.3337C9.55879 13.3337 9.13486 13.5093 8.8223 13.8219C8.50974 14.1345 8.33415 14.5584 8.33415 15.0004ZM4.16748 5.00041C4.16748 5.44243 4.34308 5.86636 4.65564 6.17892C4.9682 6.49148 5.39212 6.66707 5.83415 6.66707C6.27617 6.66707 6.7001 6.49148 7.01266 6.17892C7.32522 5.86636 7.50081 5.44243 7.50081 5.00041C7.50081 4.55838 7.32522 4.13446 7.01266 3.8219C6.7001 3.50933 6.27617 3.33374 5.83415 3.33374C5.39212 3.33374 4.9682 3.50933 4.65564 3.8219C4.34308 4.13446 4.16748 4.55838 4.16748 5.00041ZM12.5008 5.00041C12.5008 5.44243 12.6764 5.86636 12.989 6.17892C13.3015 6.49148 13.7255 6.66707 14.1675 6.66707C14.6095 6.66707 15.0334 6.49148 15.346 6.17892C15.6586 5.86636 15.8341 5.44243 15.8341 5.00041C15.8341 4.55838 15.6586 4.13446 15.346 3.8219C15.0334 3.50933 14.6095 3.33374 14.1675 3.33374C13.7255 3.33374 13.3015 3.50933 12.989 3.8219C12.6764 4.13446 12.5008 4.55838 12.5008 5.00041Z"
				stroke="currentColor"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M5.83374 6.66724V8.3339C5.83374 8.77593 6.00933 9.19985 6.3219 9.51241C6.63446 9.82497 7.05838 10.0006 7.50041 10.0006H12.5004C12.9424 10.0006 13.3664 9.82497 13.6789 9.51241C13.9915 9.19985 14.1671 8.77593 14.1671 8.3339V6.66724M10.0004 10.0006V13.3339"
				stroke="currentColor"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	)
}

export const IconPush = () => {
	return (
		<svg
			width={20}
			height={20}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="flex-grow-0 flex-shrink-0 w-5 h-5 relative"
			preserveAspectRatio="xMidYMid meet"
		>
			<path
				d="M10 13.3333C9.76393 13.3333 9.56588 13.2533 9.40588 13.0933C9.24588 12.9333 9.16615 12.7356 9.16671 12.5V6.54167L7.60421 8.10417C7.43754 8.27083 7.2431 8.35417 7.02088 8.35417C6.79865 8.35417 6.59726 8.26389 6.41671 8.08333C6.25004 7.91667 6.17032 7.71889 6.17754 7.49C6.18476 7.26111 6.26449 7.07 6.41671 6.91667L9.41671 3.91667C9.50004 3.83333 9.59032 3.77444 9.68754 3.74C9.78476 3.70556 9.88893 3.68806 10 3.6875C10.1112 3.6875 10.2153 3.705 10.3125 3.74C10.4098 3.775 10.5 3.83389 10.5834 3.91667L13.5834 6.91667C13.75 7.08333 13.83 7.28139 13.8234 7.51083C13.8167 7.74028 13.7367 7.93111 13.5834 8.08333C13.4167 8.25 13.2187 8.33694 12.9892 8.34417C12.7598 8.35139 12.562 8.27139 12.3959 8.10417L10.8334 6.54167V12.5C10.8334 12.7361 10.7534 12.9342 10.5934 13.0942C10.4334 13.2542 10.2356 13.3339 10 13.3333ZM5.00004 16.6667C4.54171 16.6667 4.14921 16.5033 3.82254 16.1767C3.49588 15.85 3.33282 15.4578 3.33338 15V13.3333C3.33338 13.0972 3.41338 12.8992 3.57338 12.7392C3.73338 12.5792 3.93115 12.4994 4.16671 12.5C4.40282 12.5 4.60088 12.58 4.76088 12.74C4.92088 12.9 5.0006 13.0978 5.00004 13.3333V15H15V13.3333C15 13.0972 15.08 12.8992 15.24 12.7392C15.4 12.5792 15.5978 12.4994 15.8334 12.5C16.0695 12.5 16.2675 12.58 16.4275 12.74C16.5875 12.9 16.6673 13.0978 16.6667 13.3333V15C16.6667 15.4583 16.5034 15.8508 16.1767 16.1775C15.85 16.5042 15.4578 16.6672 15 16.6667H5.00004Z"
				fill="currentColor"
			/>
		</svg>
	)
}

export const IconPullrequest = () => {
	return (
		<svg
			width={20}
			height={20}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="flex-grow-0 flex-shrink-0 w-5 h-5 relative"
			preserveAspectRatio="xMidYMid meet"
		>
			<path
				d="M5.00065 13.3334C5.44268 13.3334 5.8666 13.509 6.17916 13.8215C6.49172 14.1341 6.66732 14.558 6.66732 15C6.66732 15.4421 6.49172 15.866 6.17916 16.1786C5.8666 16.4911 5.44268 16.6667 5.00065 16.6667C4.55862 16.6667 4.1347 16.4911 3.82214 16.1786C3.50958 15.866 3.33398 15.4421 3.33398 15C3.33398 14.558 3.50958 14.1341 3.82214 13.8215C4.1347 13.509 4.55862 13.3334 5.00065 13.3334ZM5.00065 13.3334V6.66671M5.00065 6.66671C4.55862 6.66671 4.1347 6.49111 3.82214 6.17855C3.50958 5.86599 3.33398 5.44207 3.33398 5.00004C3.33398 4.55801 3.50958 4.13409 3.82214 3.82153C4.1347 3.50897 4.55862 3.33337 5.00065 3.33337C5.44268 3.33337 5.8666 3.50897 6.17916 3.82153C6.49172 4.13409 6.66732 4.55801 6.66732 5.00004C6.66732 5.44207 6.49172 5.86599 6.17916 6.17855C5.8666 6.49111 5.44268 6.66671 5.00065 6.66671ZM13.334 15C13.334 15.4421 13.5096 15.866 13.8221 16.1786C14.1347 16.4911 14.5586 16.6667 15.0007 16.6667C15.4427 16.6667 15.8666 16.4911 16.1792 16.1786C16.4917 15.866 16.6673 15.4421 16.6673 15C16.6673 14.558 16.4917 14.1341 16.1792 13.8215C15.8666 13.509 15.4427 13.3334 15.0007 13.3334C14.5586 13.3334 14.1347 13.509 13.8221 13.8215C13.5096 14.1341 13.334 14.558 13.334 15Z"
				stroke="currentColor"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9.16724 5H13.3339C13.7759 5 14.1999 5.17559 14.5124 5.48816C14.825 5.80072 15.0006 6.22464 15.0006 6.66667V13.3333"
				stroke="currentColor"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M11.6672 7.5L9.16724 5L11.6672 2.5"
				stroke="currentColor"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	)
}
