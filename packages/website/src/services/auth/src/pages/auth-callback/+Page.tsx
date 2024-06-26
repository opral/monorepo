import { onMount } from "solid-js"
import MaterialSymbolsCheckCircleRounded from "~icons/material-symbols/check-circle-rounded"

/**
 * The GitHub web application flow redirects to this page.
 *
 * The page contains a `code` that can be exchanged for an access token.
 * The access token
 *
 * Read more https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
 */
export default function Page() {
	onMount(() => {
		// FIXME: racecondition: if window closes too early local storage is set to remove the user somewhere and user is shown logged out when coming back to the editor
		// this bug existed before and should be revisited seperately as it requires probably more involved refactor of the localstorageprovider
		setTimeout(() => window.close(), 1000)
	})

	return (
		<div class="h-screen flex justify-center items-center">
			<div class="items-center justify-center flex grow">
				<div class="flex flex-col border rounded-lg border-outline p-10 max-w-sm">
					<MaterialSymbolsCheckCircleRounded class="text-success w-16 h-16 self-center" />
					<h2 class="text-xl font-medium self-center pt-2">Successfully updated</h2>
					<p class="self-center">You can close this window.</p>
				</div>
			</div>
		</div>
	)
}
