import { useEffect, useState } from "react";
import { lix, prosemirrorFile } from "../state";
import { beforeAfterOfFile } from "@lix-js/sdk";
import { Node, DOMSerializer } from "prosemirror-model";
import { schema } from "../prosemirror/schema";
import { renderUniversalDiffElement } from "@lix-js/universal-diff";
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

				const { before, after } = await beforeAfterOfFile({
					lix,
					changeSetBefore: beforeCsId ? { id: beforeCsId } : undefined,
					changeSetAfter: afterCsId ? { id: afterCsId } : undefined,
					file: { id: prosemirrorFile.id },
				});

				let beforeHtml: string | undefined;
				let afterHtml: string | undefined;

				for (const doc of [before, after]) {
					if (doc) {
						const docData = JSON.parse(new TextDecoder().decode(doc.data));
						const node = Node.fromJSON(schema, docData);
						const serializer = DOMSerializer.fromSchema(schema);
						const htmlFragment = serializer.serializeFragment(node.content);
						const tempDiv = document.createElement("div");
						tempDiv.appendChild(htmlFragment);
						const html = tempDiv.innerHTML;
						if (doc === before) {
							beforeHtml = html;
						} else {
							afterHtml = html;
						}
					}
				}

				const diffHtml = renderUniversalDiffElement({
					beforeHtml: beforeHtml ?? "",
					afterHtml: afterHtml ?? "",
				});

				console.log("Before HTML:", beforeHtml);
				console.log("After HTML:", afterHtml);
				console.log("Diff HTML:", diffHtml);

				setDiffHtml(diffHtml.outerHTML);
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
