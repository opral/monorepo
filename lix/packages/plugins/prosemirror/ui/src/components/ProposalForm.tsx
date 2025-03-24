import { useState, useRef } from "react";
import { useQuery } from "../hooks/useQuery";
import {
	selectCurrentVersion,
	selectMainVersion,
	selectActiveAccount,
	selectCurrentChangeSet,
} from "../queries";
import { lix } from "../state";
import {
	changeIsLeafInVersion,
	createChangeSet,
	createChangeProposal,
} from "@lix-js/sdk";
import ProposalItem, { ProposalData } from "./ProposalItem";
import { DiscussionHandle } from "./Discussion";

/**
 * ProposalForm component
 * Allows users to create new proposals with comments
 */
export default function ProposalForm() {
	// Load necessary data
	const [currentVersion] = useQuery(selectCurrentVersion);
	const [mainVersion] = useQuery(selectMainVersion);
	const [activeAccount] = useQuery(selectActiveAccount);
	const [currentChangeSet] = useQuery(selectCurrentChangeSet);

	// Component state
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Create a ref for the discussion component to access its methods
	const discussionRef = useRef<DiscussionHandle>(null);

	// Handler for the view diff button
	const handleViewDiff = () => {
		console.log("View diff clicked - feature not implemented");
	};

	// Handler for submitting the proposal
	const handleSubmitProposal = async () => {
		if (isSubmitting) return;

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			// Get the comment text from the Discussion component
			const commentText = discussionRef.current?.getCommentText() || "";

			// Create a timestamp to make each proposal unique
			const timestamp = Date.now();
			const uniqueId = `proposal-${timestamp}`;

			// Create a unique label for this proposal to avoid conflicts
			const proposalLabel = await lix.db
				.insertInto("label")
				.values({ name: uniqueId })
				.returningAll()
				.executeTakeFirstOrThrow();

			// Get leaf changes from both versions
			const sourceChanges = await lix.db
				.selectFrom("change")
				.where(changeIsLeafInVersion(currentVersion!))
				.innerJoin("file", "change.file_id", "file.id")
				.where("file.path", "=", "/prosemirror.json")
				.select("change.id")
				.execute();

			const targetChanges = await lix.db
				.selectFrom("change")
				.where(changeIsLeafInVersion(mainVersion!))
				.innerJoin("file", "change.file_id", "file.id")
				.where("file.path", "=", "/prosemirror.json")
				.select("change.id")
				.execute();

			// Create change sets with unique labels to avoid conflicts
			const sourceChangeSet = await createChangeSet({
				lix,
				changes: sourceChanges,
				labels: [proposalLabel],
				// @ts-expect-error
				metadata: {
					title: `Proposed changes (${timestamp})`,
					description: commentText.trim() || undefined,
				},
			});

			const targetChangeSet = await createChangeSet({
				lix,
				changes: targetChanges,
				labels: [proposalLabel],
			});

			// Create the change proposal
			await createChangeProposal({
				lix,
				source_change_set: sourceChangeSet,
				target_change_set: targetChangeSet,
			});

			// Clear the comment text field
			discussionRef.current?.clearCommentText();
		} catch (error) {
			console.error("Error creating proposal:", error);
			setErrorMessage("Failed to create proposal. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Form actions footer
	const actionFooter = (
		<div className="flex justify-between items-center p-4">
			<button
				className="btn btn-outline"
				onClick={() => {}}
				disabled={isSubmitting}
			>
				Cancel
			</button>

			<div className="flex items-center gap-2">
				{errorMessage && (
					<span className="text-error text-sm">{errorMessage}</span>
				)}
				<button
					className="btn btn-primary"
					onClick={handleSubmitProposal}
					disabled={isSubmitting}
				>
					{isSubmitting ? "Submitting..." : "Submit Proposal"}
				</button>
			</div>
		</div>
	);

	// Create a temporary proposal object for display purposes
	// Using a unique ID and the current timestamp ensures we don't have stale data
	// @ts-expect-error
	const draftProposal: ProposalData = {
		id: `draft-proposal-${Date.now()}`,
		change_set_id: currentChangeSet?.id || `temp-${Date.now()}`,
		change_count: currentChangeSet?.change_count || 0,
		account_name: activeAccount?.name,
		from_version: currentVersion?.name,
		to_version: mainVersion?.name,
	};

	return (
		<div className="proposal-form h-full flex flex-col">
			{/* Header */}
			<div className="tabs border-b border-base-300 h-10 flex items-center justify-center">
				<div className="tab tab-active flex items-center gap-2 px-4 h-10">
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						xmlns="http://www.w3.org/2000/svg"
						fill="#000000"
						style={{ marginRight: "6px", flexShrink: 0 }}
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M5.616 4.928a2.487 2.487 0 0 1-1.119.922c-.148.06-.458.138-.458.138v5.008a2.51 2.51 0 0 1 1.579 1.062c.273.412.419.895.419 1.388.008.343-.057.684-.19 1A2.485 2.485 0 0 1 3.5 15.984a2.482 2.482 0 0 1-1.388-.419A2.487 2.487 0 0 1 1.05 13c.095-.486.331-.932.68-1.283.349-.343.79-.579 1.269-.68V5.949a2.6 2.6 0 0 1-1.269-.68 2.503 2.503 0 0 1-.68-1.283 2.487 2.487 0 0 1 1.06-2.565A2.49 2.49 0 0 1 3.5 1a2.504 2.504 0 0 1 1.807.729 2.493 2.493 0 0 1 .729 1.81c.002.494-.144.978-.42 1.389zm-.756 7.861a1.5 1.5 0 0 0-.552-.579 1.45 1.45 0 0 0-.77-.21 1.495 1.495 0 0 0-1.47 1.79 1.493 1.493 0 0 0 1.18 1.179c.288.058.586.03.86-.08.276-.117.512-.312.68-.56.15-.226.235-.49.249-.76a1.51 1.51 0 0 0-.177-.78zM2.708 4.741c.247.161.536.25.83.25.271 0 .538-.075.77-.211a1.514 1.514 0 0 0 .729-1.359 1.513 1.513 0 0 0-.25-.76 1.551 1.551 0 0 0-.68-.56 1.49 1.49 0 0 0-.86-.08 1.494 1.494 0 0 0-1.179 1.18c-.058.288-.03.586.08.86.117.276.312.512.56.68zm10.329 6.296c.48.097.922.335 1.269.68.466.47.729 1.107.725 1.766.002.493-.144.977-.42 1.388a2.499 2.499 0 0 1-4.532-.899 2.5 2.5 0 0 1 1.067-2.565c.267-.183.571-.308.889-.37V5.489a1.5 1.5 0 0 0-1.5-1.499H8.687l1.269 1.27-.71.709L7.117 3.84v-.7l2.13-2.13.71.711-1.269 1.27h1.85a2.484 2.484 0 0 1 2.312 1.541c.125.302.189.628.187.957v5.548zm.557 3.509a1.493 1.493 0 0 0 .191-1.89 1.552 1.552 0 0 0-.68-.559 1.49 1.49 0 0 0-.86-.08 1.493 1.493 0 0 0-1.179 1.18 1.49 1.49 0 0 0 .08.86 1.496 1.496 0 0 0 2.448.49z"
						/>
					</svg>
					<span>Propose Changes</span>
				</div>
			</div>

			{/* Content area */}
			<div className="flex-1 flex flex-col">
				<div className="flex-1 overflow-auto">
					<ProposalItem
						proposal={draftProposal}
						isExpanded={true}
						isEditable={true}
						onViewDiff={handleViewDiff}
						footer={actionFooter}
						ref={discussionRef}
					/>
				</div>
			</div>
		</div>
	);
}
