import { cn } from "@/lib/utils";

type CheckpointFormProps = {
	message: string;
	onMessageChange: (message: string) => void;
	onCreateCheckpoint: () => void;
};

/**
 * Form for composing a new checkpoint message and triggering creation.
 *
 * @example
 * <CheckpointForm message={message} onMessageChange={setMessage} onCreateCheckpoint={handleCreate} />
 */
export function CheckpointForm({
	message,
	onMessageChange,
	onCreateCheckpoint,
}: CheckpointFormProps) {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onCreateCheckpoint();
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2 py-3">
			<div className="relative">
				<textarea
					placeholder="Checkpoint message"
					value={message}
					onChange={(e) => onMessageChange(e.target.value)}
					rows={4}
					className="w-full resize-none rounded-md border border-input bg-transparent pl-3 pr-28 pt-3 pb-3 text-[11px] leading-4 text-foreground shadow-none outline-none"
				/>
				<button
					type="submit"
					disabled={!message.trim()}
					className={cn(
						"absolute bottom-3 right-3 z-10 inline-flex items-center rounded-md border px-3 py-1.5 text-[11px] font-medium transition-colors",
						"border-input bg-transparent text-neutral-500",
						message.trim() && "bg-neutral-200 text-neutral-900",
					)}
				>
					Create
				</button>
			</div>
		</form>
	);
}
