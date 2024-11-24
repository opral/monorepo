// components/ChangeContext.tsx
import React, { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils.ts";
import { Avatar, AvatarImage } from "./../../components/ui/avatar.tsx";
import { CommentCounter } from "./CommentCounter.tsx";
import { ExpandButton } from "./ExpandButton.tsx";
import {
	ChangeContextProps,
	Comment,
	TextDiff,
} from "../../types/change-context.ts";
import IconComment from "./icons/IconComment.tsx";
import IconArrowRight from "./icons/IconArrowRight.tsx";

interface LineProps {
	showTopLine?: boolean;
	showBottomLine?: boolean;
}

export const ChangeContext: React.FC<ChangeContextProps & LineProps> = ({
	item,
	isExpanded = false,
	onToggle,
	onCommentClick,
	timeFormatter = (timestamp) =>
		formatDistanceToNow(new Date(timestamp), { addSuffix: true }),
	showComments = true,
	showTopLine = false,
	showBottomLine = true,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isExpandedState, setIsExpandedState] = useState(isExpanded);

	const handleToggle = () => {
		const newState = !isExpandedState;
		setIsExpandedState(newState);
		onToggle?.();
	};

	const formattedTime = useMemo(
		() => timeFormatter(item.timestamp),
		[item.timestamp, timeFormatter]
	);

	const renderTextDiffs = (textDiffs: TextDiff[]) => (
		<div className="flex flex-col justify-start items-start gap-2 sm:gap-3 w-full">
			<p className="w-full text-sm sm:text-base font-medium text-left break-words">
				{textDiffs.map((diff, index) => (
					<span
						key={index}
						className={cn(
							"w-full font-medium text-left",
							diff.type === "added" && "text-green-600",
							diff.type === "removed" && "text-[#dc2625]",
							diff.type === "unchanged" && "text-[#141a21]"
						)}
					>
						{diff.text}
					</span>
				))}
			</p>
			<p className="w-full text-sm sm:text-base font-medium text-left text-[#8c9aad]">
				by {item.author.name}, {formattedTime}
			</p>
		</div>
	);

	const renderLatestComment = (latestComment: Comment) => {
		return (
			<div className="w-full mt-4 px-3 py-2 rounded-lg bg-white border border-[#dbdfe7]">
				<div
					className="flex gap-[19px] cursor-pointer items-center"
					onClick={() => onCommentClick?.()}
				>
					<IconComment />
					<div className="flex flex-col gap-1 flex-grow min-w-0">
						<p className="text-base font-medium text-[#141a21]">
							{latestComment.author.name},{" "}
							{timeFormatter(latestComment.timestamp)}
						</p>
						<p className="text-base font-medium text-[#8c9aad]">
							{latestComment.content}
						</p>
					</div>
					<IconArrowRight />
				</div>
			</div>
		);
	};

	return (
		<div
			className="flex flex-col justify-start items-start w-full max-w-3xl px-2 sm:px-2.5 rounded-md cursor-pointer"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleToggle}
		>
			<div className="flex justify-between items-center w-full h-12">
				{/* Left side */}
				<div className="flex justify-start items-center gap-2 sm:gap-3">
					<div className="flex flex-col justify-center items-center self-stretch relative h-12">
						{/* Top line */}
						{showTopLine && (
							<div className="absolute top-0 left-[2.5px] w-0.5 bg-[#dbdfe7] h-[20px]" />
						)}

						{/* Dot */}
						<div className="w-[7px] h-[7px] rounded-full bg-[#141a21] absolute top-[20px] left-[0px]" />

						{/* Bottom line */}
						{showBottomLine && (
							<div className="absolute top-[27px] left-[2.5px] w-0.5 bg-[#dbdfe7] h-[calc(100%-27px)]" />
						)}
					</div>
					<div className="flex justify-start items-center relative gap-2 sm:gap-3 pl-1">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="w-5 h-5 sm:w-6 sm:h-6"
						>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M5.77778 4C5.30628 4 4.8541 4.1873 4.5207 4.5207C4.1873 4.8541 4 5.30628 4 5.77778V18.2222C4 18.6937 4.1873 19.1459 4.5207 19.4793C4.8541 19.8127 5.30628 20 5.77778 20H18.2222C18.6937 20 19.1459 19.8127 19.4793 19.4793C19.8127 19.1459 20 18.6937 20 18.2222V5.77778C20 5.30628 19.8127 4.8541 19.4793 4.5207C19.1459 4.1873 18.6937 4 18.2222 4H5.77778ZM5.77778 5.77778H18.2222V18.2222H5.77778V5.77778Z"
								fill="#8C9AAD"
							/>
						</svg>
						<span className="text-sm sm:text-base font-medium text-[#424b51] hidden sm:block">
							Change Context
						</span>
					</div>
				</div>

				{/* Right side */}
				<div className="flex justify-end items-center gap-2 sm:gap-3">
					<CommentCounter
						count={item.commentCount}
						onClick={() => {
							onCommentClick?.();
						}}
					/>
					<span className="text-xs sm:text-sm font-medium text-[#8c9aad] hidden sm:block">
						{formattedTime}
					</span>
					<Avatar className="w-5 h-5 sm:w-6 sm:h-6">
						<AvatarImage src={item.author.avatar} alt={item.author.name} />
					</Avatar>
					<ExpandButton
						isExpanded={isExpandedState}
						onClick={() => {
							handleToggle();
						}}
						isHovered={isHovered}
					/>
				</div>
			</div>

			{isExpandedState && (
				<div className="flex justify-between items-start w-full">
					<div className="flex justify-start items-start w-full gap-2 sm:gap-3">
						<div className="flex flex-col justify-center items-center self-stretch w-[7px] relative gap-0.5">
							<div className="flex-grow w-0.5 bg-[#dbdfe7]" />
						</div>
						<div className="flex flex-col justify-center items-start w-full gap-4 sm:gap-6 px-2 sm:px-3 pt-2 pb-6 sm:pb-8">
							{renderTextDiffs(item.textDiffs)}
							{showComments &&
								item.comments &&
								item.comments.length > 0 &&
								renderLatestComment(item.comments[0])}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
