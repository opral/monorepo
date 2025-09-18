import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { TipTapEditor } from "@/components/editor/tip-tap-editor";
import { useKeyValue } from "@/key-value/use-key-value";
import { DiffView } from "@/components/diff-view";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const [activeFileId] = useKeyValue("flashtype_active_file_id");
	const [diffOpen] = useKeyValue("flashtype_diff_open", {
		defaultVersionId: "global",
		untracked: true,
	});

	return (
		<main style={{ padding: "0 16px" }}>
			{activeFileId ? (
				<Suspense
					fallback={
						<div style={{ padding: 12, opacity: 0.7 }}>Loading editor…</div>
					}
				>
					{diffOpen ? <DiffView /> : <TipTapEditor />}
				</Suspense>
			) : (
				<div style={{ padding: 12, opacity: 0.7 }}>
					Select a file to start editing.
				</div>
			)}
		</main>
	);
}
