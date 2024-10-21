import Layout from "../../layout.tsx";
import { useAtom } from "jotai";
import TableEditor from "../../components/TableEditor.tsx";
import { useState } from "react";
import { UserAuthDialog } from "../../components/UserAuthDialog.tsx";
import { ImportDialog } from "../../components/ImportDialog.tsx";
import { WelcomeDialog } from "../../components/WelcomeDialog.tsx";
import { parsedCsvAtom } from "./state.ts";

export default function App() {
	// const [pendingChanges] = useAtom(pendingChangesAtom);
	const [csvData] = useAtom(parsedCsvAtom);
	// const [commits] = useAtom(commitsAtom);
	// const [selectedProjectPath] = useAtom(selectedProjectPathAtom);

	const [showAuthorDialog, setShowAuthorDialog] = useState(false);
	const [showImportDialog, setShowImportDialog] = useState(false);
	const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

	// const handleDownload = async () => {
	// 	const blob = await project!.toBlob();
	// 	const blobUrl = URL.createObjectURL(blob);
	// 	const link = document.createElement("a");
	// 	link.href = blobUrl;
	// 	link.download = selectedProjectPath!;
	// 	document.body.appendChild(link);
	// 	link.dispatchEvent(
	// 		new MouseEvent("click", {
	// 			bubbles: true,
	// 			cancelable: true,
	// 			view: window,
	// 		})
	// 	);
	// 	document.body.removeChild(link);
	// };

	return (
		<>
			<Layout setShowImportDialog={setShowImportDialog}>
				{csvData && csvData.length > 0 ? <TableEditor /> : <></>}
			</Layout>
			<UserAuthDialog
				showAuthorDialog={showAuthorDialog}
				setShowAuthorDialog={setShowAuthorDialog}
			/>
			<ImportDialog
				showImportDialog={showImportDialog}
				setShowImportDialog={setShowImportDialog}
			/>
			<WelcomeDialog
				showWelcomeDialog={showWelcomeDialog}
				setShowWelcomeDialog={setShowWelcomeDialog}
			/>
			{/* <button onClick={handleDownload}>Download</button> */}
		</>
	);
}
