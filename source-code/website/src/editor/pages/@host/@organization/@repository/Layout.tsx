import { Icon } from "@iconify-icon/solid";
import { createMemo, createUniqueId, For, JSXElement } from "solid-js";
import { routeParams } from "./state.js";
import * as tabs from "@zag-js/tabs";
import * as checkbox from "@zag-js/checkbox";
import { normalizeProps, useMachine } from "@zag-js/solid";

export function Layout(props: { children: JSXElement }) {
	return (
		<div class="max-w-screen-lg p-4 mx-auto">
			<Breadcrumbs></Breadcrumbs>
			<Tabs></Tabs>
			<Checkbox></Checkbox>
			{props.children}
		</div>
	);
}

function Breadcrumbs() {
	return (
		<div class="flex flex-row items-center space-x-2 text-lg font-medium">
			<Icon icon="ri:git-repository-line"></Icon>
			<h3>{routeParams().organization}</h3>
			<h3>/</h3>
			<h3>{routeParams().repository}</h3>
		</div>
	);
}
