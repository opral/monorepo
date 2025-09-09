import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { TipTapEditor } from "@/components/editor/tip-tap-editor";
import { useKeyValue } from "@/key-value/use-key-value";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const [activeFileId] = useKeyValue("flashtype_active_file_id");

	return (
		<main style={{ padding: "0 16px" }}>
			{activeFileId ? (
				<Suspense
					fallback={
						<div style={{ padding: 12, opacity: 0.7 }}>Loading editor…</div>
					}
				>
					<TipTapEditor />
				</Suspense>
			) : (
				<div style={{ padding: 12, opacity: 0.7 }}>
					Select a file to start editing.
				</div>
			)}
		</main>
	);
}
