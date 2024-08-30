import Layout, { Grid } from "../../layout.tsx";
import {
	bundlesNestedAtom,
	projectAtom,
	selectedProjectPathAtom,
} from "../../state.ts";
import { useAtom } from "jotai";
import InlangBundle from "../../components/InlangBundle.tsx";
import { SlButton, SlDialog } from "@shoelace-style/shoelace/dist/react";
import VariantHistoryList from "../../components/VariantHistoryList.tsx";
import { useState } from "react";
import NoProjectView from "../../components/NoProjectView.tsx";
import { demoBundles } from "../../../demo/bundles.ts";
import { insertBundleNested } from "@inlang/sdk2";
import LixFloat from "../../components/LixFloat.tsx";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
	const [bundlesNested] = useAtom(bundlesNestedAtom);
	const [historyModalOpen, setHistoryModalOpen] = useState(false);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		null
	);

	const handleOpenHistoryModal = (variantId: string) => {
		setSelectedVariantId(variantId);
		setHistoryModalOpen(true);
	};

	const handleDemoImport = async () => {
		if (project) {
			for (const bundle of demoBundles) {
				await insertBundleNested(project.db, bundle);
			}
		}
	};

	// create new empty bundle
	// const handleNewBundle = () => {
	// 	if (project) {
	// 		insertBundleNested(project.db, createBundle({ messages: [] }));
	// 	}
	// };
	return (
		<>
			<Layout>
				<Grid>
					{/* new bundle button */}
					{project && selectedProjectPath && (
						<>
							{/* <div className="flex mb-3 justify-end mt-3">
								<SlButton
									size="small"
									className="btn btn-primary"
									onClick={() => handleNewBundle()}
								>
									New bundle
								</SlButton>
							</div> */}
							<div className="mt-8">
								{bundlesNested.length > 0 &&
									bundlesNested.map((bundle) => (
										<InlangBundle
											key={bundle.id}
											bundle={bundle}
											setShowHistory={handleOpenHistoryModal}
										/>
									))}
							</div>
						</>
					)}
					{(!project || !selectedProjectPath) && <NoProjectView />}
					{project && selectedProjectPath && bundlesNested.length === 0 && (
						<div className="h-full mx-auto max-w-80 flex flex-col justify-center items-center gap-8 mt-16">
							<img className="rounded" src="/empty-project-image.png" />
							<div className="w-full text-gray-500 text-md text-center leading-normal">
								Import the demo data to get started.
							</div>
							<SlButton
								size="small"
								variant="primary"
								className="w-full"
								onClick={handleDemoImport}
							>
								Import demo data
							</SlButton>
						</div>
					)}
				</Grid>
				<LixFloat />
			</Layout>
			<SlDialog
				label="History"
				open={historyModalOpen}
				onSlRequestClose={() => {
					setHistoryModalOpen(false);
					setSelectedVariantId(null);
				}}
			>
				{selectedVariantId && (
					<VariantHistoryList
						variantId={selectedVariantId}
						setHistoryModalOpen={setHistoryModalOpen}
						setSelectedVariantId={setSelectedVariantId}
					/>
				)}
			</SlDialog>
		</>
	);
}
