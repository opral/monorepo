import * as React from "react";

type ChangeDecisionProps = {
	id: string;
	onAccept(id: string): void;
	onReject(id: string): void;
};

/**
 * Inline approval prompt displayed instead of the composer.
 */
export function ChangeDecisionOverlay(props: ChangeDecisionProps) {
	const { id, onAccept, onReject } = props;
	const acceptButtonRef = React.useRef<HTMLButtonElement | null>(null);
	const rejectButtonRef = React.useRef<HTMLButtonElement | null>(null);

	React.useEffect(() => {
		acceptButtonRef.current?.focus();
	}, []);

	return (
		<div className="w-full max-w-3xl">
			<div className="rounded-md border border-border/80 bg-background px-4 py-3">
				<p className="text-sm font-medium text-foreground/90">
					Accept this change?
				</p>
				<div className="mt-3 flex flex-col gap-2">
					<button
						type="button"
						ref={acceptButtonRef}
						onKeyDown={(event) => {
							if (event.key === "ArrowDown") {
								event.preventDefault();
								rejectButtonRef.current?.focus();
							}
							if (event.key === "Enter") {
								event.preventDefault();
								onAccept(id);
							}
						}}
						onClick={() => onAccept(id)}
						className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-muted"
					>
						1. Yes
					</button>
					<button
						type="button"
						ref={rejectButtonRef}
						onKeyDown={(event) => {
							if (event.key === "ArrowUp") {
								event.preventDefault();
								acceptButtonRef.current?.focus();
							}
							if (event.key === "Enter") {
								event.preventDefault();
								onReject(id);
							}
						}}
						onClick={() => onReject(id)}
						className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-muted"
					>
						2. No
					</button>
				</div>
			</div>
		</div>
	);
}
