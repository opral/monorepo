import { useState, useCallback } from "react";
import {
	LixUploadedFile,
	uploadFileToLix,
	checkDuplicateImage,
	replaceImageInLix,
	getFileFromLix,
} from "@/helper/uploadToLix";
import { toast } from "sonner";
import { lixAtom } from "@/state";
import { useAtom } from "jotai";

export function useLixUpload() {
	const [uploadedFile, setUploadedFile] = useState<LixUploadedFile>();
	const [uploadingFile, setUploadingFile] = useState<File>();
	const [progress, setProgress] = useState<number>(0);
	const [isUploading, setIsUploading] = useState(false);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [duplicateInfo, setDuplicateInfo] = useState<{fileName: string, fileId: string} | null>(null);
	const [lix] = useAtom(lixAtom);

	// Function to process pending file after duplicate resolution
	const processPendingFile = useCallback(async (file: File) => {
		if (!file) return null;

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
	}, [lix]);
	
	// Function to replace existing image
	const handleReplaceImage = useCallback(async () => {
		if (!pendingFile || !duplicateInfo) return null;
		
		setIsUploading(true);
		setUploadingFile(pendingFile);
		setProgress(0);
		
		try {
			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				setProgress((prev) => {
					const newValue = prev + Math.floor(Math.random() * 10);
					return newValue < 90 ? newValue : prev;
				});
			}, 100);
			
			// Replace the image in Lix
			const result = await replaceImageInLix(duplicateInfo.fileId, pendingFile, lix);
			
			// Upload complete
			clearInterval(progressInterval);
			setProgress(100);
			setUploadedFile(result);
			
			// Success notification
			toast.success("Image replaced successfully");
			
			// Clean up
			setDuplicateDialogOpen(false);
			setPendingFile(null);
			setDuplicateInfo(null);
			
			return result;
		} catch (error) {
			console.error("Error replacing image:", error);
			toast.error("Failed to replace image. Please try again.");
			return null;
		} finally {
			setTimeout(() => {
				setProgress(0);
				setIsUploading(false);
				setUploadingFile(undefined);
			}, 500); // Keep progress at 100% briefly for better UX
		}
	}, [pendingFile, duplicateInfo, lix]);
	
	// Function to keep existing image
	const handleKeepImage = useCallback(() => {
		// Get the existing file and return it
		const getExistingFile = async () => {
			if (!duplicateInfo) return null;
			
			try {
				// Get existing file data
				const fileBlob = await getFileFromLix(duplicateInfo.fileId, lix);
				if (!fileBlob) {
					toast.error("Could not retrieve existing file");
					return null;
				}
				
				// Create URL for existing file
				const serverUrl = "https://lix.host";
				const lixIdRecord = await lix.db
					.selectFrom("key_value")
					.where("key", "=", "lix_id")
					.select("value")
					.executeTakeFirst();
				
				const lixId = lixIdRecord?.value;
				
				// Return the existing file information
				const existingFile: LixUploadedFile = {
					id: duplicateInfo.fileId,
					key: duplicateInfo.fileId,
					name: duplicateInfo.fileName,
					size: fileBlob.size,
					type: fileBlob.type,
					url: `${serverUrl}?l=${lixId}&f=${duplicateInfo.fileId}`
				};
				
				// Set as the uploaded file so the editor can use it
				setUploadedFile(existingFile);
				
				// Success notification
				toast.success("Using existing image");
				
				return existingFile;
			} catch (error) {
				console.error("Error retrieving existing file:", error);
				toast.error("Failed to retrieve existing file");
				return null;
			} finally {
				// Clean up dialog state
				setDuplicateDialogOpen(false);
				setPendingFile(null);
				setDuplicateInfo(null);
				setIsUploading(false);
				setUploadingFile(undefined);
			}
		};
		
		// Start process of retrieving existing file
		void getExistingFile();
		
		return null;
	}, [duplicateInfo, lix]);
	
	// Main upload function that checks for duplicates
	const uploadFile = useCallback(async (file: File) => {
		if (!file) return null;
		
		// First check if a file with the same name already exists
		const duplicateCheck = await checkDuplicateImage(file.name, lix);
		
		if (duplicateCheck.exists && duplicateCheck.existingFile) {
			// Store file info and show dialog
			setPendingFile(file);
			setDuplicateInfo({
				fileName: file.name,
				fileId: duplicateCheck.existingFile.id
			});
			setDuplicateDialogOpen(true);
			return null; // Don't complete upload yet
		}
		
		// No duplicate, proceed with upload
		return processPendingFile(file);
	}, [lix, processPendingFile]);

	return {
		isUploading,
		progress,
		uploadedFile,
		uploadFile,
		uploadingFile,
		// Duplicate image dialog related
		duplicateDialogOpen,
		duplicateInfo,
		handleReplaceImage,
		handleKeepImage,
	};
}
