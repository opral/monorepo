import { routeParams } from "./state.js";
import * as checkbox from "@zag-js/checkbox";
import { normalizeProps, useMachine } from "@zag-js/solid";
import type { JSXElement } from "solid-js";
import { Icon } from "@src/components/Icon.jsx";

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<div class="max-w-screen-lg p-4 mx-auto">
			<Breadcrumbs></Breadcrumbs>
			{/* divider */}
			<div class="h-px w-full bg-outline-variant my-2"></div>
			{props.children}
		</div>
	);
}

function Breadcrumbs() {
	return (
		<div class="flex flex-row items-center space-x-2 text-lg font-medium">
			{/* START repository icon */}
			<svg class="w-4 h-4" viewBox="0 0 16 16">
				<path
					fill="currentColor"
					fill-rule="evenodd"
					d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7a.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z"
				/>
			</svg>
			{/* END repository icon */}
			<h3>{routeParams().organization}</h3>
			<h3>/</h3>
			<h3>{routeParams().repository}</h3>
		</div>
	);
}
