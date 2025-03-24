import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { idPlugin } from "../prosemirror/id-plugin";
import { schema } from "../prosemirror/schema";
import { lixProsemirror } from "../prosemirror/lix-plugin";
import { useEffect, useRef, useState } from "react";
import {
	selectProsemirrorDocument,
	selectCurrentVersion,
	selectMainVersion,
	selectActiveAccount,
	selectVersions,
} from "../queries";
import { useQuery } from "../hooks/useQuery";
import { initialDoc, lix } from "../state";
import {
	changeIsLeafInVersion,
	createChangeProposal,
	createChangeSet,
	createVersion,
	switchVersion,
} from "@lix-js/sdk";

const Editor: React.FC = () => {
	const [docInLix] = useQuery(selectProsemirrorDocument);
	const [currentVersion] = useQuery(selectCurrentVersion);
	const [mainVersion] = useQuery(selectMainVersion);
	const [activeAccount] = useQuery(selectActiveAccount);
	const [versions] = useQuery(selectVersions);
	const editorRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<EditorView | null>(null);

	// Determine if current version is the main version (assuming main version is the first one)
	const isMainVersion = versions?.[0]?.id === currentVersion?.id;

	// Initialize editor
	useEffect(() => {
		if (!editorRef.current) return;

		// Create plugins array including our custom plugins
		const plugins = [
			history(),
			keymap(baseKeymap),
			idPlugin,
			lixProsemirror({ lix }),
		];

		// Create the editor state
		const state = EditorState.create({
			doc: schema.nodeFromJSON(docInLix ?? initialDoc),
			plugins,
		});

		// Create the editor view
		const view = new EditorView(editorRef.current, {
			state,
			editable: () => true,
			dispatchTransaction: (transaction) => {
				// Apply the transaction to create a new state
				const newState = view.state.apply(transaction);

				// Update the editor view
				view.updateState(newState);
			},
		});

		// Store the view in state
		setView(view);

		// Focus the editor
		setTimeout(() => {
			view.focus();
		}, 100);

		// Clean up on unmount
		return () => {
			view.destroy();
		};
	}, []);

	// Scroll to the end of the scrollbar
	const scrollToEnd = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollLeft =
				scrollContainerRef.current.scrollWidth;
		}
	};

	// Handle clicks to focus the editor
	const handleClick = () => {
		if (view && !view.hasFocus()) {
			view.focus();
		}
	};

	// Handle version change
	const handleVersionChange = async (versionId: string) => {
		try {
			await switchVersion({ lix, to: { id: versionId } });
			// focus back to the editor when switching versions
			view?.focus();
		} catch (error) {
			console.error("Error switching version:", error);
		}
	};

	// Handle create version
	const handleCreateVersion = async () => {
		try {
			// Extract the first name from the account name
			const firstName = activeAccount?.name
				? activeAccount.name.split(" ")[0]
				: "User";

			const existingVersion = versions?.find(
				(version) => version.name === `${firstName}'s Version`,
			);
			if (existingVersion) {
				await switchVersion({ lix, to: { id: existingVersion.id } });
			} else {
				const newVersion = await createVersion({
					lix,
					name: `${firstName}'s Version`,
					from: { id: currentVersion!.id },
				});
				await switchVersion({ lix, to: { id: newVersion.id } });
			}
			// focus back to the editor when switching versions
			view?.focus();
			// Scroll to the end of the scrollbar after a short delay to ensure DOM update
			setTimeout(() => {
				scrollToEnd();
			}, 100);
		} catch (error) {
			console.error("Error creating version:", error);
		}
	};

	// Handle propose changes
	const handleProposeChanges = async () => {
		try {
			console.log("Creating proposal from version:", currentVersion?.name);

			const sourceChanges = await lix.db
				.selectFrom("change")
				.where(changeIsLeafInVersion(currentVersion!))
				.select("id")
				.execute();

			const targetChanges = await lix.db
				.selectFrom("change")
				.where(changeIsLeafInVersion(mainVersion!))
				.select("id")
				.execute();

			// Create two empty change sets for the proposal
			const sourceChangeSet = await createChangeSet({
				lix,
				changes: sourceChanges,
			});

			const targetChangeSet = await createChangeSet({
				lix,
				changes: targetChanges,
			});

			// Create a change proposal using the empty change sets
			await createChangeProposal({
				lix,
				source_change_set: sourceChangeSet,
				target_change_set: targetChangeSet,
			});

			// Focus back to the editor after creating the proposal
			view?.focus();
			// Scroll to the end of the scrollbar after a short delay to ensure DOM update
			setTimeout(() => {
				scrollToEnd();
			}, 100);
		} catch (error) {
			console.error("Error proposing changes:", error);
		}
	};

	// Effect to scroll to the end when versions change
	useEffect(() => {
		if (versions && versions.length > 0) {
			scrollToEnd();
		}
	}, [versions?.length]);

	return (
		<div>
			{/* Tab selector for versions with fixed button on right */}
			<div
				className="mode-tabs"
				style={{ boxSizing: "border-box", height: "40px", borderRadius: "0" }}
			>
				<div className="mode-tabs-scroll-container" ref={scrollContainerRef}>
					{versions?.map((version) => (
						<button
							key={version.id}
							className={`mode-tab ${version.id === currentVersion?.id ? "active" : ""}`}
							onClick={() => handleVersionChange(version.id)}
							style={{
								height: "40px",
								boxSizing: "border-box",
								borderRadius: "0",
							}}
						>
							{version.name}
						</button>
					))}
				</div>

				<div className="mode-tab-fixed">
					{isMainVersion ? (
						<button
							className="mode-tab"
							onClick={handleCreateVersion}
							style={{
								height: "40px",
								boxSizing: "border-box",
								borderRadius: "0",
							}}
						>
							+ Version
						</button>
					) : (
						<button
							className="mode-tab"
							onClick={handleProposeChanges}
							style={{
								height: "40px",
								boxSizing: "border-box",
								borderRadius: "0",
							}}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								xmlns="http://www.w3.org/2000/svg"
								fill="#000000"
								style={{ marginRight: "6px" }}
							>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M5.616 4.928a2.487 2.487 0 0 1-1.119.922c-.148.06-.458.138-.458.138v5.008a2.51 2.51 0 0 1 1.579 1.062c.273.412.419.895.419 1.388.008.343-.057.684-.19 1A2.485 2.485 0 0 1 3.5 15.984a2.482 2.482 0 0 1-1.388-.419A2.487 2.487 0 0 1 1.05 13c.095-.486.331-.932.68-1.283.349-.343.79-.579 1.269-.68V5.949a2.6 2.6 0 0 1-1.269-.68 2.503 2.503 0 0 1-.68-1.283 2.487 2.487 0 0 1 1.06-2.565A2.49 2.49 0 0 1 3.5 1a2.504 2.504 0 0 1 1.807.729 2.493 2.493 0 0 1 .729 1.81c.002.494-.144.978-.42 1.389zm-.756 7.861a1.5 1.5 0 0 0-.552-.579 1.45 1.45 0 0 0-.77-.21 1.495 1.495 0 0 0-1.47 1.79 1.493 1.493 0 0 0 1.18 1.179c.288.058.586.03.86-.08.276-.117.512-.312.68-.56.15-.226.235-.49.249-.76a1.51 1.51 0 0 0-.177-.78zM2.708 4.741c.247.161.536.25.83.25.271 0 .538-.075.77-.211a1.514 1.514 0 0 0 .729-1.359 1.513 1.513 0 0 0-.25-.76 1.551 1.551 0 0 0-.68-.56 1.49 1.49 0 0 0-.86-.08 1.494 1.494 0 0 0-1.179 1.18c-.058.288-.03.586.08.86.117.276.312.512.56.68zm10.329 6.296c.48.097.922.335 1.269.68.466.47.729 1.107.725 1.766.002.493-.144.977-.42 1.388a2.499 2.499 0 0 1-4.532-.899 2.5 2.5 0 0 1 1.067-2.565c.267-.183.571-.308.889-.37V5.489a1.5 1.5 0 0 0-1.5-1.499H8.687l1.269 1.27-.71.709L7.117 3.84v-.7l2.13-2.13.71.711-1.269 1.27h1.85a2.484 2.484 0 0 1 2.312 1.541c.125.302.189.628.187.957v5.548zm.557 3.509a1.493 1.493 0 0 0 .191-1.89 1.552 1.552 0 0 0-.68-.559 1.49 1.49 0 0 0-.86-.08 1.493 1.493 0 0 0-1.179 1.18 1.49 1.49 0 0 0 .08.86 1.496 1.496 0 0 0 2.448.49z"
								/>
							</svg>
							Propose
						</button>
					)}
				</div>
			</div>

			<div className="editor-wrapper" onClick={handleClick}>
				{/* The actual editor will be mounted here */}
				<div ref={editorRef} />
			</div>
		</div>
	);
};

export default Editor;
