import { useState } from "react";
import { SlButton, SlDialog } from "@shoelace-style/shoelace/dist/react";
import { type BundleNested } from "@inlang/sdk2";
import { projectAtom } from "./../state.ts";
import { useAtom } from "jotai";
import { demoBundles } from "./../../demo/bundles.ts";
import { insertNestedBundle } from "./../helper/insertNestedBundle.ts";

const ImportComponent = () => {
	const [showDialog, setShowDialog] = useState(false);
	const [loading, setLoading] = useState(false);
	const [project] = useAtom(projectAtom);

	const handleImport = async () => {
		if (project) {
			setLoading(true);
			demoBundles.forEach(async (bundle) => {
				console.log(bundle);
				await insertNestedBundle(project, bundle as unknown as BundleNested);
			});

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
					Import demo ast
				</SlButton>
			</SlDialog>
		</>
	);
};

export default ImportComponent;
