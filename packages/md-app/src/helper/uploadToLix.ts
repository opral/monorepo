import { Lix } from "@lix-js/sdk";
import { nanoid } from "@udecode/plate";

// Custom event for image updates
export const IMAGE_REPLACED_EVENT = "lix-image-replaced";

export interface LixUploadedFile {
	id: string;
	key: string;
	name: string;
	size: number;
	type: string;
	url: string;
}

// Interface for the check duplicate result
export interface CheckDuplicateResult {
	exists: boolean;
	existingFile?: {
		id: string;
		path: string;
	};
}

/**
 * Uploads a file to the lix database and returns a reference to it
 */
export async function uploadFileToLix(
	file: File,
	lix: Lix
): Promise<LixUploadedFile> {
	const fileBuffer = await file.arrayBuffer();
	const fileId = nanoid();

	// Store the file in the database
	try {
		console.log("Inserting file with ID:", fileId);

		// Always insert the file
		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: `/${file.name}`,
				data: new Uint8Array(fileBuffer),
				metadata: {
					mime_type: file.type,
					size: file.size,
				},
			})
			.execute();

		console.log("File inserted successfully");
	} catch (error) {
		console.error("Error inserting into file table:", error);
		throw error;
	}

	// Create a URL that can be used to retrieve the file
	// Format: https://lix.host?lix={lixId}&f={fileId}
	const serverUrl = "https://lix.host";

	// Get the lix ID from key_value table
	const lixIdRecord = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirst();

	const lixId = lixIdRecord?.value;
	const fileUrl = `${serverUrl}?lix=${lixId}&f=${fileId}`;

	// Log for debugging
	console.log("Created file URL:", fileUrl);

	return {
		id: fileId,
		key: fileId,
		name: file.name,
		size: file.size,
		type: file.type,
		url: fileUrl,
	};
}

/**
 * Check if a file with the same name already exists
 */
export async function checkDuplicateImage(
	fileName: string,
	lix: Lix
): Promise<CheckDuplicateResult> {
	try {
		// Search for a file with the same name (path)
		const existingFile = await lix.db
			.selectFrom("file")
			.where("path", "=", `/${fileName}`)
			.select(["id", "path"])
			.executeTakeFirst();

		if (existingFile) {
			return {
				exists: true,
				existingFile: {
					id: existingFile.id,
					path: existingFile.path,
				},
			};
		}

		return { exists: false };
	} catch (error) {
		console.error("Error checking for duplicate image:", error);
		return { exists: false };
	}
}

/**
 * Replace an existing image with a new one
 */
export async function replaceImageInLix(
	existingId: string,
	newFile: File,
	lix: Lix
): Promise<LixUploadedFile> {
	const fileBuffer = await newFile.arrayBuffer();

	// Update the existing file entry
	try {
		await lix.db
			.updateTable("file")
			.where("id", "=", existingId)
			.set({
				data: new Uint8Array(fileBuffer),
				metadata: {
					mime_type: newFile.type,
					size: newFile.size,
				},
			})
			.execute();

		// Create a URL that can be used to retrieve the file
		const serverUrl = "https://lix.host";

		// Get the lix ID for the URL
		const lixIdRecord = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_id")
			.select("value")
			.executeTakeFirst();

		const lixId = lixIdRecord?.value;
		const fileUrl = `${serverUrl}?lix=${lixId}&f=${existingId}`;

		// Dispatch event to notify any image components showing this file
		// that they should refresh (avoids caching issues)
		dispatchImageReplacedEvent(existingId);

		// Log for debugging
		console.log("Updated existing image with ID:", existingId);

		return {
			id: existingId,
			key: existingId,
			name: newFile.name,
			size: newFile.size,
			type: newFile.type,
			url: fileUrl,
		};
	} catch (error) {
		console.error("Error replacing image:", error);
		throw error;
	}
}

/**
 * Dispatch a custom event to notify components when an image is replaced
 */
export function dispatchImageReplacedEvent(fileId: string): void {
	if (typeof window !== 'undefined') {
		const event = new CustomEvent(IMAGE_REPLACED_EVENT, { 
			detail: { fileId, timestamp: Date.now() } 
		});
		window.dispatchEvent(event);
		console.log(`Dispatched ${IMAGE_REPLACED_EVENT} event for fileId:`, fileId);
	}
}

/**
 * Retrieves a file from the lix database by ID
 */
export async function getFileFromLix(
	fileId: string,
	lix: Lix
): Promise<Blob | null> {
	console.log('Getting file from Lix with ID:', fileId);
	
	try {
		const file = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirst();

		if (file && file.data) {
			// Check if we have mime type in metadata
			let mimeType = "application/octet-stream";
			if (file.metadata && file.metadata.mime_type) {
				mimeType = file.metadata.mime_type;
			}
			console.log('Found file, returning blob with mime type:', mimeType);
			return new Blob([file.data], { type: mimeType });
		}

		console.log('File not found for ID:', fileId);
		return null;
	} catch (error) {
		console.error("Error retrieving file from lix:", error);
		return null;
	}
}
