import React, { useState } from "react";
import Checkpoints from "./Checkpoints";
import Proposals from "./Proposals";
import clsx from "clsx";

const Sidebar: React.FC = () => {
	const [activeTab, setActiveTab] = useState("checkpoints");

	return (
		<div>
			<div className="tabs tabs-border flex justify-around border-b border-base-300 h-10">
				<a
					className={clsx(
						"tab tab-lg",
						activeTab === "checkpoints" && "tab-active",
					)}
					onClick={() => setActiveTab("checkpoints")}
				>
					Checkpoints
				</a>
				<a
					className={clsx("tab", activeTab === "proposals" && "tab-active")}
					onClick={() => setActiveTab("proposals")}
				>
					Proposals
				</a>
			</div>

			{activeTab === "checkpoints" && <Checkpoints />}
			{activeTab === "proposals" && <Proposals />}
		</div>
	);
};

export default Sidebar;
