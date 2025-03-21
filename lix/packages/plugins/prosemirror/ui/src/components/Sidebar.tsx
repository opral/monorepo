import React, { useState } from "react";
import Checkpoints from "./Checkpoints";
import Proposals from "./Proposals";

const Sidebar: React.FC = () => {
	const [activeTab, setActiveTab] = useState("checkpoints");

	return (
		<div
			className="checkpoints-container"
			style={{ border: "none", borderRadius: "0", margin: 0, padding: 0 }}
		>
			<div
				className="checkpoints-header"
				style={{
					display: "flex",
					borderBottom: "1px solid #e5e7eb",
					height: "40px", // Match the height of the version bar in the Editor
					margin: 0,
					padding: 0,
				}}
			>
				<button
					style={{
						flex: 1,
						padding: "0",
						border: "none",
						outline: "none",
						background: "none",
						cursor: "pointer",
						fontWeight: activeTab === "checkpoints" ? "bold" : "normal",
						fontSize: "14px",
					}}
					onClick={() => setActiveTab("checkpoints")}
				>
					Checkpoints
				</button>
				<div style={{ width: "1px", height: "14px", background: "#e5e7eb" }}></div>
				<button
					style={{
						flex: 1,
						padding: "0",
						border: "none",
						outline: "none",
						background: "none",
						cursor: "pointer",
						fontWeight: activeTab === "proposals" ? "bold" : "normal",
						fontSize: "14px",
					}}
					onClick={() => setActiveTab("proposals")}
				>
					Proposals
				</button>
			</div>

			{activeTab === "checkpoints" && <Checkpoints />}
			{activeTab === "proposals" && <Proposals />}
		</div>
	);
};

export default Sidebar;
