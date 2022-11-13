import type { DesignSystemColors } from "../../tailwind.config.cjs";
import type { JSX } from "solid-js";

type ButtonProps = {
	color: DesignSystemColors[number];
	variant: "fill";
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
	"inline-flex shrink items-center justify-center border border-transparent font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

const size = {
	xs: "px-2.5 py-1.5 text-xs rounded",
	sm: "px-3 py-2 text-sm rounded-md",
	base: "px-4 py-2 text-sm rounded-md",
	lg: "px-4 py-2 test-base rounded-md",
	xl: "px-6 py-3 text-base rounded-md md:px-8 md:py-4 md:text-lg",
};

function variantStyle(args: ButtonProps): string {
	switch (args.variant) {
		case "fill":
			return `disabled:bg-disabled-container disabled:text-disabled-content bg-${args.color} text-on-${args.color} hover:bg-hover-${args.color} active:bg-active-${args.color}`;
		default:
			throw Error(`Button variant ${args.variant} does not exist.`);
	}
}
