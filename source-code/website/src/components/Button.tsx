import type { DesignSystemColors } from "../../tailwind.config.cjs";
import { clsx } from "clsx";

export function Button(
	props: {
		color: DesignSystemColors[number];
		variant: keyof typeof variants;
		children: React.ReactNode;
	} & React.ButtonHTMLAttributes<HTMLButtonElement>
) {
	const variant = variants[props.variant];
	const variantColor = variant[props.color];
	return (
		<button
			className={clsx(
				base,
				// if disabled, show the disabled color variant
				// else show the variant with appplied color pattern
				props.disabled ? variant["disabled"] : variantColor
			)}
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
		disabled: "bg-disabled-container text-disabled-content",
	},
};
