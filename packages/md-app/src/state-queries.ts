/**
 * React hooks that use the query-based state management
 * This replaces the Jotai atoms with useQuery-based hooks
 */

import { useQuery } from "./hooks/useQuery";
import {
	selectLix,
	selectActiveVersion,
	selectVersions,
	selectFiles,
	selectActiveAccount,
	selectAccounts,
	selectActiveFile,
	selectLoadedMarkdown,
	selectCheckpointChangeSets,
	selectWorkingChangeSet,
	selectIntermediateChanges,
	selectIsSyncing,
	selectCurrentLixName,
	selectAvailableLixes,
	selectThreads,
	selectChangeDiffs,
} from "./queries";

// URL parameter hooks
export function useFileIdFromUrl() {
	const [fileId] = useQuery(() => {
		const searchParams = new URL(window.location.href).searchParams;
		return Promise.resolve(searchParams.get("f") || undefined);
	}, 100);
	return fileId;
}

export function useLixIdFromUrl() {
	const [lixId] = useQuery(() => {
		const searchParams = new URL(window.location.href).searchParams;
		return Promise.resolve(searchParams.get("lix") || undefined);
	}, 100);
	return lixId;
}

export function useThreadFromUrl() {
	const [threadId] = useQuery(() => {
		const searchParams = new URL(window.location.href).searchParams;
		return Promise.resolve(searchParams.get("t"));
	}, 100);
	return threadId;
}

// Core state hooks
export function useLix() {
	const [lix, loading, error, refetch] = useQuery(() => selectLix(), 250);
	return { lix, loading, error, refetch };
}

export function useActiveVersion() {
	const [version, loading, error] = useQuery(() => selectActiveVersion(), 250);
	return { version, loading, error };
}

export function useVersions() {
	const [versions, loading, error] = useQuery(() => selectVersions(), 1000);
	return { versions: versions || [], loading, error };
}

export function useFiles() {
	const [files, loading, error] = useQuery(() => selectFiles(), 500);
	return { files: files || [], loading, error };
}

export function useActiveAccount() {
	const [account, loading, error] = useQuery(() => selectActiveAccount(), 500);
	return { account, loading, error };
}

export function useAccounts() {
	const [accounts, loading, error] = useQuery(() => selectAccounts(), 1000);
	return { accounts: accounts || [], loading, error };
}

// File-specific hooks
export function useActiveFile() {
	const [file, loading, error] = useQuery(() => selectActiveFile(), 250);
	return { file, loading, error };
}

export function useLoadedMarkdown() {
	const [markdown, loading, error] = useQuery(
		() => selectLoadedMarkdown(),
		250
	);
	return { markdown, loading, error };
}

export function useCheckpointChangeSets() {
	const [checkpoints, loading, error] = useQuery(
		() => selectCheckpointChangeSets(),
		500
	);
	return { checkpoints: checkpoints || [], loading, error };
}

export function useWorkingChangeSet() {
	const [workingChangeSet, loading, error] = useQuery(
		() => selectWorkingChangeSet(),
		250
	);
	return { workingChangeSet, loading, error };
}

export function useIntermediateChanges() {
	const [changes, loading, error] = useQuery(
		() => selectIntermediateChanges(),
		250
	);
	return { changes: changes || [], loading, error };
}

// App-level hooks
export function useIsSyncing() {
	const [isSyncing, loading, error] = useQuery(() => selectIsSyncing(), 1000);
	return { isSyncing: isSyncing || false, loading, error };
}

export function useCurrentLixName() {
	const [name, loading, error] = useQuery(() => selectCurrentLixName(), 1000);
	return { name, loading, error };
}

export function useAvailableLixes() {
	const [lixes, loading, error] = useQuery(() => selectAvailableLixes(), 1000);
	return { lixes: lixes || [], loading, error };
}

// Dynamic hooks that take parameters
export function useThreads(changeSetId: string | undefined) {
	const [threads, loading, error] = useQuery(async () => {
		if (!changeSetId) return [];
		return await selectThreads({ changeSetId });
	}, 500);
	return { threads: threads || [], loading, error };
}

export function useChangeDiffs(
	changeSetId: string | undefined,
	changeSetBeforeId?: string | null
) {
	const [diffs, loading, error] = useQuery(async () => {
		if (!changeSetId) return [];
		return await selectChangeDiffs(changeSetId, changeSetBeforeId);
	}, 500);
	return { diffs: diffs || [], loading, error };
}

// Utility hooks
export function useAvailableLixFilesInOpfs() {
	const [files, loading, error] = useQuery(async () => {
		const { getOriginPrivateDirectory } = await import(
			"native-file-system-adapter"
		);
		const rootHandle = await getOriginPrivateDirectory();
		const availableLixFiles: string[] = [];
		for await (const [name, handle] of rootHandle) {
			if (handle.kind === "file" && name.endsWith(".lix")) {
				availableLixFiles.push(handle.name);
			}
		}
		return availableLixFiles;
	}, 2000);
	return { files: files || [], loading, error };
}

// Global editor reference - keeping this as a simple ref since it doesn't need polling
import { useRef } from "react";
export function useEditorRef() {
	return useRef<any>(null);
}
