import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import { createSignal, Show } from "solid-js";
import IconGithub from "~icons/cib/github";

/**
 * A dialog that prompts the user to add missing permissions on GitHub.
 *
 * @example
 * 	let PermissionDialog: SlDialog | undefined;
 *
 * 	function onX() {
 * 		PermissionDialog?.show();
 * 	}
 */
export function ForkPermissionDialog(props: {
	/** forwarding the ref */
	ref: SlDialog;
	onClickForkPermissionButton: () => void;
}) {
	const [isShown, setIsShown] = createSignal(false);

	return (
		<sl-dialog
			ref={props.ref}
			on:sl-show={() => setIsShown(true)}
			on:sl-after-hide={() => setIsShown(false)}
		>
			<Show when={isShown()}>
				<h3 slot="label">Add permissions</h3>
				<p>
					Creating a fork requires app permissions to "all repositories" on
					github.
				</p>

				{/*<p>Alternatively you can create a manual fork on github</p>
				<a class="self-center" href="/documentation" target="_blank">
					<sl-button prop:variant="text">
						Manually create fork on github
						<MaterialSymbolsArrowOutwardRounded slot="suffix" />
					</sl-button>
				</a> */}

				<sl-button
					slot="footer"
					prop:variant="primary"
					onClick={() => {
						props.onClickForkPermissionButton();
					}}
				>
					{/* @ts-ignore */}
					<IconGithub slot="prefix" />
					Enable "all repo" access on GitHub
				</sl-button>
			</Show>
		</sl-dialog>
	);
}
