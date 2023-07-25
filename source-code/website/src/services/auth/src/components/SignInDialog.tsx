import type { AllEnvVariables } from "@inlang/env-variables"
import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js"
import { createSignal, Show } from "solid-js"
import IconGithub from "~icons/cib/github"
import { githubAuthUrl } from "../implementation.js"

/**
 * A dialog that prompts the user to login with GitHub.
 *
 * @example
 * 	let signInDialog: SlDialog | undefined;
 *
 * 	function onX() {
 * 		signInDialog?.show();
 * 	}
 */
export function SignInDialog(props: {
	/** forwarding the ref */
	ref: SlDialog
	githubAppClientId: AllEnvVariables["PUBLIC_GITHUB_APP_CLIENT_ID"]
	onClickOnSignInButton: () => void
}) {
	// web component slots load eagarly. applying manual conditional rendering
	// combats flickering on initial render
	const [isShown, setIsShown] = createSignal(false)
	return (
		<sl-dialog
			ref={props.ref}
			on:sl-show={() => setIsShown(true)}
			on:sl-after-hide={() => setIsShown(false)}
		>
			<Show when={isShown()}>
				<h3 slot="label">Sign in</h3>
				<p>To conduct changes, you must sign in with a GitHub account.</p>
				<sl-button
					slot="footer"
					prop:variant="primary"
					onClick={() => {
						props.onClickOnSignInButton()
						window.open(githubAuthUrl(props.githubAppClientId), "_blank")
					}}
				>
					<IconGithub slot="prefix" />
					Sign in with GitHub
				</sl-button>
			</Show>
		</sl-dialog>
	)
}
