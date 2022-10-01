// importing the compiled component
import "../../../dist/components/button/index.js";
import { html } from "lit-html";
import type { PropertiesOf } from "../types/propertiesOf.js";
import type { Alert } from "./index.js";
// @ts-ignore
import Documentation from "./documentation.mdx";

export default {
	title: "alert",
	parameters: {
		docs: {
			page: Documentation,
		},
	},
};

const Template = (props: PropertiesOf<Alert>) => {
	return html` <in-alert class=${props.class}>TODO</in-alert> `;
};

export const Default: { args: PropertiesOf<Alert> } = Template.bind({});
Default.args = {
	class: "alert-error",
};
