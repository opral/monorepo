import { useEffect, useState } from "react";
import { Node, DOMSerializer } from "prosemirror-model";
import { schema } from "../prosemirror/schema";
import { renderHtmlDiff } from "@lix-js/html-diff";
import "@lix-js/html-diff/default.css";
import { useKeyValue } from "../hooks/useKeyValue";
import { useLix, useQueryTakeFirstOrThrow } from "@lix-js/react-utils";
import { selectFileId } from "../queries";

export function DiffView() {
	const [diffView] = useKeyValue<{
		beforeCsId?: string;
		afterCsId?: string;
	}>("diffView", { versionId: "global", untracked: true });
	const lix = useLix();
	const fileId = useQueryTakeFirstOrThrow(selectFileId);
	const [diffHtml, setDiffHtml] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!diffView?.beforeCsId || !diffView?.afterCsId) {
			setError("No before or after diff is available.");
			setLoading(false);
			return;
		}

		setError(null);

		const renderDiff = async () => {
			setLoading(true);
			try {
				const [before, after] = await Promise.all([
					lix.db
						.selectFrom("file_history")
						.where("lixcol_root_change_set_id", "=", diffView.beforeCsId)
						.where("id", "=", fileId.id)
						.where("lixcol_depth", "=", 0)
						.selectAll()
						.executeTakeFirst(),
					lix.db
						.selectFrom("file_history")
						.where("lixcol_root_change_set_id", "=", diffView.afterCsId)
						.where("id", "=", fileId.id)
						.where("lixcol_depth", "=", 0)
						.selectAll()
						.executeTakeFirst(),
				]);

				const diffHtml = renderHtmlDiff({
					beforeHtml: renderDocToHtml(before) ?? "",
					afterHtml: renderDocToHtml(after) ?? "",
				});
				setDiffHtml(diffHtml);
			} catch (error) {
				console.error("Error rendering diff:", error);
				setDiffHtml(null);
			} finally {
				setLoading(false);
			}
		};

		renderDiff();
	}, [diffView?.beforeCsId, diffView?.afterCsId, lix, fileId.id]);

	if (loading) {
		return <div className="diff-loading">Loading diff view...</div>;
	}

	if (error) {
		return <div className="diff-error">{error}</div>;
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
