import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
	title: string;
	actions?: React.ReactNode;
	children: React.ReactNode;
	onClose?: () => void;
};

export function LeftSidebarTab({ title, actions, children, onClose }: Props) {
	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="sticky top-0 z-10 h-12 pt-1 flex items-center justify-between border-b bg-background px-3 text-sm font-medium">
				<div>{title}</div>
				<div className="flex items-center gap-1">
					{actions ? (
						<div className="flex items-center gap-2">{actions}</div>
					) : null}
					{onClose && (
						<Button
							variant="ghost"
							size="sm"
							className="h-5 w-5 p-0 hover:bg-secondary cursor-pointer"
							onClick={onClose}
							aria-label={`Close ${title}`}
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-2">{children}</div>
		</div>
	);
}
