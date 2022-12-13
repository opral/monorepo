import type { ClientSideEnv } from "@env";
import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import IconGithub from "~icons/cib/github";
import { githubAuthUrl } from "./logic.js";

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
	githubAppClientId: ClientSideEnv["VITE_GITHUB_APP_CLIENT_ID"];
	onClickOnSignInButton: () => void;
}) {
	return (
		<sl-dialog ref={props.ref}>
			<h3 slot="label">Sign in</h3>
			<p>To conduct changes, you must sign in with a GitHub account.</p>

			<sl-button
				slot="footer"
				prop:variant="primary"
				prop:target="_blank"
				prop:href={githubAuthUrl(props.githubAppClientId)}
				onClick={props.onClickOnSignInButton}
			>
				<IconGithub slot="prefix"></IconGithub>
				Sign in with GitHub
			</sl-button>
		</sl-dialog>
	);
}
