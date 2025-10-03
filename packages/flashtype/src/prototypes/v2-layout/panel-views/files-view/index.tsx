import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLix, useQuery } from "@lix-js/react-utils";
import { nanoId, normalizeDirectoryPath, normalizeFilePath } from "@lix-js/sdk";
import { selectFilesystemEntries } from "@/queries";
import { buildFilesystemTree } from "@/lib/build-filesystem-tree";
import type { ViewContext } from "../../types";
import { FileTree } from "./file-tree";

type FilesViewProps = {
	readonly context?: ViewContext;
};

type DraftState = {
	kind: "file" | "directory";
	directoryPath: string;
	value: string;
} | null;

/**
 * Files view - Browse and pin project documents. Owns the Cmd/Ctrl + . shortcut
 * that opens the inline creation prompt for a new markdown file. File paths are
 * percent-encoded before writing to Lix (see `encodePathSegment`) and decoded
 * when rendered in the UI, so callers must perform the matching decode step.
 *
 * @example
 * <FilesView context={{ onOpenFile: (path) => console.log(path) }} />
 */
export function FilesView({ context }: FilesViewProps) {
	const lix = useLix();
	const entries = useQuery(({ lix }) => selectFilesystemEntries(lix));
	const nodes = useMemo(() => buildFilesystemTree(entries ?? []), [entries]);
	const creatingRef = useRef(false);
	const [pendingPaths, setPendingPaths] = useState<string[]>([]);
	const [pendingDirectoryPaths, setPendingDirectoryPaths] = useState<string[]>(
		[],
	);
	const [draft, setDraft] = useState<DraftState>(null);
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const entryPathSet = useMemo(() => {
		return new Set(
			(entries ?? [])
				.filter((entry) => entry.kind === "file")
				.map((entry) => normalizeFilePath(entry.path)),
		);
	}, [entries]);
	const entryDirectorySet = useMemo(() => {
		return new Set(
			(entries ?? [])
				.filter((entry) => entry.kind === "directory")
				.map((entry) =>
					entry.path === "/" ? "/" : normalizeDirectoryPath(entry.path),
				),
		);
	}, [entries]);
	const existingFilePaths = useMemo(() => {
		const combined = new Set(entryPathSet);
		for (const path of pendingPaths) {
			combined.add(path);
		}
		return combined;
	}, [entryPathSet, pendingPaths]);
	const existingDirectoryPaths = useMemo(() => {
		const combined = new Set(entryDirectorySet);
		for (const path of pendingDirectoryPaths) {
			combined.add(path);
		}
		return combined;
	}, [entryDirectorySet, pendingDirectoryPaths]);

	useEffect(() => {
		if (pendingPaths.length === 0) return;
		setPendingPaths((prev) => prev.filter((path) => !entryPathSet.has(path)));
	}, [entryPathSet, pendingPaths.length]);
	useEffect(() => {
		if (pendingDirectoryPaths.length === 0) return;
		setPendingDirectoryPaths((prev) =>
			prev.filter((path) => !entryDirectorySet.has(path)),
		);
	}, [entryDirectorySet, pendingDirectoryPaths.length]);
	const isMacPlatform = useMemo(() => detectMacPlatform(), []);
	const isPanelFocused = context?.isPanelFocused ?? false;

	const resolveDraftDirectory = useCallback(() => {
		if (!selectedPath) return "/";
		if (selectedPath.endsWith("/")) return selectedPath;
		const parts = selectedPath.split("/").filter(Boolean);
		if (parts.length <= 1) return "/";
		return `/${parts.slice(0, -1).join("/")}/`;
	}, [selectedPath]);

	const handleDraftChange = useCallback((next: string) => {
		setDraft((prev) => (prev ? { ...prev, value: next } : prev));
	}, []);

	const handleDraftCancel = useCallback(() => {
		setDraft(null);
	}, []);

	const handleDraftCommit = useCallback(async () => {
		if (creatingRef.current) return;
		if (!draft) return;
		const executeFileCreation = async () => {
			const path = deriveMarkdownPathFromStem(
				draft.value,
				draft.directoryPath,
				existingFilePaths,
			);
			if (!path) {
				setDraft(null);
				return;
			}
			creatingRef.current = true;
			try {
				const id = await nanoId({ lix });
				await lix.db
					.insertInto("file")
					.values({
						id,
						path,
						data: new TextEncoder().encode(""),
					})
					.execute();
				setPendingPaths((prev) => [...prev, path]);
				setSelectedPath(path);
				context?.onOpenFile?.(path);
			} catch (error) {
				console.error("Failed to create file", error);
			} finally {
				creatingRef.current = false;
				setDraft(null);
			}
		};

		const executeDirectoryCreation = async () => {
			const path = deriveDirectoryPathFromStem(
				draft.value,
				draft.directoryPath,
				existingDirectoryPaths,
			);
			if (!path) {
				setDraft(null);
				return;
			}
			creatingRef.current = true;
			try {
				await lix.db
					.insertInto("directory")
					.values({ path } as any)
					.execute();
				setPendingDirectoryPaths((prev) => [...prev, path]);
				setSelectedPath(path);
			} catch (error) {
				console.error("Failed to create directory", error);
			} finally {
				creatingRef.current = false;
				setDraft(null);
			}
		};

		if (draft.kind === "directory") {
			return executeDirectoryCreation();
		}
		return executeFileCreation();
	}, [context, draft, existingDirectoryPaths, existingFilePaths, lix]);

	const handleOpenFile = useCallback(
		(path: string) => {
			setSelectedPath(path);
			context?.onOpenFile?.(path);
		},
		[context],
	);

	const handleSelectItem = useCallback((path: string) => {
		setSelectedPath(path);
	}, []);

	useEffect(() => {
		const listener = (event: KeyboardEvent) => {
			const usesPrimaryModifier = isMacPlatform
				? event.metaKey && !event.ctrlKey
				: event.ctrlKey && !event.metaKey;
			if (!usesPrimaryModifier || event.altKey) return;
			const isTrigger =
				event.key === "." || event.code?.toLowerCase() === "period";
			if (!isTrigger) return;
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation?.();
			event.returnValue = false;
			if (
				event.type === "keydown" &&
				!event.repeat &&
				!isInteractiveTarget(event.target)
			) {
				const kind = event.shiftKey ? "directory" : "file";
				const baseDirectory = resolveDraftDirectory();
				const directoryPath =
					baseDirectory === "/" ? "/" : normalizeDirectoryPath(baseDirectory);
				setDraft((prev) => {
					if (prev) return prev;
					setSelectedPath(null);
					return {
						kind,
						directoryPath,
						value: kind === "directory" ? "new-directory" : "new-file",
					};
				});
			}
		};

		const options: AddEventListenerOptions = { capture: true, passive: false };
		const eventTypes: Array<"keydown" | "keypress" | "keyup"> = [
			"keydown",
			"keypress",
			"keyup",
		];
		const targets: EventTarget[] = [window, document];
		if (document.body) {
			targets.push(document.body);
		}
		for (const target of targets) {
			for (const type of eventTypes) {
				target.addEventListener(type, listener as EventListener, options);
			}
		}
		return () => {
			for (const target of targets) {
				for (const type of eventTypes) {
					target.removeEventListener(type, listener as EventListener, options);
				}
			}
		};
	}, [isMacPlatform, resolveDraftDirectory]);

	return (
		<FileTree
			nodes={nodes}
			onOpenFile={handleOpenFile}
			onSelectItem={handleSelectItem}
			selectedPath={selectedPath ?? undefined}
			isPanelFocused={isPanelFocused}
			draft={
				draft
					? {
							kind: draft.kind,
							directoryPath: draft.directoryPath,
							value: draft.value,
							onChange: handleDraftChange,
							onCommit: handleDraftCommit,
							onCancel: handleDraftCancel,
						}
					: null
			}
		/>
	);
}

