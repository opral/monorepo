import Editor from "./components/Editor";
import LixDebugPanel from "./components/LixDebugPanel";
import Sidebar from "./components/Sidebar";
import AccountSelector from "./components/AccountSelector";
import VersionToolbar from "./components/VersionToolbar";
import React from "react";
import ReactDOM from "react-dom/client";
import { openLix, OpfsSahEnvironment } from "@lix-js/sdk";
import prosemirrorPlugin from "@lix-js/plugin-prosemirror?raw";
import { initLixInspector } from "@lix-js/inspector";
import { LixProvider } from "@lix-js/react-utils";

// Initialize Lix
const environment = new OpfsSahEnvironment({ key: "prosemirror-example" });

let lix;
try {
	lix = await openLix({
		providePluginsRaw: [prosemirrorPlugin],
		environment,
	});
} catch (error) {
	console.error("Failed to open Lix, cleaning OPFS and reloading:", error);
	try {
		await environment.close();
	} catch {
		// ignore close errors during recovery
	}
	await OpfsSahEnvironment.clear();
}

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
				<a
					href="https://www.npmjs.com/package/@lix-js/plugin-prosemirror"
					target="_blank"
					rel="noreferrer"
					className="mt-4 flex items-center justify-between rounded border border-base-300 bg-base-100 px-4 py-3 shadow-sm transition hover:shadow-md"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 items-center justify-center rounded-md border border-base-300 bg-white px-3">
							<img
								src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Npm-logo.svg/1080px-Npm-logo.svg.png"
								alt="npm logo"
								className="h-6 w-auto"
								loading="lazy"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-sm text-neutral-600">
								For more information visit the npm package.
							</span>
							<span className="text-lg font-semibold text-base-content">
								@lix-js/plugin-prosemirror
							</span>
						</div>
					</div>
					<span className="inline-flex items-center justify-center rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm font-medium text-base-content hover:bg-base-200">
						View package &rarr;
					</span>
				</a>

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
