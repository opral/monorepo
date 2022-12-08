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
}) {
	return (
		<sl-dialog ref={props.ref}>
			<sl-button
				slot="footer"
				prop:target="_blank"
				prop:href={githubAuthUrl(props.githubAppClientId)}
			>
				<IconGithub slot="prefix"></IconGithub>
				Login with GitHub
			</sl-button>
		</sl-dialog>
	);
}
