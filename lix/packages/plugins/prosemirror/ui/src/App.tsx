import Editor from "./components/Editor";
import LixDebugPanel from "./components/LixDebugPanel";
import Checkpoints from "./components/Checkpoints";
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

			{/* Split layout: Editor and Checkpoints */}
			<div className="editor-checkpoints-container">
				{/* Left side: Editor */}
				<div className="editor-container">
					<Editor />
				</div>

				{/* Right side: Checkpoints */}
				<Checkpoints />
			</div>

			{/* Debug tools at the bottom */}
			<LixDebugPanel lix={lix} />
		</div>
	);
}

export default App;