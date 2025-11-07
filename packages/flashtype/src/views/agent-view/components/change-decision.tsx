import * as React from "react";

type ChangeDecisionProps = {
	id: string;
	onAccept(id: string): void;
	onAcceptAlways(id: string): void;
	onReject(id: string): void;
};

/**
 * Inline approval prompt displayed instead of the composer.
 */
export function ChangeDecisionOverlay(props: ChangeDecisionProps) {
	const { id, onAccept, onAcceptAlways, onReject } = props;
	const acceptButtonRef = React.useRef<HTMLButtonElement | null>(null);
	const acceptAlwaysButtonRef = React.useRef<HTMLButtonElement | null>(null);
	const rejectButtonRef = React.useRef<HTMLButtonElement | null>(null);

	React.useEffect(() => {
		acceptButtonRef.current?.focus();
	}, []);

	return (
		<div className="w-full max-w-3xl">
			<div className="rounded-lg border border-border/70 bg-transparent px-4 py-3">
				<p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
					Accept these changes?
				</p>
				<div className="mt-3 flex flex-col gap-2 text-sm text-foreground/90">
					<button
						type="button"
						ref={acceptButtonRef}
						onKeyDown={(event) => {
							if (event.key === "ArrowDown") {
								event.preventDefault();
								acceptAlwaysButtonRef.current?.focus();
							}
							if (event.key === "ArrowUp") {
								event.preventDefault();
								rejectButtonRef.current?.focus();
							}
							if (event.key === "Enter") {
								event.preventDefault();
								onAccept(id);
							}
						}}
						onClick={() => onAccept(id)}
						className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-left text-xs font-medium text-foreground transition hover:bg-muted/60 focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-foreground/30"
					>
						1. Yes
					</button>
					<button
						type="button"
						ref={acceptAlwaysButtonRef}
						onKeyDown={(event) => {
							if (event.key === "ArrowDown") {
								event.preventDefault();
								rejectButtonRef.current?.focus();
							}
							if (event.key === "ArrowUp") {
								event.preventDefault();
								acceptButtonRef.current?.focus();
							}
							if (event.key === "Enter") {
								event.preventDefault();
								onAcceptAlways(id);
							}
						}}
						onClick={() => onAcceptAlways(id)}
						className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-left text-xs font-medium text-foreground transition hover:bg-muted/60 focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-foreground/30"
					>
						2. Yes, and don't ask again
					</button>
					<button
						type="button"
						ref={rejectButtonRef}
						onKeyDown={(event) => {
							if (event.key === "ArrowUp") {
								event.preventDefault();
								acceptAlwaysButtonRef.current?.focus();
							}
							if (event.key === "ArrowDown") {
								event.preventDefault();
								acceptButtonRef.current?.focus();
							}
							if (event.key === "Enter") {
								event.preventDefault();
								onReject(id);
							}
						}}
						onClick={() => onReject(id)}
						className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-left text-xs font-medium text-foreground transition hover:bg-muted/60 focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-foreground/30"
					>
						3. No
					</button>
				</div>
			</div>
		</div>
	);
}