function isInteractiveTarget(target: EventTarget | null): boolean {
	if (!target || !(target instanceof HTMLElement)) {
		return false;
	}
	if (target.isContentEditable) return true;
	const tagName = target.tagName;
	if (tagName === "INPUT" || tagName === "TEXTAREA") {
		return true;
	}
	return Boolean(target.closest("input, textarea, [contenteditable]"));
}

function detectMacPlatform(): boolean {
	if (typeof navigator === "undefined") return false;
	const platformCandidates = [
		((navigator as any).userAgentData?.platform as string | undefined) ?? null,
		navigator.platform ?? null,
		navigator.userAgent ?? null,
	].filter(Boolean) as string[];
	const combined = platformCandidates.join(" ").toLowerCase();
	return /mac|iphone|ipad|ipod/.test(combined);
}

function deriveMarkdownPathFromStem(
	stem: string,
	directory: string,
	existingPaths: Set<string>,
): string | null {
	const safeStem = (stem ?? "").trim().replaceAll("/", "");
	const baseStem = safeStem.length ? safeStem : "untitled";
	const encodedStem = encodePathSegment(baseStem);
	const finalStem = encodedStem.length ? encodedStem : "untitled";
	const sanitizedDirectory =
		directory === "/"
			? "/"
			: directory.endsWith("/")
				? directory
				: `${directory}/`;
	const primary = normalizeFilePath(`${sanitizedDirectory}${finalStem}.md`);
	if (!existingPaths.has(primary)) {
		return primary;
	}
	let suffix = 2;
	while (suffix < 1000) {
		const candidate = normalizeFilePath(
			`${sanitizedDirectory}${finalStem} (${suffix}).md`,
		);
		if (!existingPaths.has(candidate)) {
			return candidate;
		}
		suffix += 1;
	}
	return null;
}

/**
 * Percent-encode a path segment so it satisfies Lix's file path constraints.
 *
 * @example
 * encodePathSegment("hello world"); // "hello%20world"
 */
function encodePathSegment(segment: string): string {
	return Array.from(segment)
		.map((char) => {
			if (/^[\p{L}\p{N}._~%-]$/u.test(char)) {
				return char;
			}
			const codePoint = char.codePointAt(0);
			if (codePoint === undefined) {
				return "";
			}
			if (codePoint <= 0xff) {
				return `%${codePoint.toString(16).padStart(2, "0")}`.toUpperCase();
			}
			return Array.from(new TextEncoder().encode(char))
				.map((byte) => `%${byte.toString(16).padStart(2, "0")}`.toUpperCase())
				.join("");
		})
		.join("");
}

function deriveDirectoryPathFromStem(
	stem: string,
	directory: string,
	existingPaths: Set<string>,
): string | null {
	const safeStem = (stem ?? "").trim().replaceAll("/", "");
	const baseStem = safeStem.length ? safeStem : "untitled";
	const encodedStem = encodePathSegment(baseStem);
	const finalStem = encodedStem.length ? encodedStem : "untitled";
	const sanitizedDirectory =
		directory === "/"
			? "/"
			: directory.endsWith("/")
				? directory
				: `${directory}/`;
	const primary = normalizeDirectoryPath(`${sanitizedDirectory}${finalStem}/`);
	if (!existingPaths.has(primary)) {
		return primary;
	}
	let suffix = 2;
	while (suffix < 1000) {
		const candidate = normalizeDirectoryPath(
			`${sanitizedDirectory}${finalStem} (${suffix})/`,
		);
		if (!existingPaths.has(candidate)) {
			return candidate;
		}
		suffix += 1;
	}
	return null;
}
