import Editor from "./components/Editor";
import LixDebugPanel from "./components/LixDebugPanel";
import Sidebar from "./components/Sidebar";
import AccountSelector from "./components/AccountSelector";
import VersionToolbar from "./components/VersionToolbar";
import React from "react";
import ReactDOM from "react-dom/client";
import { openLix, OpfsStorage } from "@lix-js/sdk";
import { plugin as prosemirrorPlugin } from "@lix-js/plugin-prosemirror";
import { initLixInspector } from "@lix-js/inspector";
import { LixProvider } from "@lix-js/react-utils";

// Initialize Lix
const lix = await openLix({
	providePlugins: [prosemirrorPlugin],
	storage: new OpfsStorage({ path: "example.lix" }),
});

// dev tool for debugging
initLixInspector({ lix });

// Ensure prosemirror file exists
if (
	(await lix.db
		.selectFrom("file")
		.where("path", "=", "/prosemirror.json")
		.select("id")
		.executeTakeFirst()) === undefined
) {
	await lix.db
		.insertInto("file")
		.values({
			path: "/prosemirror.json",
			data: new TextEncoder().encode(
				JSON.stringify({
					type: "doc",
					content: [],
				}),
			),
		})
		.execute();
}

function App() {
	return (
		<LixProvider lix={lix}>
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
				<hr className="mt-10 text-base-300" />
				<LixDebugPanel />
			</div>
		</LixProvider>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
