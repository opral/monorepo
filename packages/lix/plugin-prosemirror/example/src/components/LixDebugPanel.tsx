import { Change } from "@lix-js/sdk";
import { toUserTime } from "../utilities/timeUtils";
import { selectChanges, selectProsemirrorDoc } from "../queries";
import { schema } from "../prosemirror/schema";
import { useState, useRef } from "react";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";

const LixDebugPanel = () => {
	const lix = useLix();
	const changes = useQuery(selectChanges);
	const currentDoc = useQueryTakeFirst(selectProsemirrorDoc);
	const jsonDoc = JSON.parse(
		new TextDecoder().decode(
			currentDoc?.data ?? new TextEncoder().encode("{}"),
		),
	);

	if (changes === null) {
		return <p>Loading...</p>;
	}

	const handleDownloadLixDb = async () => {
		try {
			// Get the Lix database blob using the correct API
			const blob = await lix.toBlob();

			// Create a download link
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `lix-prosemirror-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.lix`;
			document.body.appendChild(a);
			a.click();

			// Clean up
			setTimeout(() => {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}, 0);
		} catch (error) {
			console.error("Error downloading Lix database:", error);
			alert("Error downloading Lix database: " + (error as Error).message);
		}
	};

	const handleReset = async () => {
		if (
			!confirm(
				"Are you sure you want to reset? This will delete all data and reload the page.",
			)
		) {
			return;
		}

		try {
			// Close the Lix instance first
			await lix.close();

			// Delete the OPFS file
			const opfsRoot = await navigator.storage.getDirectory();
			await opfsRoot.removeEntry("example.lix");

			// Reload the window
			window.location.reload();
		} catch (error) {
			console.error("Error during reset:", error);
			alert("Error during reset: " + (error as Error).message);
			// Still reload even if there was an error, in case the file was partially deleted
			window.location.reload();
		}
	};

	// Function to get a readable content preview for changes
	const getContentPreview = (change: Change): string => {
		if (!change.snapshot_content) return "No content available";

		if (typeof change.snapshot_content === "object") {
			// For text nodes, show the text content
			if (change.snapshot_content.text) {
				return (
					change.snapshot_content.text.substring(0, 60) +
					(change.snapshot_content.text.length > 60 ? "..." : "")
				);
			}

			// For paragraph nodes, extract content from their children
			if (
				change.snapshot_content.content &&
				Array.isArray(change.snapshot_content.content)
			) {
				const textNodes = change.snapshot_content.content
					.filter((node: any) => node.type === "text" && node.text)
					.map((node: any) => node.text);

				if (textNodes.length > 0) {
					const combinedText = textNodes.join(" ");
					return (
						combinedText.substring(0, 60) +
						(combinedText.length > 60 ? "..." : "")
					);
				}
			}

			// For empty paragraphs or other empty nodes, just return empty string
			if (
				change.snapshot_content.type === "paragraph" &&
				(!change.snapshot_content.content ||
					change.snapshot_content.content.length === 0)
			) {
				return "";
			}

			// For other node types, if we can't extract anything meaningful
			return "";
		}

		return "";
	};

	return (
		<div className="mt-5">
			<div className="flex justify-between items-center">
				<h3 className="text-xl font-bold">Debug Tools</h3>
				<div className="flex gap-2.5">
					<ProsemirrorDocImport />
					<ProsemirrorDocExport />
					<button onClick={handleDownloadLixDb} className="btn btn-sm">
						Download Lix Blob
					</button>
					<button onClick={handleReset} className="btn btn-sm btn-error">
						Reset
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-5 mt-4">
				{/* Current Document AST */}
				<div>
					<h4 className="text-lg font-medium mb-2">Current Document AST</h4>
					<div className="border border-base-300 rounded overflow-auto">
						<pre className="p-4 whitespace-pre">
							{JSON.stringify(jsonDoc, null, 2)}
						</pre>
					</div>
				</div>

				{/* All Changes */}
				<div>
					<h4 className="text-lg font-medium mb-2">
						All Changes{" "}
						{((changes?.length ?? 0) > 0) ? `(${changes.length})` : ""}
					</h4>
					<div className="border border-base-300 rounded overflow-auto">
						{((changes?.length ?? 0) > 0) ? (
							changes.map((change) => (
								<div
									key={`change-${change?.id}`}
									className="p-2 border border-base-300"
								>
									<div className="font-normal mb-0.5">
										{toUserTime(change?.created_at)}
									</div>

									<div className="mb-0.5">
										Type: {change?.snapshot_content?.type || "Unknown"}
									</div>

									<div className="text-sm">
										{getContentPreview(change) || "No preview available"}
									</div>
								</div>
							))
						) : (
							<div className="p-5 text-center">
								<p>No changes detected yet. Start editing to see changes.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

// Component for importing ProseMirror documents
const ProsemirrorDocImport = () => {
	const lix = useLix();
	const [importError, setImportError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImportButtonClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setImportError(null);
			const content = await file.text();
			const jsonDoc = JSON.parse(content);

			// Try to create a new ProseMirror document from the JSON
			try {
				// Validate the document against our schema
				schema.nodeFromJSON(jsonDoc);

				// Update the file using the proper Lix database operations
				// This directly updates the file table with the new content
				await lix.db
					.updateTable("file")
					.where("path", "=", "/prosemirror.json")
					.set({
						data: new TextEncoder().encode(JSON.stringify(jsonDoc, null, 2)),
					})
					.execute();

				alert("Document imported successfully");

				// Reset the file input
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			} catch (schemaError) {
				console.error("Schema validation error:", schemaError);
				setImportError(
					`Schema validation error: ${(schemaError as Error).message}`,
				);
			}
		} catch (error) {
			console.error("Error importing document:", error);
			setImportError(`Error importing document: ${(error as Error).message}`);
		}
	};

	return (
		<div>
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept=".json"
				className="hidden"
			/>
			<button
				onClick={handleImportButtonClick}
				className="btn btn-sm btn-outline"
			>
				Import ProseMirror Doc
			</button>
			{importError && (
				<div className="text-error mt-2 text-sm">{importError}</div>
			)}
		</div>
	);
};

// Component for exporting ProseMirror document
const ProsemirrorDocExport = () => {
	const currentDoc = useQuery(selectProsemirrorDoc);

	const handleExportDocument = () => {
		try {
			// Create a blob with the document content
			const docContent = JSON.stringify(currentDoc, null, 2);
			const blob = new Blob([docContent], { type: "application/json" });

			// Create a download link
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `prosemirror-doc-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
			document.body.appendChild(a);
			a.click();

			// Clean up
			setTimeout(() => {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}, 0);
		} catch (error) {
			console.error("Error exporting document:", error);
			alert("Error exporting document: " + (error as Error).message);
		}
	};

	return (
		<button
			onClick={handleExportDocument}
			className="btn btn-sm btn-outline"
			disabled={!currentDoc}
		>
			Export ProseMirror Doc
		</button>
	);
};

export default LixDebugPanel;
