import React, {
	useRef,
	forwardRef,
	useImperativeHandle,
	useState,
	useEffect,
} from "react";
import { useQuery } from "../hooks/useQuery";
import { selectDiscussion, countChangesInChangeSet } from "../queries";
import { getInitials } from "../utilities/nameUtils";
import { Eye, Check, X, ChevronRight } from "lucide-react";
import { Discussion, DiscussionHandle } from "./Discussion";
import type { ChangeProposal } from "@lix-js/sdk";

// Common interfaces
export interface ProposalData extends ChangeProposal {
	account_name?: string;
	change_count?: number;
	from_version?: string;
	to_version?: string;
}

export interface ProposalItemProps {
	proposal: ProposalData;
	isExpanded?: boolean;
	onExpand?: (id: string) => void;
	onAccept?: (id: string) => void;
	onReject?: (id: string) => void;
	onViewDiff?: () => void;
	isEditable?: boolean;
	footer?: React.ReactNode;
}

export interface ProposalItemHandle {
	getCommentText: () => string;
	clearCommentText: () => void;
}

/**
 * ProposalItem component
 * A card-based UI component that displays a proposal and its details
 */
const ProposalItem = forwardRef<ProposalItemHandle, ProposalItemProps>(
	(
		{
			proposal,
			isExpanded = false,
			onExpand,
			onAccept,
			onReject,
			onViewDiff,
			isEditable = false,
			footer,
		},
		ref,
	) => {
		const [discussion] = useQuery(() =>
			selectDiscussion({ changeSetId: proposal.change_set_id }),
		);
		const discussionRef = useRef<DiscussionHandle>(null);

		// State to track actual change count from the database
		const [actualChangeCount, setActualChangeCount] = useState<number | null>(
			null,
		);

		// Fetch the actual change count from the database when component mounts or proposal changes
		useEffect(() => {
			const fetchChangeCount = async () => {
				if (!proposal.change_set_id) return;

				try {
					const count = await countChangesInChangeSet(proposal.change_set_id);
					setActualChangeCount(count);
				} catch (error) {
					console.error("Error fetching change count:", error);
				}
			};

			fetchChangeCount();
		}, [proposal.change_set_id]);

		// Expose methods from the Discussion component
		useImperativeHandle(ref, () => ({
			getCommentText: () => discussionRef.current?.getCommentText() || "",
			clearCommentText: () => discussionRef.current?.clearCommentText(),
		}));

		// Event handlers
		const handleAccept = () => {
			if (onAccept) {
				onAccept(proposal.id);
			}
		};

		const handleReject = () => {
			if (onReject) {
				onReject(proposal.id);
			}
		};

		const handleExpand = () => {
			if (onExpand) {
				onExpand(proposal.id);
			}
		};

		const handleViewDiff = (e: React.MouseEvent) => {
			e.stopPropagation();
			if (onViewDiff) {
				onViewDiff();
			}
		};

		// Get the first comment if it exists for the proposal title
		const firstComment = discussion?.comments?.[0];

		// For the title, give priority to user-provided version info
		const proposalTitle =
			proposal.from_version && proposal.to_version
				? isEditable
					? "Changes to Propose"
					: `Changes from ${proposal.from_version}`
				: firstComment?.content || `Proposal ${proposal.id.substring(0, 8)}`;

		// Truncate title if it's longer than 50 characters
		const truncatedTitle =
			proposalTitle.length > 50
				? `${proposalTitle.substring(0, 50)}...`
				: proposalTitle;

		// Format the subtitle (versions or timestamp)
		const subtitle =
			proposal.from_version && proposal.to_version
				? `${proposal.from_version} → ${proposal.to_version}`
				: "";

		// Display change count, prioritizing the actual count from the database
		const changeCount = actualChangeCount ?? proposal.change_count ?? 0;

		return (
			<div className="proposal-item mb-2">
				{/* Proposal header - always visible */}
				<div
					className={`flex items-center p-3 cursor-pointer hover:bg-base-200`}
					onClick={handleExpand}
				>
					<div className="w-8 h-8 flex items-center justify-center mr-2 rounded-full bg-base-300">
						<span>
							{proposal.account_name ? getInitials(proposal.account_name) : "U"}
						</span>
					</div>
					<div className="flex-1">
						<div className="text-sm font-medium truncate">{truncatedTitle}</div>
						<div className="text-xs text-muted-foreground">{subtitle}</div>
					</div>
					<ChevronRight
						size={16}
						className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "transform rotate-90" : ""}`}
					/>
				</div>

				{/* Expanded content */}
				{isExpanded && (
					<div>
						{/* Changes count bar with action buttons */}
						<div className="flex items-center justify-between p-2 bg-gray-50">
							<div className="text-sm font-medium">
								<span className="font-bold">{changeCount}</span>{" "}
								{changeCount === 1 ? "change" : "changes"}
							</div>
							<div className="flex items-center gap-2">
								<button
									className="h-8 flex items-center justify-center px-2 rounded hover:bg-gray-200 gap-1 text-sm"
									onClick={handleViewDiff}
									title="View diff"
								>
									<Eye className="h-4 w-4" />
									View diff
								</button>

								{!isEditable && (
									<div className="flex gap-1">
										<button
											className="h-8 flex items-center justify-center px-2 rounded hover:bg-green-100 gap-1 text-sm text-green-600"
											onClick={handleAccept}
											title="Accept proposal"
										>
											<Check className="h-4 w-4" />
											Accept
										</button>
										<button
											className="h-8 flex items-center justify-center px-2 rounded hover:bg-red-100 gap-1 text-sm text-red-600"
											onClick={handleReject}
											title="Reject proposal"
										>
											<X className="h-4 w-4" />
											Reject
										</button>
									</div>
								)}
							</div>
						</div>

						{/* Discussion component */}
						<div className="p-2">
							<Discussion
								ref={discussionRef}
								changeSetId={proposal.change_set_id}
								placeholderText={
									isEditable
										? "Describe the changes you're proposing..."
										: "Add a comment..."
								}
							/>
						</div>

						{/* Custom footer if provided */}
						{footer && <div>{footer}</div>}
					</div>
				)}
			</div>
		);
	},
);

export default ProposalItem;
