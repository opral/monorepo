import { githubAuthUrl } from "@src/services/auth/src/implementation.js"
import { useLocalStorage } from "@src/services/local-storage/index.js"
import { ComponentProps, createEffect, createSignal, Match, Show, Switch } from "solid-js"
import IconGithub from "~icons/cib/github"
import type { ClientSideEnv } from "@env"

export const Gitfloat = () => {
	const [localStorage] = useLocalStorage()
	const [gitState, setGitState] = createSignal<"login" | "fork" | "changes" | "pullrequest">(
		"login",
	)

	createEffect(() => {
		if (localStorage.user) {
			setGitState("fork")
		} else {
			setGitState("login")
		}
		setGitState("changes")
		setGitState("pullrequest")
	})

	const data = {
		login: {
			text: "You are in preview mode",
			buttontext: "Sign in",
			icon: IconGithub,
			function: () => {
				console.log("login")
			},
		},
		fork: {
			text: "Fork for access",
			buttontext: "Fork",
			icon: IconFork,
			function: () => {
				console.log("fork")
			},
		},
		changes: {
			text: "local changes",
			buttontext: "Push",
			icon: IconPush,
			function: () => {
				console.log("push")
			},
		},
		pullrequest: {
			text: "",
			buttontext: "New pull request",
			icon: IconPullrequest,
			function: () => {
				console.log("open pull request")
			},
		},
	}

	return (
		<div class="z-30 sticky left-1/2 -translate-x-[150px] bottom-8 flex justify-start items-center w-[300px] rounded-lg bg-inverted-surface shadow-xl">
			<Show when={localStorage.user}>
				<div class="flex justify-start items-center self-stretch flex-grow-0 flex-shrink-0 relative gap-2 p-1.5 rounded-tl-lg rounded-bl-lg border-t-0 border-r border-b-0 border-l-0 border-background/10">
					<img
						src={localStorage.user?.avatarUrl}
						alt="user avatar"
						class="flex-grow-0 flex-shrink-0 w-[30px] h-[30px] rounded object-cover"
					/>
				</div>
			</Show>
			<div class="flex justify-start items-center self-stretch flex-grow relative gap-2 pl-3 pr-1.5 py-1.5">
				<p class="flex items-center gap-2 flex-grow text-xs font-medium text-left text-on-inverted-surface">
					<Show when={gitState() === "changes"}>
						<div class="flex flex-col justify-center items-center flex-grow-0 flex-shrink-0 h-5 w-5 relative gap-2 p-2 rounded bg-primary">
							<p class="flex-grow-0 flex-shrink-0 text-xs font-medium text-left text-slate-100">
								1 {/* changes */}
							</p>
						</div>
					</Show>
					{data[gitState()].text}
				</p>
				<sl-button prop:size="small" onClick={data[gitState()].function}>
					{data[gitState()].buttontext}
					<div slot="suffix">{data[gitState()].icon}</div>
				</sl-button>
			</div>
		</div>
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
				stroke="#334155"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M5.83374 6.66724V8.3339C5.83374 8.77593 6.00933 9.19985 6.3219 9.51241C6.63446 9.82497 7.05838 10.0006 7.50041 10.0006H12.5004C12.9424 10.0006 13.3664 9.82497 13.6789 9.51241C13.9915 9.19985 14.1671 8.77593 14.1671 8.3339V6.66724M10.0004 10.0006V13.3339"
				stroke="#334155"
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
				fill="#334155"
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
				stroke="#334155"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9.16724 5H13.3339C13.7759 5 14.1999 5.17559 14.5124 5.48816C14.825 5.80072 15.0006 6.22464 15.0006 6.66667V13.3333"
				stroke="#334155"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M11.6672 7.5L9.16724 5L11.6672 2.5"
				stroke="#334155"
				stroke-width="1.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	)
}
