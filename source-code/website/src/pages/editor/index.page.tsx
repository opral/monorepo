import type { PageHead } from "@src/renderer/types.js";
import { Layout as RootLayout } from "../Layout.jsx";

export const Head: PageHead = (props) => ({
	title: "inlang Editor",
	description:
		"Manage translations and localization processes with inlang's editor.",
});

export function Page() {
	return (
		<RootLayout>
			<p>open a repository</p>
			<a class="link link-primary" href="/editor/github.com/inlang/demo">
				example
			</a>
		</RootLayout>
	);
}
