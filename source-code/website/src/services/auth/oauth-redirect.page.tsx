import { Match, onMount, Switch } from "solid-js";
import {
	useLocalStorage,
	type LocalStorageSchema,
} from "@src/services/local-storage/index.js";
import { Layout } from "@src/pages/Layout.jsx";
import MaterialSymbolsCheckCircleRounded from "~icons/material-symbols/check-circle-rounded";
import MaterialSymbolsArrowBackRounded from "~icons/material-symbols/arrow-back-rounded";

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
		if (props.data) {
			setLocalStorage("user", props.data.user);
		}
	});

	return (
		<Layout>
			<Switch>
				<Match when={props.data}>
					<div class="items-center justify-center flex grow">
						<div class="flex flex-col border rounded-lg border-outline p-10 max-w-sm">
							<MaterialSymbolsCheckCircleRounded class="text-success w-16 h-16 self-center"></MaterialSymbolsCheckCircleRounded>
							<h2 class="text-xl font-medium self-center pt-2">
								Successfully logged in
							</h2>
							<p class="self-center">You can close this window.</p>
							<sl-button
								class="pt-6"
								prop:variant="primary"
								onClick={() => {
									// this pattern will break if the last opened window is not the login window
									window.close();
								}}
							>
								<MaterialSymbolsArrowBackRounded slot="prefix"></MaterialSymbolsArrowBackRounded>
								Return to app
							</sl-button>
						</div>
					</div>
				</Match>
				<Match when={props.error}>
					<div class="text-on-danger-container p-2 bg-danger-container">
						<p>An error occured during login. Please report the bug.</p>
						<p>{props.error}</p>
					</div>
				</Match>
			</Switch>
		</Layout>
	);
}
