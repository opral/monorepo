import type { ClientSideEnv } from "@env";
import IconGithub from "~icons/cib/github";

/**
 * A dialog that prompts the user to login with GitHub.
 */
export function LoginDialog(props: {
	githubAppClientId: ClientSideEnv["VITE_GITHUB_APP_CLIENT_ID"];
}) {
	return (
		<sl-dialog prop:open={true}>
			<sl-button
				prop:target="_blank"
				prop:href={`https://github.com/login/oauth/authorize?client_id=${props.githubAppClientId}`}
			>
				<IconGithub slot="prefix"></IconGithub>
				Login with GitHub
			</sl-button>
		</sl-dialog>
	);
}
