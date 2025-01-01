import { ImportFile, InlangProject, loadProjectInMemory, merge } from "@inlang/sdk";
import JSZip from "jszip";
import { supportedPluginKeyType } from "./types.ts";

export const handleDownload = async (
	project: InlangProject | undefined,
	selectedProjectPath: string | undefined
) => {
	const blob = await project!.toBlob();
	const blobUrl = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = blobUrl;
	link.download = selectedProjectPath!;
	document.body.appendChild(link);
	link.dispatchEvent(
		new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window,
		})
	);
	document.body.removeChild(link);
};

export const handleMerge = async (
	project: InlangProject | undefined,
	selectedProjectPath: string | undefined,
	setForceReloadProject: (value: number) => void
) => {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".inlang";
	input.onchange = async (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = async () => {
				const blob = new Blob([reader.result as ArrayBuffer]);
				const incoming = await loadProjectInMemory({ blob });
				// TODO remove workaround for https://github.com/opral/lix-sdk/issues/47
				const opfsRoot = await navigator.storage.getDirectory();
				const fileHandle = await opfsRoot.getFileHandle(selectedProjectPath!, {
					create: true,
				});
				const writable = await fileHandle.createWritable();
				await merge({
					sourceLix: incoming.lix,
					targetLix: project!.lix,
				});
				const mergedBlob = await project!.toBlob();
				await writable.write(mergedBlob);
				await writable.close();
				setForceReloadProject(Date.now());
			};

			reader.readAsArrayBuffer(file);
		}
	};
	input.click();
};

export const handleOpenProject = async (
	setSelectedProjectPath: (fileName: string) => void
) => {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".inlang";
	input.onchange = async (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = async () => {
				const blob = new Blob([reader.result as ArrayBuffer]);
				const opfsRoot = await navigator.storage.getDirectory();
				const fileHandle = await opfsRoot.getFileHandle(file.name, {
					create: true,
				});
				const writable = await fileHandle.createWritable();
				await writable.write(blob);
				await writable.close();
				setSelectedProjectPath(file!.name);
			};
			reader.readAsArrayBuffer(file);
		}
	};
	input.click();
};

// Import
export const selectImportFile = async (acceptedImport: HTMLInputElement["accept"]) => {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = acceptedImport;
	const file = new Promise<File>((resolve) => {
		input.onchange = async (e) => {
			const selectedFile = (e.target as HTMLInputElement).files?.[0];
			if (selectedFile) {
				resolve(selectedFile);
			}
		};
	});
	input.click();
	return file;
};

export const handleImportedFile = async (
	project: InlangProject | undefined,
	file: File,
	locale: string,
	pluginKey: string
) => {
	const reader = new FileReader();
	reader.onload = async () => {
		const file: ImportFile = {
			content:
				typeof reader.result === "string"
					? new TextEncoder().encode(reader.result)
					: new Uint8Array(reader.result as ArrayBuffer),
			locale: locale,
		};
		await project!.importFiles({
			pluginKey,
			files: [file],
		});
	};
	reader.readAsText(file);
};

// Export
const createDownloadLink = (blobUrl: string, fileName: string) => {
	const link = document.createElement("a");
	link.href = blobUrl;
	link.download = fileName;
	document.body.appendChild(link);
	link.dispatchEvent(
		new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window,
		})
	);
	document.body.removeChild(link);
};

const downloadZip = async (files: ImportFile[], fileEnding: string) => {
	const zip = new JSZip();
	files.forEach((file) => {
		zip.file(file.locale + fileEnding, file.content);
	});
	const blob = await zip.generateAsync({ type: "blob" });
	const blobUrl = URL.createObjectURL(blob);
	createDownloadLink(blobUrl, "export.zip");
};

const downloadFile = (file: ImportFile, fileEnding: string) => {
	const blob = new Blob([file.content]);
	const blobUrl = URL.createObjectURL(blob);
	createDownloadLink(blobUrl, file.locale + fileEnding);
};

export const exportFiles = async (
	project: InlangProject | undefined,
	pluginKey: supportedPluginKeyType,
	fileEnding: string
) => {
	const files = await project!.exportFiles({ pluginKey });
	if (files.length > 1) {
		downloadZip(files, fileEnding);
	} else {
		downloadFile(files[0], fileEnding);
	}
};
