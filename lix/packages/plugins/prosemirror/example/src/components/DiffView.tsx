import { useEffect, useState } from "react";
import { lix } from "../state";
import { createVersion, switchVersion } from "@lix-js/sdk";
import { Node, DOMSerializer } from "prosemirror-model";
import { schema } from "../prosemirror/schema";
import { renderUniversalDiffElement } from "@lix-js/universal-diff";
import { useKeyValue } from "../hooks/useKeyValue";
import { restoreChangeSet } from "../utilities/restoreChangeSet";

export function DiffView() {
	const [diffView] = useKeyValue<[string | undefined, string] | null>(
		"diffView",
	);
	const [diffDoc, setDiffDoc] = useState<string | null>(null);
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
				setDiffDoc(null);

				let beforeDoc: { data: Uint8Array } | null = null;
				let afterDoc: { data: Uint8Array } | null = null;

				await lix.db.transaction().execute(async (trx) => {
					const currVersion = await trx
						.selectFrom("current_version")
						.selectAll()
						.executeTakeFirstOrThrow();

					const interimVersion = await createVersion({
						lix: { ...lix, db: trx },
					});

					await switchVersion({
						lix: { ...lix, db: trx },
						to: interimVersion,
					});

					if (diffDoc?.[0]) {
						await restoreChangeSet(diffDoc[0]);

						beforeDoc = await trx
							.selectFrom("file")
							.where("path", "=", "/prosemirror.json")
							.select("data")
							.executeTakeFirstOrThrow();
					} else {
						beforeDoc = {
							data: new TextEncoder().encode(
								`{ "type": "doc", "content": [] }`,
							),
						};
					}

					if (diffDoc?.[1]) {
						await restoreChangeSet(diffDoc[1]);

						afterDoc = await trx
							.selectFrom("file")
							.where("path", "=", "/prosemirror.json")
							.select("data")
							.executeTakeFirstOrThrow();
					} else {
						afterDoc = {
							data: new TextEncoder().encode(
								`{ "type": "doc", "content": [] }`,
							),
						};
					}

					await switchVersion({
						lix: { ...lix, db: trx },
						to: currVersion,
					});
				});

				if (!beforeDoc || !afterDoc) {
					throw new Error("Failed to fetch one or both documents");
				}

				const beforeDocData = JSON.parse(
					new TextDecoder().decode((beforeDoc as any).data),
				);
				const afterDocData = JSON.parse(
					new TextDecoder().decode((afterDoc as any).data),
				);

				const beforeNode = Node.fromJSON(schema, beforeDocData);
				const afterNode = Node.fromJSON(schema, afterDocData);

				const serializer = DOMSerializer.fromSchema(schema);

				const beforeHtmlFragment = serializer.serializeFragment(
					beforeNode.content,
				);
				const afterHtmlFragment = serializer.serializeFragment(
					afterNode.content,
				);

				const tempDiv = document.createElement("div");

				tempDiv.appendChild(beforeHtmlFragment);
				const beforeHtml = tempDiv.innerHTML;

				tempDiv.innerHTML = "";
				tempDiv.appendChild(afterHtmlFragment);
				const afterHtml = tempDiv.innerHTML;

				const diffHtml = renderUniversalDiffElement({
					beforeHtml: beforeHtml,
					afterHtml: afterHtml,
				});

				console.log("Before HTML:", beforeHtml);
				console.log("After HTML:", afterHtml);
				console.log("Diff HTML:", diffHtml);

				setDiffDoc(diffHtml.outerHTML);
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

	if (!diffDoc) {
		return (
			<div className="diff-empty">
				No differences generated or documents couldn't be compared.
			</div>
		);
	}

	return <div dangerouslySetInnerHTML={{ __html: diffDoc }} />;
}
