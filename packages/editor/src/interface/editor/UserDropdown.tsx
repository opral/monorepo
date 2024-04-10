import { onSignOut } from "#src/services/auth/index.js"
import { Show } from "solid-js"
import { showToast } from "../components/Toast.jsx"
import { posthog as telemetryBrowser } from "posthog-js"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import IconSignOut from "~icons/material-symbols/logout-rounded"

/**
 * Dropdown with user information and actions.
 */
function UserDropdown() {
	const [localStorage, setLocalStorage] = useLocalStorage()

	async function handleSignOut() {
		try {
			await onSignOut({ setLocalStorage })
			showToast({
				title: "Signed out",
				variant: "success",
			})
			// https://posthog.com/docs/integrate/client/js#reset-after-logout
			telemetryBrowser.reset()
		} catch (error) {
			showToast({
				title: "Error",
				variant: "danger",
				// @ts-ignore
				message: error?.message,
			})
		}
	}

	const loggedInUser = (
		user: typeof localStorage.user
	): { username: string; avatarUrl?: string } | false => (user?.isLoggedIn ? user : false)

	return (
		<>
			<Show when={loggedInUser(localStorage.user)}>
				{(user) => (
					<sl-dropdown prop:distance={4}>
						<div slot="trigger" class="flex items-center cursor-pointer">
							<img src={user().avatarUrl} alt="user avatar" class="w-8 h-8 rounded-full" />
						</div>
						<sl-menu>
							<div class="px-7 py-2">
								<p>Signed in as</p>
								<p class="font-medium">{user().username}</p>
							</div>
							<sl-menu-item onClick={handleSignOut}>
								<IconSignOut
									// @ts-ignore
									slot="prefix"
								/>
								Sign out
							</sl-menu-item>
						</sl-menu>
					</sl-dropdown>
				)}
			</Show>
		</>
	)
}

export default UserDropdown
