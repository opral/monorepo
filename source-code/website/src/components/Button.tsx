/**
 * ---------------------------------------------------------------
 * The button is based on Material 3 buttons.
 *
 * See https://m3.material.io/components/buttons/guidelines
 * for references on how to use the buttons.
 * ---------------------------------------------------------------
 */

import type { DesignSystemColors } from "../../tailwind.config.cjs";
import type { JSX } from "solid-js";

type ButtonProps = {
	color: DesignSystemColors[number];
	variant: "fill" | "outline" | "text";
	// defaults to base. is optional to avoid merging of default props.
	size?: "xs" | "sm" | "base" | "lg" | "xl";
};

/**
 * Button component.
 */
export function Button(
	props: ButtonProps &
		JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
			children?: JSX.Element;
		}
) {
	return (
		// using classList instead of class avoids merge bugs between props.class and buttonStyle
		<button classList={{ [buttonStyle(props)]: true }} {...props}></button>
	);
}

/**
 * Button css classes.
 *
 * If you can, use the regular `<Button>` component.
 *
 * @example
 * 	<button class={buttonStyle(args)}></button>
 * 	<a class={buttonStyle()}></a>
 *
 */
export function buttonStyle(args: ButtonProps) {
	return `${baseStyle} ${size[args.size ?? "base"]} ${variantStyle(args)}`;
}

/** the base style of the button that is consistent across all buttons, regardless of the variant */
const baseStyle =
	"inline-flex shrink items-center justify-center border font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

const size = {
	xs: "px-2.5 py-1.5 text-xs rounded",
	sm: "px-3 py-1.5 text-sm rounded-md",
	base: "px-4 py-2 text-sm rounded-md",
	lg: "px-4 py-2 test-base rounded-md",
	xl: "px-6 py-3 text-base rounded-md md:px-8 md:py-4 md:text-lg",
};

function variantStyle(args: ButtonProps): string {
	switch (args.variant) {
		case "fill":
			// fill has a border to ensure same height / style as the other button variants
			return `border-${args.color} bg-${args.color} hover:border-hover-${args.color} text-on-${args.color} hover:bg-hover-${args.color} hover:border-hover-${args.color} active:bg-active-${args.color} active:border-active-${args.color} disabled:bg-disabled-container disabled:text-disabled-content disabled:border-disabled-container`;
		case "outline":
			return `border-outline text-${args.color} enabled:hover:border-hover-${args.color} hover:text-on-${args.color} enabled:hover:bg-hover-${args.color} enabled:hover:border-hover-${args.color} enabled:active:bg-active-${args.color} enabled:active:border-active-${args.color} disabled:border-on-surface/12 disabled:text-on-surface/30`;
		default:
			throw Error(`Button variant ${args.variant} does not exist.`);
	}
}
