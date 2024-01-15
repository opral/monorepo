import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js"
import { createSignal, Show } from "solid-js"
import IconGithub from "~icons/cib/github"

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
export const [signInModalOpen, setSignInModalOpen] = createSignal(false)

export function SignInDialog(props: {
	/** forwarding the ref */
	ref: SlDialog
	onClickOnSignInButton: () => void
}) {
	// web component slots load eagarly. applying manual conditional rendering
	// combats flickering on initial render
	return (
		<sl-dialog
			ref={props.ref}
			on:sl-show={() => setSignInModalOpen(true)}
			on:sl-after-hide={() => setSignInModalOpen(false)}
		>
			<Show when={signInModalOpen()}>
				<h3 slot="label">Sign in</h3>
				<p>To conduct changes, you must sign in with a GitHub account.</p>
				<sl-button
					slot="footer"
					prop:variant="primary"
					onClick={() => {
						props.onClickOnSignInButton()
					}}
				>
					{/* @ts-ignore */}
					<IconGithub slot="prefix" />
					Sign in with GitHub
				</sl-button>
			</Show>
		</sl-dialog>
	)
}
