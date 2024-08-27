import { InlangProject } from "@inlang/sdk2";

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
