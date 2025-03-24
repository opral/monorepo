import React, { useState } from "react";
import Checkpoints from "./Checkpoints";
import ProposalList from "./ProposalList";
import ProposalForm from "./ProposalForm";
import clsx from "clsx";

export type SidebarTab = "checkpoints" | "proposals" | "create-proposal";

const Sidebar: React.FC = () => {
	const [activeTab, setActiveTab] = useState<SidebarTab>("checkpoints");

	const handleTabChange = (tab: SidebarTab) => {
		setActiveTab(tab);
	};

	const handleCloseProposalCreate = () => {
		setActiveTab("proposals");
	};

	return (
		<div className="flex flex-col h-full">
			{/* Hide tabs when create-proposal is active */}
			{activeTab !== "create-proposal" && (
				<div className="tabs tabs-bordered flex justify-around border-b border-base-300 h-10">
					<a
						className={clsx(
							"tab tab-bordered",
							activeTab === "checkpoints" && "tab-active",
						)}
						onClick={() => handleTabChange("checkpoints")}
					>
						Checkpoints
					</a>
					<a
						className={clsx(
							"tab tab-bordered",
							activeTab === "proposals" && "tab-active",
						)}
						onClick={() => handleTabChange("proposals")}
					>
						Proposals
					</a>
				</div>
			)}

			<div className="flex-1 overflow-auto">
				{activeTab === "checkpoints" && <Checkpoints />}
				{activeTab === "proposals" && (
					<ProposalList
						onCreateProposal={() => handleTabChange("create-proposal")}
					/>
				)}
				{activeTab === "create-proposal" && (
					<ProposalForm onClose={handleCloseProposalCreate} />
				)}
			</div>
		</div>
	);
};

export default Sidebar;

// Export for use in other components
export const showProposalCreate = (
	setTab: React.Dispatch<React.SetStateAction<SidebarTab>>,
) => {
	setTab("create-proposal");
};
