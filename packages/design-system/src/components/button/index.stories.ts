// importing the compiled component
import "../../../dist/components/button/index.js";
import { html } from "lit-html";
import type { PropertiesOf } from "../types/propertiesOf.js";
import type { Button } from "./index.js";

export default {
	title: "button",
};

//👇 We create a “template” of how args map to rendering
const Template = (props: PropertiesOf<Button>) => {
	return html` <in-button disabled=${props.disabled} class=${props.class}>
		Click Me
	</in-button>`;
};

export const Default: { args: PropertiesOf<Button> } = Template.bind({});
Default.args = {
	disabled: false,
	class: "button-primary",
};

export const Outline: { args: PropertiesOf<Button> } = Template.bind({});
Outline.args = {
	disabled: false,
	class: "button-outline-primary",
};
