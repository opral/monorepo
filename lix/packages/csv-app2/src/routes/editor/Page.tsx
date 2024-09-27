import Layout from "../../layout.tsx";
import { useAtom } from "jotai";
import {
	authorNameAtom,
	csvDataAtom,
	projectAtom,
	// selectedProjectPathAtom,
} from "../../state.ts";
import TableEditor from "../../components/TableEditor.tsx";
import { useEffect, useState } from "react";
import { UserAuthDialog } from "../../components/UserAuthDialog.tsx";
import { ImportDialog } from "../../components/ImportDialog.tsx";
import { WelcomeDialog } from "../../components/WelcomeDialog.tsx";

export default function App() {
	// const [pendingChanges] = useAtom(pendingChangesAtom);
	const [csvData] = useAtom(csvDataAtom);
	// const [commits] = useAtom(commitsAtom);
	const [authorName] = useAtom(authorNameAtom);
	// const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
	const [project] = useAtom(projectAtom);

	const [showAuthorDialog, setShowAuthorDialog] = useState(false);
	const [showImportDialog, setShowImportDialog] = useState(false);
	const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

	useEffect(() => {
		if (authorName && project) {
			project?.currentAuthor.set(authorName);
		}
	}, [authorName, project, project?.currentAuthor]);

	useEffect(() => {
		//console.log(project, csvData, authorName);
		if (project && csvData && csvData.length === 0 && authorName) {
			setShowWelcomeDialog(true);
		}
	}, [csvData, project, authorName]);

	useEffect(() => {
		if (!authorName && project && csvData) {
			setShowAuthorDialog(true);
		}
	}, [authorName, project, csvData]);

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
