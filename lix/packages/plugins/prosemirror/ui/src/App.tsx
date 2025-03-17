import Editor from "./components/Editor";
import { useState } from "react";
import { lix, pollingInterval } from "./state";
import { useDebounceCallback, useInterval } from "usehooks-ts";

function App() {
	const [initialDoc] = useState<any>(null);
	const [currentDoc, setCurrentDoc] = useState<any>(null);

	const [, setForceRender] = useState(0);

	useInterval(() => {
		setForceRender((prev) => prev + 1);
	}, pollingInterval);

	//
	// Debouncing to prevent too many updates
	const handleDocChange = useDebounceCallback((newDoc: any) => {
		const file = new TextEncoder().encode(JSON.stringify(newDoc));

		lix.db
			.insertInto("file")
			.values({
				path: "/prosemirror.json",
				data: file,
			})
			.onConflict((oc) =>
				oc.doUpdateSet({
					data: file,
				}),
			)
			.execute()
			.then(() => console.log("File saved to lix"));

		setCurrentDoc(newDoc);
	}, 100);

	return (
		<div className="app-container">
			<h1>ProseMirror Lix Plugin Demo</h1>
			<p>Edit the document below. Changes will be detected and displayed.</p>

			<Editor onChange={handleDocChange} externalDoc={initialDoc} />

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
