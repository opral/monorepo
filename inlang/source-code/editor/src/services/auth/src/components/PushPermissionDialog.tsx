import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js"
import { createSignal, Show } from "solid-js"
import IconGithub from "~icons/cib/github"

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
export function PushPermissionDialog(props: {
	/** forwarding the ref */
	ref: SlDialog
	onClickPushPermissionButton: () => void
	requestPermission: boolean
}) {
	// web component slots load eagarly. applying manual conditional rendering
	// combats flickering on initial render
	const [isShown, setIsShown] = createSignal(false)

	return (
		<sl-dialog
			ref={props.ref}
			on:sl-show={() => setIsShown(true)}
			on:sl-after-hide={() => setIsShown(false)}
			on:sl-request-close={(event: any) =>
				event.detail.source === "overlay" && props.requestPermission && event.preventDefault()
			}
		>
			<Show when={isShown()}>
				<h3 slot="label">{props.requestPermission ? "Request" : "Add"} permissions</h3>
				<p>
					{props.requestPermission
						? "To push changes, you need to request the repository owner to add the repository to the permissions of the GitHub app."
						: "To push changes, you need to add the repository to your permissions of the GitHub app."}
				</p>
				<sl-button
					slot="footer"
					prop:variant="primary"
					onClick={() => {
						props.onClickPushPermissionButton()
					}}
				>
					{props.requestPermission ? "Request" : "Add"} permissions on GitHub
					{/* @ts-ignore */}
					<IconGithub slot="suffix" class="-ml-1" />
				</sl-button>
			</Show>
		</sl-dialog>
	)
}
