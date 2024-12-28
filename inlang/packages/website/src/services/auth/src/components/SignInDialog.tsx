import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import { createSignal, Show } from "solid-js";
import IconGithub from "~icons/cib/github";

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
	ref: SlDialog;
	onClickOnSignInButton: () => void;
}) {
	// web component slots load eagarly. applying manual conditional rendering
	// combats flickering on initial render
	const [isShown, setIsShown] = createSignal(false);

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
						props.onClickOnSignInButton();
					}}
				>
					{/* @ts-ignore */}
					<IconGithub slot="prefix" />
					Sign in with GitHub
				</sl-button>
			</Show>
		</sl-dialog>
	);
}
