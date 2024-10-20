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
export function PushPermissionDialog(props: {
  /** forwarding the ref */
  ref: SlDialog;
  onClickPushPermissionButton: () => void;
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
        <h3 slot="label">Add permissions</h3>
        <p>
          To push changes, you need to add the repository to your permissions of
          the github app.
        </p>
        <sl-button
          slot="footer"
          prop:variant="primary"
          onClick={() => {
            props.onClickPushPermissionButton();
          }}
        >
          {/* @ts-ignore */}
          <IconGithub slot="prefix" />
          Add permissions on GitHub
        </sl-button>
      </Show>
    </sl-dialog>
  );
}
