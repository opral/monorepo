import React, { useState } from "react";
import { useQuery } from "../hooks/useQuery";
import { selectVersions, selectCurrentVersion } from "../queries";
import { createVersion } from "@lix-js/sdk";
import { lix } from "../state";

// Array of adjectives and nouns for generating random version names
const adjectives = [
	"swift",
	"bold",
	"calm",
	"deep",
	"eager",
	"fair",
	"grand",
	"keen",
	"lush",
	"mild",
	"neat",
	"prime",
	"rich",
	"sleek",
	"vast",
];

const nouns = [
	"river",
	"mount",
	"forest",
	"field",
	"ocean",
	"vale",
	"peak",
	"canyon",
	"plain",
	"isle",
	"dune",
	"marsh",
	"lake",
	"shore",
	"dawn",
];

// Function to generate a random human-readable name
const generateRandomName = (): string => {
	const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	return `${adjective}-${noun}`;
};

interface VersionSelectorProps {
	onVersionChange: (version: string) => void;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({
	onVersionChange,
}) => {
	const [showVersionDropdown, setShowVersionDropdown] =
		useState<boolean>(false);

	// Fetch versions from Lix state
	const [versions] = useQuery(selectVersions);
	const [currentVersion] = useQuery(selectCurrentVersion);

	// Handle version selection
	const handleVersionSelect = (versionId: string) => {
		onVersionChange(versionId);
		setShowVersionDropdown(false);
	};

	// Toggle version dropdown
	const toggleVersionDropdown = () => {
		setShowVersionDropdown(!showVersionDropdown);
	};

	// Handle create new version - now creates immediately with a random name
	const handleCreateNewVersion = async () => {
		try {
			// Generate a random human-readable name
			const randomName = generateRandomName();

			// Create a new version with the random name
			const newVersion = await createVersion({
				lix,
				name: randomName,
				// Create from current version
				from: currentVersion ? { id: currentVersion.id } : undefined,
			});

			// Switch to the new version
			onVersionChange(newVersion.id);

			// Close the dropdown
			setShowVersionDropdown(false);
		} catch (error) {
			console.error("Error creating new version:", error);
		}
	};

	// Handle version deletion
	const handleDeleteVersion = async (
		versionId: string,
		event: React.MouseEvent,
	) => {
		// Stop the click event from propagating to the parent (which would select the version)
		event.stopPropagation();

		try {
			// Check if this is the current version
			if (currentVersion?.id === versionId) {
				console.error("Cannot delete the current version");
				return;
			}

			// Delete the version from the database
			await lix.db.deleteFrom("version").where("id", "=", versionId).execute();

			// Close the dropdown after deletion
			setShowVersionDropdown(false);
		} catch (error) {
			console.error("Error deleting version:", error);
		}
	};

	return (
		<div
			className="version-selector"
			style={{
				height: "100%",
				display: "flex",
				alignItems: "center",
			}}
		>
			<button
				className="version-button"
				onClick={toggleVersionDropdown}
				style={{
					height: "100%",
					display: "flex",
					alignItems: "center",
					padding: "0 12px",
					border: "none",
					background: "none",
					cursor: "pointer",
				}}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 512 512"
					fill="#666666"
					xmlns="http://www.w3.org/2000/svg"
					style={{ marginRight: "8px" }}
				>
					<path d="M416,160a64,64,0,1,0-96.27,55.24c-2.29,29.08-20.08,37-75,48.42-17.76,3.68-35.93,7.45-52.71,13.93V151.39a64,64,0,1,0-64,0V360.61a64,64,0,1,0,64.42.24c2.39-18,16-24.33,65.26-34.52,27.43-5.67,55.78-11.54,79.78-26.95,29-18.58,44.53-46.78,46.36-83.89A64,64,0,0,0,416,160ZM160,64a32,32,0,1,1-32,32A32,32,0,0,1,160,64Zm0,384a32,32,0,1,1,32-32A32,32,0,0,1,160,448ZM352,192a32,32,0,1,1,32-32A32,32,0,0,1,352,192Z"></path>
				</svg>
				{currentVersion?.name}
			</button>

			{showVersionDropdown && (
				<div className="version-dropdown">
					<ul className="version-list">
						{versions &&
							versions
								.filter((v) => v.id !== currentVersion?.id)
								.map((v) => (
									<li
										key={v.id}
										className="version-item"
										onClick={() => handleVersionSelect(v.id)}
										style={{
											display: "flex",
											width: "100%",
											padding: "8px 12px",
											cursor: "pointer",
											borderBottom: "1px solid #eee",
											boxSizing: "border-box",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<span
											className="version-number"
											style={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
												width: "calc(100% - 30px)",
												fontSize: "14px",
											}}
										>
											{v.name}
										</span>
										<div
											onClick={(e) => handleDeleteVersion(v.id, e)}
											style={{
												width: "20px",
												height: "20px",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												cursor: "pointer",
												opacity: 0.7,
											}}
											title="Delete version"
										>
											{/* Wireframe trash icon */}
											<svg
												width="14"
												height="14"
												viewBox="0 0 14 14"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
												style={{ display: "block" }}
											>
												<rect x="2" y="2" width="10" height="1" fill="#666" />
												<rect x="5" y="0" width="4" height="2" fill="#666" />
												<rect x="3" y="3" width="1" height="9" fill="#666" />
												<rect x="5" y="3" width="1" height="9" fill="#666" />
												<rect x="7" y="3" width="1" height="9" fill="#666" />
												<rect x="9" y="3" width="1" height="9" fill="#666" />
												<rect x="2" y="12" width="9" height="1" fill="#666" />
											</svg>
										</div>
									</li>
								))}
						<li
							className="version-item new-version"
							onClick={handleCreateNewVersion}
							style={{
								display: "flex",
								alignItems: "center",
								width: "100%",
								padding: "8px 12px",
								cursor: "pointer",
								borderTop: "1px solid #eee",
								backgroundColor: "#f9f9f9",
								boxSizing: "border-box",
							}}
						>
							<div
								style={{
									width: "24px",
									height: "24px",
									borderRadius: "0px",
									backgroundColor: "#e0e0e0",
									border: "1px solid #ccc",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "10px",
									fontWeight: "bold",
									marginRight: "8px",
									flexShrink: 0,
								}}
							>
								+
							</div>
							<span className="create-version">Create new version</span>
						</li>
					</ul>
				</div>
			)}
		</div>
	);
};

export default VersionSelector;
