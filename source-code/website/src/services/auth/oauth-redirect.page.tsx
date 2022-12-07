import { Match, onMount, Switch } from "solid-js";
import { navigate } from "vite-plugin-ssr/client/router";
import {
	useLocalStorage,
	type LocalStorageSchema,
} from "@src/services/local-storage/index.js";

export type PageProps = {
	error?: string;
	data?: {
		user: NonNullable<LocalStorageSchema["user"]>;
	};
};

/**
 * The GitHub web application flow redirects to this page.
 *
 * The page contains a `code` that can be exchanged for an access token.
 * The access token
 *
 * Read more https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
 */
export function Page(props: PageProps) {
	const [localStorage, setLocalStorage] = useLocalStorage();

	onMount(() => {
		if (props.error) {
			alert(props.error);
		} else if (props.data) {
			setLocalStorage("user", props.data.user);
			navigate("/");
		}
	});

	return (
		<Switch>
			<Match when={props.data}>
				<p>success, redirecting ...</p>
			</Match>
			<Match when={props.error}>
				<div class="text-on-danger-container p-2 bg-danger-container">
					<p>An error occured during login. Please report the bug.</p>
					<p>{props.error}</p>
				</div>
			</Match>
		</Switch>
	);
}
