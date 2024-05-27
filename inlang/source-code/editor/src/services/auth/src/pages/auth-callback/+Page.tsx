import { createEffect, createResource, Match, Switch } from "solid-js"
import { getAuthClient } from "@lix-js/client"
import MaterialSymbolsCheckCircleRounded from "~icons/material-symbols/check-circle-rounded"
import MaterialSymbolsArrowBackRounded from "~icons/material-symbols/arrow-back-rounded"
import { publicEnv } from "@inlang/env-variables"
import { useLocalStorage } from "#src/services/local-storage/index.js"

const browserAuth = getAuthClient({
	gitHubProxyBaseUrl: publicEnv.PUBLIC_GIT_PROXY_BASE_URL,
	githubAppName: publicEnv.PUBLIC_LIX_GITHUB_APP_NAME,
	githubAppClientId: publicEnv.PUBLIC_LIX_GITHUB_APP_CLIENT_ID,
})

/**
 * The GitHub web application flow redirects to this page.
 *
 * The page contains a `code` that can be exchanged for an access token.
 * The access token
 *
 * Read more https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
 */
export default function Page() {
	const [userInfo] = createResource(browserAuth.getUser)
	const [localStorage] = useLocalStorage()

	createEffect(() => {
		if (localStorage.user?.isLoggedIn && localStorage.user?.username) {
			setTimeout(() => window.close(), 100)
		}
	})

	return (
		<div class="h-screen flex justify-center items-center">
			<Switch>
				<Match when={userInfo.loading}>
					<p>loading...</p>
				</Match>
				<Match when={userInfo.error}>
					<div class="text-on-danger-container p-2 bg-danger-container">
						<p>An error occured during login. Please report the bug.</p>
						<p>{userInfo.error}</p>
					</div>
				</Match>
				<Match when={userInfo()}>
					<div class="items-center justify-center flex grow">
						<div class="flex flex-col border rounded-lg border-outline p-10 max-w-sm">
							<MaterialSymbolsCheckCircleRounded class="text-success w-16 h-16 self-center" />
							<h2 class="text-xl font-medium self-center pt-2">Successfully logged in</h2>
							<p class="self-center">You can close this window.</p>
							<sl-button
								class="pt-6"
								prop:variant="primary"
								onClick={() => {
									// this pattern will break if the last opened window is not the login window
									window.close()
								}}
							>
								{/* @ts-ignore */}
								<MaterialSymbolsArrowBackRounded slot="prefix" />
								Return to app
							</sl-button>
						</div>
					</div>
				</Match>
			</Switch>
		</div>
	)
}
