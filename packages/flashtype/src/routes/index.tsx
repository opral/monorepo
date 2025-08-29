import { createFileRoute } from "@tanstack/react-router";
import { TipTapEditor } from "@/components/tiptap-editor";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<main style={{ height: "100%", padding: "0 16px" }}>
			<TipTapEditor />
		</main>
	);
}
