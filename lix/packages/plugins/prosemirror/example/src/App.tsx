import Editor from "./components/Editor";
import LixDebugPanel from "./components/LixDebugPanel";
import Sidebar from "./components/Sidebar";
import AccountSelector from "./components/AccountSelector";
import VersionToolbar from "./components/VersionToolbar";
import { lix } from "./state";
import React from "react";
import ReactDOM from "react-dom/client";

function App() {
	return (
		<div className="flex flex-col mx-5 bg-base-100 text-base-content">
			{/* main ui */}
			<div className="flex flex-col border border-base-300 rounded my-5">
				<div className="flex justify-between items-center mt-5 mb-5 mx-5">
					<h1>ProseMirror Lix Plugin Demo</h1>
					<AccountSelector />
				</div>

				<div className="grid grid-cols-12 w-full border-t border-base-300 gap-0">
					<div className="col-span-8 border-r border-base-300">
						<VersionToolbar />
						<Editor />
					</div>

					<div className="col-span-4">
						<Sidebar />
					</div>
				</div>
			</div>

			{/* Debug tools at the bottom */}
			<LixDebugPanel lix={lix} />
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);