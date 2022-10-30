import type { DesignSystemColors } from "../../tailwind.config.cjs";
import type { JSX } from "solid-js";

export function Button(
	props: {
		color: DesignSystemColors[number];
		variant: keyof typeof variants;
		children: JSX.Element;
	} & JSX.ButtonHTMLAttributes<HTMLButtonElement>
) {
	const variant = variants[props.variant];
	return (
		<button
			classList={{
				[base]: true,
				[variant["disabled"]]: props.disabled,
				[variant[props.color]]:
					// props.disabled can be undefined or set to false
					props.disabled === false || props.disabled === undefined,
			}}
			{...props}
		/>
	);
}

// base style of a button
const base =
	"rounded py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

// variants with nested color patterns
const variants: Record<
	"fill",
	Record<DesignSystemColors[number] | "disabled", string>
> = {
	fill: {
		primary:
			"bg-primary text-on-primary hover:bg-hover-primary focus-visible:bg-primary/50 active:bg-active-primary",
		secondary:
			"bg-secondary text-on-secondary hover:bg-hover-secondary focus-visible:bg-secondary/50 active:bg-active-secondary",
		tertiary:
			"bg-tertiary text-on-tertiary hover:bg-hover-tertiary focus-visible:bg-tertiary/50 active:bg-active-tertiary",
		error:
			"bg-error text-on-error hover:bg-hover-tertiary focus-visible:bg-tertiary/50 active:bg-active-tertiary",
		disabled: "bg-disabled-container text-disabled-content ",
	},
};
