import Editor from "./components/Editor";
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
	}, 400); // Increased from 100ms to 400ms for better performance while still being responsive

	return (
		<div className="app-container">
			<h1>ProseMirror Lix Plugin Demo</h1>

			<div className="editor-section">
				<Editor onChange={handleDocChange} externalDoc={initialDoc} />
			</div>

			<LixDebugPanel lix={lix} currentDoc={currentDoc} changes={changes} />
		</div>
	);
}

export default App;