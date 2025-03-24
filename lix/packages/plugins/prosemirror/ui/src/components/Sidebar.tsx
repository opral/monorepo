import { useState } from "react";
import Checkpoints from "./Checkpoints";
import Proposals from "./Proposals";
import clsx from "clsx";
import { useQuery } from "../hooks/useQuery";
import { selectCurrentVersion, selectMainVersion } from "../queries";
import NewProposal from "./NewProposal";

export default function Sidebar() {
	const [currentVersion] = useQuery(selectCurrentVersion);
	const [mainVersion] = useQuery(selectMainVersion);

	const isMainVersion = currentVersion?.id === mainVersion?.id;

	return isMainVersion ? (
		<MainVersionSidebar />
	) : (
		<div className="flex flex-col h-full">
			<NewProposal />
		</div>
	);
}

function MainVersionSidebar() {
	const [activeTab, setActiveTab] = useState<"checkpoints" | "proposals">(
		"checkpoints",
	);

	return (
		<div className="flex flex-col h-full">
			<div className="tabs tabs-bordered flex justify-around items-center border-b border-base-300 h-10">
				<a
					className={clsx(
						"tab tab-bordered",
						activeTab === "checkpoints" && "tab-active",
					)}
					onClick={() => setActiveTab("checkpoints")}
				>
					Checkpoints
				</a>
				<a
					className={clsx(
						"tab tab-bordered",
						activeTab === "proposals" && "tab-active",
					)}
					onClick={() => setActiveTab("proposals")}
				>
					Proposals
				</a>
			</div>

			<div className="flex-1 overflow-auto">
				{activeTab === "checkpoints" && <Checkpoints />}
				{activeTab === "proposals" && <Proposals />}
			</div>
		</div>
	);
}

