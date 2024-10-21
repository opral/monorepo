import Layout from "./layout.tsx";
import TableEditor from "../../components/TableEditor.tsx";
import { useState } from "react";
import { UserAuthDialog } from "../../components/UserAuthDialog.tsx";
import { ImportDialog } from "../../components/ImportDialog.tsx";
import { WelcomeDialog } from "../../components/WelcomeDialog.tsx";

export default function Page() {
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
				<TableEditor />
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
