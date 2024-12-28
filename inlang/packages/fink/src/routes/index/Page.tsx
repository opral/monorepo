import Layout, { Grid } from "../../layout.tsx";
import {
	bundlesNestedAtom,
	bundlesNestedFilteredAtom,
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
import { insertBundleNested } from "@inlang/sdk";
import LixFloat from "../../components/LixFloat.tsx";
import TableHeader from "../../components/TableHeader.tsx";
import FilterSection from "../../components/FilterSection.tsx";

export default function App() {
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
	const [bundlesNested] = useAtom(bundlesNestedAtom);
	const [bundlesNestedFiltered] = useAtom(bundlesNestedFilteredAtom);
	const [historyModalOpen, setHistoryModalOpen] = useState(false);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

	const handleOpenHistoryModal = (variantId: string) => {
		setSelectedVariantId(variantId);
		setHistoryModalOpen(true);
	};

	const handleDemoImport = async () => {
		if (project) {
			for (const bundle of demoBundles) {
				await insertBundleNested(project.db, bundle);
			}
			// update settings by adding the new de locale
			const settings = await project.settings.get();
			await project.settings.set({
				...settings,
				locales: [...settings.locales, "de"],
			});
		}
	};

	return (
		<>
			<Layout>
				<Grid>
					<FilterSection />
					{bundlesNestedFiltered.length !== 0 && <TableHeader />}
					{project && selectedProjectPath && (
						<>
							{bundlesNestedFiltered.length > 0 &&
								bundlesNestedFiltered.map((bundle) => (
									<InlangBundle
										key={bundle.id}
										bundle={bundle}
										setShowHistory={handleOpenHistoryModal}
									/>
								))}
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
