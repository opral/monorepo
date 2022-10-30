import { Counter } from "./Counter.js";

export const documentProps = {
	title: "Lulatsch",
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
