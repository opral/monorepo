import type SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import type { JSXElement } from "solid-js";
import { render } from "solid-js/web";
import type { SemanticColorTokens } from "../../tailwind.config.cjs";
import { Icon } from "./Icon.jsx";

/**
 * Creates a Banner imperatively.
 *
 * !only works client side
 *
 * @example
 *  showBanner({
 *    variant: "success",
 * 	  message: <p>you need to fork this project<p>
 * 	  children: <sl-button>sign in</sl-button>
 */

type Props = {
	variant: SemanticColorTokens[number];
	message: JSXElement;
	children: JSXElement;
};

export function Banner(props: Props) {
	let alert: SlAlert | undefined;

	return (
		<sl-alert
			prop:variant={props.variant === "info" ? "primary" : props.variant}
			ref={alert}
			prop:open={true}
		>
			<Icon name={props.variant} slot="icon"></Icon>
			<div class="flex space-x-4 items-center 	">
				<p class="grow">{props.message}</p>
				{props.children}
			</div>
		</sl-alert>
	);
}
