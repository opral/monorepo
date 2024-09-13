import Layout from "../../layout.tsx";
import { useAtom } from "jotai";
import { authorNameAtom, csvDataAtom, projectAtom } from "../../state.ts";
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
	const [project] = useAtom(projectAtom);

	const [showAuthorDialog, setShowAuthorDialog] = useState(false);
	const [showImportDialog, setShowImportDialog] = useState(false);
	const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

	useEffect(() => {
		if (authorName) {
			project?.currentAuthor.set(authorName);
		}
	}, [authorName, project, project?.currentAuthor]);

	useEffect(() => {
		if (!authorName && project) {
			setShowAuthorDialog(true);
		}
	}, [authorName, project]);

	useEffect(() => {
		if (project && csvData && csvData.length === 0 && authorName) {
			setShowWelcomeDialog(true);
		}
	}, [csvData, project]);

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
		</>
	);
}
