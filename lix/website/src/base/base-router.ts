import { html } from "lit"
import { customElement } from "lit/decorators.js"
import { BaseElement } from "./base-element"
import { Router } from "@lit-labs/router"

import "./../pages/home"

@customElement("base-router")
export class BaseRouter extends BaseElement {
	private _router = new Router(this, [
		{ path: "/", render: () => html`<home-page></home-page>` },
		{ path: "/sdk", render: () => html`<h1>SDK</h1>` },
	])

	render() {
		return html`
			<header>...</header>
			<main>${this._router.outlet()}</main>
			<footer>...</footer>
		`
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"base-router": BaseRouter
	}
}
