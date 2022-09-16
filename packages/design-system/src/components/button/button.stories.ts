// importing the compiled component
import "../../../dist/components/button/button.js";
import { html } from "lit-html";
import type { PropertiesOf } from "../types/propertiesOf.js";
import type { Button } from "./button.js";

export default {
	title: "Button",
};

//👇 We create a “template” of how args map to rendering
const Template = (props: PropertiesOf<Button>) => {
	return html` <in-button variant=${props.variant} disabled=${props.disabled}>
		dddddd
	</in-button>`;
};

export const Primary: { args: PropertiesOf<Button> } = Template.bind({});
Primary.args = {
	disabled: false,
	variant: "secondary",
};
