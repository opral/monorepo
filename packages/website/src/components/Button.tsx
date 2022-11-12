import type { DesignSystemColors } from "../../tailwind.config.cjs";
import type { JSX } from "solid-js";

type ButtonArgs = {
	color: DesignSystemColors[number];
	variant: "fill";
};

export function Button(
	props: ButtonArgs &
		JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
			children?: JSX.Element;
		}
) {
	return <button class={buttonStyle(props)} {...props}></button>;
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
export function buttonStyle(args: ButtonArgs) {
	return baseStyle + " " + variantStyle(args);
}

/** the base style of the button that is consistent across all buttons, regardless of the variant */
const baseStyle =
	"rounded py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

function variantStyle(args: ButtonArgs): string {
	switch (args.variant) {
		case "fill":
			return `disabled:bg-disabled-container disabled:text-disabled-content bg-${args.color} text-on-${args.color} hover:bg-hover-${args.color} active:bg-active-${args.color}`;
		default:
			throw Error(`Button variant ${args.variant} does not exist.`);
	}
}
