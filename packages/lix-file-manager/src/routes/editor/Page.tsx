import OpenFileLayout from "../../layouts/OpenFileLayout.tsx";
import TableEditor from "../../components/TableEditor.tsx";
import { useState } from "react";
import { UserAuthDialog } from "../../components/UserAuthDialog.tsx";

export default function Page() {
	const [showAuthorDialog, setShowAuthorDialog] = useState(false);

	return (
		<>
			<OpenFileLayout>
				<TableEditor />
			</OpenFileLayout>
			<UserAuthDialog
				showAuthorDialog={showAuthorDialog}
				setShowAuthorDialog={setShowAuthorDialog}
			/>
		</>
	);
}
