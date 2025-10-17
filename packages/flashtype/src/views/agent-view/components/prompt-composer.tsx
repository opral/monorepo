import * as React from "react";
import { ArrowUp } from "lucide-react";
import { extractSlashToken } from "../composer-state";

type PromptComposerProps = {
	textAreaId: string;
	value: string;
	setValue(next: string): void;
	setNotice(next: string | null): void;
	setSlashOpen(next: boolean): void;
	setSlashIdx(next: number): void;
	setMentionOpen(next: boolean): void;
	mentionCtx: React.MutableRefObject<{
		start: number;
		end: number;
	} | null>;
	textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
	onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement>;
	updateMention(): void;
	menuFragment: React.ReactNode;
	placeholder: string;
	sendDisabled: boolean;
	onSend(value: string): void;
};

/**
 * Prompt composer textarea with slash-command support.
 */
export function PromptComposer(props: PromptComposerProps) {
	const {
		textAreaId,
		value,
		setValue,
		setNotice,
		setSlashOpen,
		setSlashIdx,
		setMentionOpen,
		mentionCtx,
		textAreaRef,
		onKeyDown,
		updateMention,
		menuFragment,
		placeholder,
		sendDisabled,
		onSend,
	} = props;

	return (
		<div className="relative w-full max-w-3xl overflow-visible rounded-md border border-border/80 bg-background transition focus-within:border-amber-500 focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.35)]">
			<label htmlFor={textAreaId} className="sr-only">
				Ask the assistant
			</label>
			<textarea
				ref={textAreaRef}
				id={textAreaId}
				data-testid="agent-composer-input"
				placeholder={placeholder}
				value={value}
				onChange={(event) => {
					const next = event.target.value;
					const token = extractSlashToken(next);
					setValue(next);
					setNotice(null);
					setSlashOpen(token !== null);
					setSlashIdx(0);
					if (token !== null) {
						setMentionOpen(false);
						mentionCtx.current = null;
					}
				}}
				onKeyDown={onKeyDown}
				onClick={updateMention}
				onSelect={updateMention}
				className="h-28 w-full resize-none border-0 bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none focus-visible:outline-none"
			/>
			{menuFragment ? (
				<div className="absolute left-0 right-0 bottom-full z-[2] mb-2">
					{menuFragment}
				</div>
			) : null}
			<div className="flex justify-end bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
				<button
					type="button"
					onClick={() => onSend(value)}
					disabled={sendDisabled}
					className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
				>
					<ArrowUp className="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	);
}
