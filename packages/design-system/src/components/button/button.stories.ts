// importing the compiled component
import "../../../dist/components/button.js";
import { html } from "lit-html";
import type { PropertiesOf } from "../types/propertiesOf.js";
import type { Button } from "./button.js";

export default {
	title: "Button",
};

//👇 We create a “template” of how args map to rendering
const Template = (props: PropertiesOf<Button>) => {
	return html`<in-button name=${props.name}></in-button>`;
};

/**
 * Lets see if this works
 */
export const Primary = Template.bind({});
