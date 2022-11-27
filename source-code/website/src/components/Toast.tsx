import type SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.js";
import { onMount } from "solid-js";
import { render } from "solid-js/web";
import IconWarning from "~icons/material-symbols/warning-outline-rounded";
import IconInfo from "~icons/material-symbols/info-outline-rounded";
import IconSuccess from "~icons/material-symbols/check-circle-outline-rounded";
import IconDanger from "~icons/material-symbols/dangerous-outline-rounded";

/**
 * Creates a toast imperatively.
 *
 * !only works client side
 *
 * @example
 *  createToast({
 *    variant: "success",
 *    title: "Success",
 *    message: "dss",
 *  });
 */
export function createToast(props: Props) {
	// render the toast on the document body.
	// rendering instead of Portal avoids bugs that have been encountered
	return render(() => <Toast {...props}></Toast>, document.body);
}

type Props = {
	variant: "primary" | "success" | "warning" | "danger";
	title: string;
	message: string;
	/** defaults to 2000 */
	duration?: number;
};

function Toast(props: Props) {
	let alert: SlAlert | undefined;

	onMount(() => {
		alert?.toast();
	});

	const Icon = (props: any) => {
		switch (props.variant) {
			case "primary":
				return <IconInfo {...props}></IconInfo>;
			case "success":
				return <IconSuccess {...props}></IconSuccess>;
			case "warning":
				return <IconWarning {...props}></IconWarning>;
			case "danger":
				return <IconDanger {...props}></IconDanger>;
			default:
				throw Error("Icon not implemented for variant " + props.variant);
		}
	};

	return (
		<sl-alert
			ref={alert}
			prop:variant={props.variant}
			prop:closable={props.variant === "success" ? false : true}
			prop:duration={
				props.variant === "danger" ? undefined : props.duration ?? 2000
			}
		>
			<Icon slot="icon" variant={props.variant}></Icon>
			<h3 class="font-bold">{props.title}</h3>
			<p>{props.message}</p>
		</sl-alert>
	);
}
