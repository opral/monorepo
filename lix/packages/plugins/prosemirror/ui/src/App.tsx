import Editor from "./components/Editor";
import LixDebugPanel from "./components/LixDebugPanel";
import Sidebar from "./components/Sidebar";
import AccountSelector from "./components/AccountSelector";
import { lix } from "./state";

function App() {
	return (
		<div className="app-container">
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "20px",
				}}
			>
				<h1>ProseMirror Lix Plugin Demo</h1>
				<AccountSelector />
			</div>

			{/* Split layout: Editor, Version, and Checkpoints */}
			<div className="main-layout">
				{/* Left side: Editor */}
				<div className="editor-container">
					<Editor />
				</div>

				{/* Right side: Sidebar with Checkpoints and Proposals */}
				<div className="right-panel">
					{/* Sidebar containing Checkpoints and Proposals tabs */}
					<div className="checkpoints-panel">
						<Sidebar />
					</div>
				</div>
			</div>

			{/* Debug tools at the bottom */}
			<LixDebugPanel lix={lix} />
		</div>
	);
}

export default App;