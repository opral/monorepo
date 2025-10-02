import { useMemo } from "react";
import { useQuery } from "@lix-js/react-utils";
import { selectFilesystemEntries } from "@/queries";
import { buildFilesystemTree } from "@/lib/build-filesystem-tree";
import type { ViewContext } from "../../types";
import { FileTree } from "./file-tree";

type FilesViewProps = {
	readonly context?: ViewContext;
};

/**
 * Files view - Browse and pin project documents
 */
export function FilesView({ context }: FilesViewProps) {
	const entries = useQuery(({ lix }) => selectFilesystemEntries(lix));
	const nodes = useMemo(() => buildFilesystemTree(entries), [entries]);

	return (
		<FileTree
			nodes={nodes}
			onOpenFile={(path) => context?.onOpenFile?.(path)}
		/>
	);
}
