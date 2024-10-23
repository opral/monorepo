import Layout from "./layout.tsx";
import TableEditor from "../../components/TableEditor.tsx";
import { useState } from "react";
import { UserAuthDialog } from "../../components/UserAuthDialog.tsx";
import { WelcomeDialog } from "../../components/WelcomeDialog.tsx";

export default function Page() {
	const [showAuthorDialog, setShowAuthorDialog] = useState(false);
	const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

	return (
		<>
			<Layout>
				<TableEditor />
			</Layout>
			<UserAuthDialog
				showAuthorDialog={showAuthorDialog}
				setShowAuthorDialog={setShowAuthorDialog}
			/>
			<WelcomeDialog
				showWelcomeDialog={showWelcomeDialog}
				setShowWelcomeDialog={setShowWelcomeDialog}
			/>
			{/* <button onClick={handleDownload}>Download</button> */}
		</>
	);
}
