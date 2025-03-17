import Editor from "./components/Editor";
import ChangesDisplay from "./components/ChangesDisplay";
import LixDebugPanel from "./components/LixDebugPanel";
import { useState } from "react";
import { lix, pollingInterval, prosemirrorDocument, changes } from "./state";
import { useDebounceCallback, useInterval } from "usehooks-ts";

function App() {
	const [initialDoc] = useState<any>(prosemirrorDocument);
	const [currentDoc, setCurrentDoc] = useState<any>(initialDoc);

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
			<p>Edit the document below. Changes will be automatically saved to Lix.</p>

			<Editor onChange={handleDocChange} externalDoc={initialDoc} />

			<LixDebugPanel lix={lix} currentDoc={currentDoc} />

			<div className="changes-section" style={{ marginTop: "20px" }}>
				{/* Display changes from Lix */}
				<ChangesDisplay changes={changes} />
			</div>
		</div>
	);
}

export default App;