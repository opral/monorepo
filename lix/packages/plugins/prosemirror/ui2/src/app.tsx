import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { ProseMirrorEditor } from "./components/prose-mirror-editor";

function App() {
	return (
		<main className="container mx-auto p-4 h-screen flex flex-col">
			<div className="flex-1 overflow-hidden">
				<ProseMirrorEditor />
			</div>
		</main>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
