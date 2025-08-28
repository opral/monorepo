import * as React from "react";

type Props = {
	title: string;
	actions?: React.ReactNode;
	children: React.ReactNode;
};

export function LeftDockTab({ title, actions, children }: Props) {
	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-3 py-2 text-sm font-medium backdrop-blur">
				<div>{title}</div>
				{actions ? (
					<div className="flex items-center gap-2">{actions}</div>
				) : null}
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-2">{children}</div>
		</div>
	);
}
