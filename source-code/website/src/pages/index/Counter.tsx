import { createSignal } from "solid-js";

export function Counter() {
	const [count, setCount] = createSignal(0);
	return (
		<div>
			current count is {count()}
			<button onClick={() => setCount(count() + 1)}>increase count</button>
		</div>
	);
}
