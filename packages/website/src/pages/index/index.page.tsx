import { useState } from "react";
import { DefaultLayout } from "../DefaultLayout.js";
import { Dynamic } from "@src/components/Dynamic.js";

export function Page() {
	const [count, setCount] = useState(0);
	return (
		<DefaultLayout>
			<h1>{count}</h1>
			<Dynamic color="tertiary">
				<p>with an element</p>
			</Dynamic>
			<button
				className="button button-fill-primary"
				onClick={() => setCount(count + 1)}
			>
				Increment
			</button>
			<br />
			<a href="/documentation">Documentation</a>
		</DefaultLayout>
	);
}
