import { Lix } from "@lix-js/sdk";
import { nanoid } from "@udecode/plate";

export interface LixUploadedFile {
	id: string;
	key: string;
	name: string;
	size: number;
	type: string;
	url: string;
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
		console.log('Inserting file with ID:', fileId);
		
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
			
		console.log('File inserted successfully');
	} catch (error) {
		console.error("Error inserting into file table:", error);
		throw error;
	}

	// Create a URL that can be used to retrieve the file
	// Format: https://lix.host?l={lixId}&f={fileId}
	const serverUrl = "https://lix.host";

	// Get the lix ID from key_value table
	const lixIdRecord = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirst();

	const lixId = lixIdRecord?.value;
	const fileUrl = `${serverUrl}?l=${lixId}&f=${fileId}`;
	
	// Log for debugging
	console.log('Created file URL:', fileUrl);

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
