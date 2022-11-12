import type { JSXElement } from "solid-js";
import { Header } from "./index/Header.jsx";
import { Footer } from "./index/Footer.jsx";
// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<>
			<Header></Header>
			<div class="p-4 z-0">{props.children}</div>

			<Footer></Footer>
		</>
	);
}
