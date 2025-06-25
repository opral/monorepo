import { useEffect, useState } from "react";
import { lix, prosemirrorFile } from "../state";
import { Node, DOMSerializer } from "prosemirror-model";
import { schema } from "../prosemirror/schema";
import { renderUniversalDiff } from "@lix-js/universal-diff";
import "@lix-js/universal-diff/default.css";
import { useKeyValue } from "../hooks/useKeyValue";

export function DiffView() {
	const [diffView] = useKeyValue<{
		beforeCsId?: string;
		afterCsId?: string;
	} | null>("diffView");
	const [diffHtml, setDiffHtml] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				if (!diffView) {
					return;
				}

				setLoading(true);
				setError(null);
				setDiffHtml(null);

				const { beforeCsId, afterCsId } = diffView;

				const before = await lix.db
					.selectFrom("file_history")
					.where("lixcol_change_set_id", "=", beforeCsId)
					.where("id", "=", prosemirrorFile.id)
					.where("lixcol_depth", "=", 0)
					.selectAll()
					.executeTakeFirst();

				const after = await lix.db
					.selectFrom("file_history")
					.where("lixcol_change_set_id", "=", afterCsId)
					.where("id", "=", prosemirrorFile.id)
					.where("lixcol_depth", "=", 0)
					.selectAll()
					.executeTakeFirst();

				const diffHtml = renderUniversalDiff({
					beforeHtml: renderDocToHtml(before) ?? "",
					afterHtml: renderDocToHtml(after) ?? "",
				});

				setDiffHtml(diffHtml);
			} catch (err) {
				console.error("Error loading or processing diff documents:", err);
				setError(
					`Failed to load/process documents: ${err instanceof Error ? err.message : "Unknown error"}`,
				);
			} finally {
				setLoading(false);
			}
		};

		fetchDocuments();
	}, [diffView]);

	console.log("Rendering DiffView", {
		diffView,
		diffHtml,
		loading,
		error,
	});

	if (loading) {
		return <div className="diff-loading">Loading diff view...</div>;
	}

	if (error) {
		return <div className="diff-error">Error: {error}</div>;
	}

	if (!diffHtml) {
		return (
			<div className="diff-empty">
				No differences generated or documents couldn't be compared.
			</div>
		);
	}

	return <div dangerouslySetInnerHTML={{ __html: diffHtml }} />;
}

function renderDocToHtml(doc: any) {
	if (!doc || !doc.data) {
		return undefined;
	}
	const docData = JSON.parse(new TextDecoder().decode(doc.data));
	const node = Node.fromJSON(schema, docData);
	const serializer = DOMSerializer.fromSchema(schema);
	const htmlFragment = serializer.serializeFragment(node.content);
	const tempDiv = document.createElement("div");
	tempDiv.appendChild(htmlFragment);
	return tempDiv.innerHTML;
}