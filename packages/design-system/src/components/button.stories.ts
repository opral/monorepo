import { html } from "lit-html";

/**
 * Primary UI component for user interaction
 */
export const Button = ({
	primary,
	backgroundColor = null,
	size,
	label,
	onClick,
}) => {
	const mode = primary
		? "storybook-button--primary"
		: "storybook-button--secondary";

	return html`
		<button
			type="button"
			class=${[
				"storybook-button",
				`storybook-button--${size || "medium"}`,
				mode,
			].join(" ")}
			@click=${onClick}
		>
			${label}
		</button>
	`;
};
