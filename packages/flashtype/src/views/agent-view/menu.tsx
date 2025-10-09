import { memo } from "react";
import type { SlashCommand } from "./commands";

export type MentionMenuProps = {
	readonly items: readonly string[];
	readonly selectedIndex: number;
};

/**
 * Lightweight mention dropdown inspired by Claude Code's UI.
 */
export const MentionMenu = memo(function MentionMenu({
	items,
	selectedIndex,
}: MentionMenuProps) {
	if (items.length === 0) return null;
	return (
		<div className="pointer-events-auto max-h-64 overflow-auto rounded-md border border-border/50 bg-white text-[13px] leading-[1.5] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
			{items.map((item, index) => {
				const active = index === selectedIndex;
				return (
					<div
						key={`${item}_${index}`}
						className={[
							"px-3 py-1.5",
							active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700",
						].join(" ")}
					>
						{item}
					</div>
				);
			})}
		</div>
	);
});

export type CommandMenuProps = {
	readonly commands: readonly SlashCommand[];
	readonly selectedIndex: number;
};

/**
 * Simple slash command dropdown mirroring Claude Code styling cues.
 */
export const CommandMenu = memo(function CommandMenu({
	commands,
	selectedIndex,
}: CommandMenuProps) {
	if (commands.length === 0) {
		return (
			<div className="pointer-events-auto rounded-md border border-border/50 bg-white px-3 py-2 text-[13px] text-zinc-500 shadow-md">
				No commands
			</div>
		);
	}
	return (
		<div className="pointer-events-auto max-h-56 overflow-auto rounded-md border border-border/50 bg-white text-[13px] leading-[1.5] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
			{commands.map((cmd, index) => {
				const active = index === selectedIndex;
				return (
					<div
						key={cmd.name}
						className={[
							"grid grid-cols-[max-content_1fr] items-start gap-3 px-3 py-1.5",
							active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700",
						].join(" ")}
					>
						<div className="font-semibold">/{cmd.name}</div>
						<div className="text-zinc-500">{cmd.description}</div>
					</div>
				);
			})}
		</div>
	);
});
