import { useState } from "react";
import { SlButton, SlDialog } from "@shoelace-style/shoelace/dist/react";
import { projectAtom } from "./../state.ts";
import { useAtom } from "jotai";
import { demoBundles } from "./../../demo/bundles.ts";
import { insertBundleNested } from "@inlang/sdk2";

const ImportComponent = () => {
	const [showDialog, setShowDialog] = useState(false);
	const [loading, setLoading] = useState(false);
	const [project] = useAtom(projectAtom);

	const handleImport = async () => {
		if (project) {
			setLoading(true);
			for (const bundle of demoBundles) {
				await insertBundleNested(project.db, bundle);
			}

			setLoading(false);
			setShowDialog(false);
		}
	};

	return (
		<>
			<SlButton
				size="small"
				onClick={() => {
					setShowDialog(true);
				}}
			>
				Import
			</SlButton>
			<SlDialog
				label="Import Translations"
				open={showDialog}
				onSlRequestClose={() => setShowDialog(false)}
			>
				<SlButton
					loading={loading}
					variant="primary"
					slot="footer"
					onClick={handleImport}
				>
					Import demo bundles
				</SlButton>
			</SlDialog>
		</>
	);
};

export default ImportComponent;
