import { useState } from "react";
import { OpfsSahEnvironment } from "@lix-js/sdk";
import { RotateCcw, Bug, AlertTriangle } from "lucide-react";

function formatError(err: unknown): string {
	const asAny = err as any;
	try {
		if (!err) return "Unknown error";
		if (err instanceof Error) {
			let out = `${err.name || "Error"}: ${err.message || ""}`;
			if (err.stack) out += "\n" + String(err.stack);
			const cause = asAny?.cause;
			if (cause) out += "\nCaused by: " + formatError(cause);
			const errors = asAny?.errors;
			if (Array.isArray(errors)) {
				for (let i = 0; i < errors.length; i++) {
					out += `\nInner[${i}]: ` + formatError(errors[i]);
				}
			}
			return out;
		}
		return typeof err === "string" ? err : JSON.stringify(err, null, 2);
	} catch {
		return String(err);
	}
}

function containsOpfsHandleConflict(err: unknown): boolean {
	const visited = new Set<unknown>();

	function walk(node: unknown): boolean {
		if (!node || visited.has(node)) return false;
		visited.add(node);
		if (typeof node === "object") {
			const anyNode = node as any;
			const name = anyNode?.name;
			const message =
				typeof anyNode?.message === "string" ? anyNode.message : "";
			if (
				(name === "NoModificationAllowedError" ||
					message.includes("NoModificationAllowedError")) &&
				message.includes("createSyncAccessHandle")
			) {
				return true;
			}
			if (walk(anyNode?.cause)) return true;
			const errors = anyNode?.errors;
			if (Array.isArray(errors)) {
				for (const inner of errors) {
					if (walk(inner)) return true;
				}
			}
		}
		return false;
	}

	return walk(err);
}

/**
 * Minimal error UI shown when Lix fails to load.
 *
 * Provides a destructive action to reset the Origin Private File System (OPFS)
 * using `OpfsStorage.clean()` and then reloads the app. This action deletes
 * ALL OPFS data for this origin and cannot be undone.
 *
 * If this error is unexpected, please contact the developer.
 *
 * @example
 * <ErrorFallback error={new Error("failed to open Lix")} />
 */
export function ErrorFallback(props: { error: unknown }) {
	const [busy, setBusy] = useState(false);

	async function handleReset() {
		if (busy) return;
		const confirmed = window.confirm(
			"This will delete ALL data stored by this site in your browser (OPFS).\n\n" +
				"This cannot be undone and will likely result in data loss.\n\n" +
				"Do you want to proceed?",
		);
		if (!confirmed) return;
		try {
			setBusy(true);
			await OpfsSahEnvironment.clear();
			window.location.reload();
		} catch (e) {
			console.error("Failed to reset OPFS:", e);
			setBusy(false);
			alert("Failed to reset OPFS. See console for details.");
		}
	}

	if (containsOpfsHandleConflict(props.error)) {
		return (
			<div className="min-h-dvh w-full flex items-center justify-center p-6">
				<div className="max-w-lg w-full border rounded-lg p-6 bg-card text-card-foreground">
					<div className="flex items-center gap-2 text-amber-600 mb-3">
						<AlertTriangle className="h-5 w-5" />
						<h1 className="text-lg font-semibold">Flashtype is already open</h1>
					</div>
					<p className="text-sm text-muted-foreground mb-4">
						Flashtype can only be open in one tab at a time. Close other tabs
						where Flashtype is running, then reload this page. If the issue
						persists, please report a bug.
					</p>
					<div className="flex items-center gap-3">
						<button
							onClick={() => window.location.reload()}
							className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
						>
							<RotateCcw className="h-4 w-4" /> Reload this tab
						</button>
						<a
							href="https://github.com/opral/flashtype.ai/issues"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
						>
							<Bug className="h-4 w-4" /> Report bug
						</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-dvh w-full flex items-center justify-center p-6">
			<div className="max-w-xl w-full border rounded-lg p-6 bg-card text-card-foreground">
				<h1 className="text-xl font-semibold mb-2">
					Flashtype failed to start
				</h1>
				<p className="text-sm text-muted-foreground mb-4">
					Lix could not be loaded. This can happen if the lix schema was changed
					in development. If this is unexpected, please contact the developer.
				</p>
				<div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 mb-4">
					<p className="text-sm font-medium text-destructive">
						Warning: resetting storage will delete data and cannot be undone.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleReset}
						disabled={busy}
						className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-white text-sm disabled:opacity-60"
					>
						{busy ? "Resetting…" : "Reset OPFS (data loss)"}
					</button>
					<button
						onClick={() => window.location.reload()}
						className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
					>
						<RotateCcw className="h-4 w-4" /> Reload app
					</button>
					<a
						href="https://github.com/opral/flashtype.ai/issues"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
					>
						<Bug className="h-4 w-4" /> Report bug
					</a>
				</div>
				<div className="mt-4 whitespace-pre-wrap text-xs opacity-80 border rounded p-3 bg-muted/20">
					<div className="font-medium mb-2">Error details</div>
					<pre>{formatError(props.error)}</pre>
				</div>
			</div>
		</div>
	);
}
