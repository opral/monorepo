import {
	discussionSearchParamsAtom,
	fileIdSearchParamsAtom,
	filesAtom,
	lixAtom,
} from "@/state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import {
	activeFileAtom,
	checkpointChangeSetsAtom,
	intermediateChangesAtom,
} from "@/state-active-file.ts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lix, openLixInMemory, toBlob } from "@lix-js/sdk";
import { posthog } from "posthog-js";

const isMdFile = (path: string) => {
	return path.toLowerCase().endsWith(".md");
};

const getFileExtension = (path: string) => {
	const parts = path.split(".");
	return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
};

export default function Page() {
	// state atoms
	const [lix] = useAtom(lixAtom);
	const [files] = useAtom(filesAtom);
	const [intermediateChanges] = useAtom(intermediateChangesAtom);
	const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [fileIdSearchParams] = useAtom(fileIdSearchParamsAtom);
	const [discussionSearchParams] = useAtom(discussionSearchParamsAtom);
	const [searchParams] = useSearchParams();

	//hooks
	const navigate = useNavigate();

	// handlers
	const handleImport = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				await lix.db
					.insertInto("file")
					.values({
						path: "/" + file.name,
						data: new Uint8Array(await file.arrayBuffer()),
					})
					.execute();
				posthog.capture("File Imported", {
					fileName: file.name,
				});
				await saveLixToOpfs({ lix });
			}
		};
		input.click();
	};

	const handleOpenLixFile = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const fileContent = await file.arrayBuffer();
				const opfsRoot = await navigator.storage.getDirectory();
				const lix = await openLixInMemory({
					blob: new Blob([fileContent]),
				});
				const lixId = await lix.db
					.selectFrom("key_value")
					.where("key", "=", "lix_id")
					.select("value")
					.executeTakeFirstOrThrow();

				const opfsFile = await opfsRoot.getFileHandle(`${lixId.value}.lix`, {
					create: true,
				});
				const writable = await opfsFile.createWritable();
				await writable.write(fileContent);
				await writable.close();
				navigate("?l=" + lixId.value);
			}
		};
		input.click();
	};

	const handleMerge = async () => {
		if (!lix) return;

		try {
			// Open file picker for .lix files
			const input = document.createElement("input");
			input.type = "file";
			// TODO: Add .lix to accept
			// input.accept = ".lix";

			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;

				// Read the file and merge it
				const reader = new FileReader();
				reader.onload = async (event) => {
					const content = event.target?.result;
					if (!content || typeof content !== "string") return;

					try {
						// TODO: Implement actual merge logic here
						alert("Merge functionality not yet implemented");
					} catch (error) {
						console.error("Merge failed:", error);
					}
				};
				reader.readAsText(file);
			};

			input.click();
		} catch (error) {
			console.error("Merge failed:", error);
			alert("Merge failed. See console for details.");
		}
	};

	const handleBackgroundClick = async (e: React.MouseEvent) => {
		// Only trigger if clicking the background container itself
		if (e.target === e.currentTarget) {
			const newParams = new URLSearchParams(searchParams);
			const openLix = newParams.get("l");
			navigate(`/?l=${openLix}`);
		}
	};

	const handleExportLixFile = async (lix: Lix) => {
		const lixId = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_id")
			.select("value")
			.executeTakeFirstOrThrow();

		const blob = await toBlob({ lix });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${lixId.value}.lix`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	return (
		<div className="flex bg-white h-full">
			Test
		</div>
	);
}

