import { useState } from "react";
import { LixUploadedFile, uploadFileToLix } from "@/helper/upload-to-lix";
import { toast } from "sonner";
import { lixAtom } from "@/state";
import { useAtom } from "jotai";

export function useLixUpload() {
	const [uploadedFile, setUploadedFile] = useState<LixUploadedFile>();
	const [uploadingFile, setUploadingFile] = useState<File>();
	const [progress, setProgress] = useState<number>(0);
	const [isUploading, setIsUploading] = useState(false);
	const [lix] = useAtom(lixAtom);

	async function uploadFile(file: File) {
		setIsUploading(true);
		setUploadingFile(file);
		setProgress(0);

		try {
			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setProgress((prev) => {
					const newValue = prev + Math.floor(Math.random() * 10);
					return newValue < 90 ? newValue : prev;
				});
			}, 100);

			// Upload file to lix
			const result = await uploadFileToLix(file, lix);

			// Upload complete
			clearInterval(progressInterval);
			setProgress(100);
			setUploadedFile(result);

			// Return result with URL (already configured in uploadFileToLix)
			return result;
		} catch (error) {
			console.error("Error uploading file to lix:", error);
			toast.error("Failed to upload file. Please try again.");
			return null;
		} finally {
			setTimeout(() => {
				setProgress(0);
				setIsUploading(false);
				setUploadingFile(undefined);
			}, 500); // Keep progress at 100% briefly for better UX
		}
	}

	return {
		isUploading,
		progress,
		uploadedFile,
		uploadFile,
		uploadingFile,
	};
}
