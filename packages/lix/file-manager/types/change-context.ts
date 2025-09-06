// types/change-context.ts
export interface User {
	id: string;
	name: string;
	avatar?: string;
}

export interface Comment {
	id: string;
	author: User;
	content: string;
	timestamp: string;
	mentions?: User[];
}

export interface TextDiff {
	text: string;
	type: "added" | "removed" | "unchanged";
	color?: string;
}

export interface ChangeContextItem {
	id: string;
	author: User;
	timestamp: string;
	commentCount: number;
	textDiffs: TextDiff[];
	comments?: Comment[];
}

export interface ChangeContextProps {
	item: ChangeContextItem;
	isExpanded?: boolean;
	isHighlighted?: boolean;
	onToggle?: () => void;
	onCommentClick?: () => void;
	className?: string;
	timeFormatter?: (timestamp: string) => string;
	showComments?: boolean;
	showTopLine?: boolean;
	showBottomLine?: boolean;
}
