import { Comment as CommentType } from "../../types/change-context.ts";
import IconComment from "@/components/icons/IconComment.tsx";

interface CommentProps {
	comment: CommentType;
	timeFormatter: (timestamp: string) => string;
}

export const Comment: React.FC<CommentProps> = ({ comment, timeFormatter }) => (
	<div className="flex gap-[19px] px-3 py-2 mt-4 rounded-lg bg-white border border-[#dbdfe7]">
		<IconComment />
		<div className="flex flex-col gap-1 flex-grow">
			<p className="text-base font-medium text-[#141a21]">
				{comment.author.name}, {timeFormatter(comment.timestamp)}
			</p>
			<p className="text-base font-medium text-[#8c9aad]">{comment.content}</p>
		</div>
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="flex-shrink-0"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M15.071 12.7109L9.414 18.3679L8 16.9539L12.95 12.0039L8 7.05389L9.414 5.63989L15.071 11.2969C15.2585 11.4844 15.3638 11.7387 15.3638 12.0039C15.3638 12.2691 15.2585 12.5234 15.071 12.7109Z"
				fill="black"
			/>
		</svg>
	</div>
);
