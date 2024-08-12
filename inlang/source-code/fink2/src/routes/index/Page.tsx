import Layout from "../../layout.tsx";
import {
	bundlesNestedAtom,
	projectAtom,
	selectedProjectPathAtom,
} from "../../state.ts";
import { useAtom } from "jotai";
import InlangBundle from "../../components/InlangBundle.tsx";
import { SlDialog } from "@shoelace-style/shoelace/dist/react";
// import { InlangPatternEditor } from "../../components/SingleDiffBundle.tsx";
// import VariantHistory from "../../components/VariantHistory.tsx";
import VariantHistoryList from "../../components/VariantHistoryList.tsx";
import { useEffect, useState } from "react";

// import VariantHistory from "../../components/VariantHistory.tsx";

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

	return (
		<>
			<Layout>
				{bundlesNested.length > 0 &&
					bundlesNested.map((bundle) => (
						<InlangBundle
							key={bundle.id}
							bundle={bundle}
							setShowHistory={handleOpenHistoryModal}
						/>
					))}
				{(!project || !selectedProjectPath) && <>No project selected</>}
				{project && selectedProjectPath && bundlesNested.length === 0 && (
					<>No bundles found, please import demo ...</>
				)}
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
					<VariantHistoryList variantId={selectedVariantId} />
				)}
			</SlDialog>
		</>
	);
}