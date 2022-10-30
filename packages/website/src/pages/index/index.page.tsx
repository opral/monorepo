import type { PageHead } from "@src/renderer/types.js";
import { Counter } from "./Counter.js";

export const Head: PageHead = () => {
	return {
		title: "inlang",
		description: "Developer-first localization infrastructure for software.",
	};
};

export function Page() {
	return (
		<>
			<h1 class="text-3xl font-bold">Welcome</h1>
			<div>
				This page is:
				<ul>
					<li>Rendered to HTML.</li>
					<li>
						Interactive. <Counter />
					</li>
				</ul>
			</div>
			<a href="/editor">editor</a>
		</>
	);
}
