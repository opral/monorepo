import Editor from "./components/Editor";
import { useState } from "react";

function App() {
	const [currentDoc, setCurrentDoc] = useState<any>(null);

	// Handle doc changes from the editor
	const handleDocChange = (newDoc: any) => {
		// Always update current document state
		console.log("Document changed from editor");

		// Ensure all nodes have the proper structure with attrs
		// This is needed for proper change detection
		const ensureNodeStructure = (node: any) => {
			if (!node) return node;

			// Make sure the node has attrs with _id if not text
			if (node.type !== "text") {
				node.attrs = node.attrs || {};
				if (!node.attrs._id) {
					node.attrs._id = `${node.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
				}
			}

			// Recursively process content
			if (node.content && Array.isArray(node.content)) {
				node.content = node.content.map(ensureNodeStructure);
			}

			return node;
		};

		// Create a deep copy and ensure proper structure
		const processedDoc = ensureNodeStructure(
			JSON.parse(JSON.stringify(newDoc)),
		);

		setCurrentDoc(processedDoc);

		// Update current document with the processed version
	};

	return (
		<div className="app-container">
			<h1>ProseMirror Lix Plugin Demo</h1>
			<p>Edit the document below. Changes will be detected and displayed.</p>

			<Editor onChange={handleDocChange} externalDoc={currentDoc} />

			<div className="debug-section" style={{ marginTop: "20px" }}>
				<h3>Current Document AST</h3>
				<pre
					style={{
						backgroundColor: "#f5f5f5",
						padding: "10px",
						borderRadius: "4px",
						maxHeight: "200px",
						overflow: "auto",
						color: "#333",
					}}
				>
					{JSON.stringify(currentDoc, null, 2)}
				</pre>
			</div>

			<div className="changes-section" style={{ marginTop: "20px" }}>
				<div
					className="changes-header"
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				></div>
				{/* <ChangesDisplay
					changes={changes}
					previousDoc={previousDoc}
					onRollbackChange={() => {
						throw new Error("Not implemented");
					}}
				/> */}
			</div>
		</div>
	);
}

export default App;
