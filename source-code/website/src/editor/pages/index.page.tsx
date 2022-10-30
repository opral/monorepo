import { Button } from "@src/components/Button.jsx";
import type { PageHead } from "@src/renderer/types.js";

export const Head: PageHead = () => {
	return {
		title: "Editor",
		description: "Editor",
	};
};

export function Page() {
	return (
		<>
			<Button variant="fill" color="primary">
				Hi
			</Button>
			<Button variant="fill" color="secondary" disabled>
				Hi
			</Button>
			<a href="/editor/git/452" class="font-medium underline">
				git
			</a>
		</>
	);
}
