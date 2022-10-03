import { Component, Prop, h } from "@stencil/core";

@Component({ tag: "in-button" })
export class Button {
	/**
	 * The first name
	 */
	@Prop() first: string;

	/**
	 * The middle name
	 */
	@Prop() middle: string;

	/**
	 * The last name
	 */
	@Prop() last: string;

	render() {
		return [
			<div>Hello, World! My name is</div>,
			<slot name="last-name"></slot>,
		];
	}
}
