import React, { JSX, useEffect, useState } from "react";
import { createDocDiff, type DiffNode } from "@lix-js/plugin-prosemirror";
import { lix } from "../state";
import { switchVersion } from "@lix-js/sdk";

interface DiffViewProps {
	mainVersionId: string;
	proposalVersionId: string;
}

const DiffView: React.FC<DiffViewProps> = ({
	mainVersionId,
	proposalVersionId,
}) => {
	const [diffDoc, setDiffDoc] = useState<DiffNode | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				setLoading(true);

				// Get the main and proposal documents
				// workaround for https://github.com/opral/lix-sdk/issues/252
				let mainDoc: { data: Uint8Array } | null = null;
				let proposalDoc: { data: Uint8Array } | null = null;

				await lix.db.transaction().execute(async (trx) => {
					await switchVersion({
						lix: { ...lix, db: trx },
						to: { id: mainVersionId },
					});
					mainDoc = await trx
						.selectFrom("file")
						.where("path", "=", "/prosemirror.json")
						.select("data")
						.executeTakeFirstOrThrow();

					await switchVersion({
						lix: { ...lix, db: trx },
						to: { id: proposalVersionId },
					});

					proposalDoc = await trx
						.selectFrom("file")
						.where("path", "=", "/prosemirror.json")
						.select("data")
						.executeTakeFirstOrThrow();
				});

				if (!mainDoc || !proposalDoc) {
					throw new Error("Failed to fetch one or both documents");
				}

				// Extract the ProseMirror documents from each version
				const mainDocData = JSON.parse(new TextDecoder().decode(mainDoc.data));
				const proposalDocData = JSON.parse(
					new TextDecoder().decode(proposalDoc.data),
				);

				// Create a diff between the two documents
				const diff = createDocDiff(mainDocData, proposalDocData);

				console.log({ diff, mainDocData, proposalDocData });

				setDiffDoc(diff);
			} catch (err) {
				console.error("Error loading diff documents:", err);
				setError(
					`Failed to load documents: ${err instanceof Error ? err.message : "Unknown error"}`,
				);
			} finally {
				setLoading(false);
			}
		};

		fetchDocuments();
	}, [mainVersionId, proposalVersionId]);

	// Render nodes from the diffDoc
	const renderNode = (node: DiffNode) => {
		// Base classes for styling
		let className = `diff-node diff-${node.attrs?.diff || "normal"}`;

		switch (node.type) {
			case "doc":
				return (
					<div className={`${className} diff-doc`}>
						{node.content?.map((child, index) => (
							<React.Fragment key={index}>{renderNode(child)}</React.Fragment>
						))}
					</div>
				);

			case "paragraph":
				return (
					<p className={className}>
						{node.content?.map((child, index) => (
							<React.Fragment key={index}>{renderNode(child)}</React.Fragment>
						))}
					</p>
				);

			case "heading":
				const level = node.attrs?.level || 1;
				const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
				return (
					<HeadingTag className={className}>
						{node.content?.map((child, index) => (
							<React.Fragment key={index}>{renderNode(child)}</React.Fragment>
						))}
					</HeadingTag>
				);

			case "text":
				// For created (added) text, show with green
				if (node.attrs?.diff === "created") {
					return (
						<span className={`${className} diff-created-text`}>
							{node.text}
						</span>
					);
				}
				// For deleted text, show with red and strikethrough
				else if (node.attrs?.diff === "deleted") {
					return (
						<span className={`${className} diff-deleted-text`}>
							{node.text}
						</span>
					);
				}
				// For updated text, use inline diffing
				else if (node.attrs?.diff === "updated") {
					// In a real implementation, we would use a text diffing algorithm here
					// to highlight only the specific parts that changed, but for now
					// we just highlight the entire text
					return (
						<span className={`${className} diff-updated-text`}>
							{node.text}
						</span>
					);
				}
				// For unmodified text, show normally
				else {
					return <span className={className}>{node.text}</span>;
				}

			default:
				return (
					<div className={className}>Unsupported node type: {node.type}</div>
				);
		}
	};

	if (loading) {
		return <div className="diff-loading">Loading diff view...</div>;
	}

	if (error) {
		return <div className="diff-error">Error: {error}</div>;
	}

	if (!diffDoc) {
		return (
			<div className="diff-empty">
				No differences found or documents couldn't be compared.
			</div>
		);
	}

	return (
		<div className="diff-container">
			<div className="diff-legend">
				<div className="diff-legend-item">
					<span className="diff-legend-color diff-created-text"></span> Added
					content
				</div>
				<div className="diff-legend-item">
					<span className="diff-legend-color diff-deleted-text"></span> Deleted
					content
				</div>
				<div className="diff-legend-item">
					<span className="diff-legend-color diff-updated-text"></span> Updated
					content
				</div>
			</div>

			<div className="diff-content">{renderNode(diffDoc)}</div>
		</div>
	);
};

export default DiffView;
