// This is an example file showing how to use the JSON utilities
// with the Kysely database library

import { Kysely } from "kysely";
import { jsonb, jsonObjectFrom, jsonArrayFrom } from "./json.js";
import type { LixDatabaseSchema } from "./schema.js";

// Example of inserting with JSON utilities
async function exampleInsertWithJsonb(db: Kysely<LixDatabaseSchema>) {
	// Create a snapshot with JSON content
	await db
		.insertInto("snapshot")
		.values({
			content: jsonb({
				key: "value",
				nested: {
					property: true,
					count: 42,
				},
			}),
		})
		.execute();

	// Insert metadata as JSON object for file
	await db
		.insertInto("file")
		.values({
			path: "/example/path.txt",
			data: Buffer.from("Hello World"), // data as binary
			metadata: jsonObjectFrom({
				author: "User",
				createdAt: new Date().toISOString(),
				tags: ["example", "documentation"],
			}),
		})
		.execute();

	// Using jsonArrayFrom for an array property
	const tags = ["tag1", "tag2", "tag3"];
	await db
		.insertInto("file")
		.values({
			path: "/example/tagged.txt",
			data: Buffer.from("Tagged content"),
			// Here we're creating a JSON object that has an array property
			metadata: jsonObjectFrom({
				tags: tags,
				otherMetadata: {
					count: 3,
				},
			}),
		})
		.execute();

	// Direct usage of jsonArrayFrom
	// Using file.metadata to store an array directly
	// In a real application, you might store tags, categories, or other metadata arrays
	await db
		.insertInto("file")
		.values({
			path: "/example/array-metadata.txt",
			data: Buffer.from("File with array metadata"),
			// Store the array in the metadata BLOB as JSONB
			metadata: jsonArrayFrom(["documentation", "example", "tutorial"]),
		})
		.execute();

	// Another example: Using jsonArrayFrom in a snapshot
	await db
		.insertInto("snapshot")
		.values({
			// content field is perfect for storing arrays as JSONB
			content: jsonArrayFrom([
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
				{ id: 3, name: "Item 3" },
			]),
		})
		.execute();

	// ===============================================================
	// SUBQUERY EXAMPLES: Using jsonArrayFrom and jsonObjectFrom with Kysely subqueries
	// ===============================================================

	// Example 1: Using jsonObjectFrom with a subquery to get a single object
	// This fetches a file with its metadata as a nested JSON object
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const fileWithMetadata = await db
		.selectFrom("file")
		.where("file.id", "=", "example-file-id")
		.select((eb) => [
			"file.id",
			"file.path",
			// Using jsonObjectFrom with a subquery to get file stats as a JSON object
			jsonObjectFrom(
				eb
					.selectFrom("change")
					.select(eb => [
						eb.ref("change.created_at").as("last_modified"),
						eb.fn.count("change.id").as("change_count")
					])
					.whereRef("change.file_id", "=", "file.id")
					.groupBy("change.file_id")
					.limit(1)
			).as("file_stats")
		])
		.executeTakeFirst();

	// Example 2: Using jsonArrayFrom with a subquery (SQL aggregation)
	// This fetches discussions with their comments as a nested array in JSON
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const discussionsWithComments = await db
		.selectFrom("discussion")
		.select((eb) => [
			"discussion.id",
			// Using jsonArrayFrom with a subquery to aggregate comments
			jsonArrayFrom(
				eb
					.selectFrom("comment")
					.select(["comment.id", "comment.content"])
					.whereRef("comment.discussion_id", "=", "discussion.id")
					.orderBy("comment.id", "asc")
			).as("comments"),
		])
		.execute();

	// Example 2: Using jsonArrayFrom with an inline value and a subquery in the same query
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const fileWithRelatedFiles = await db
		.selectFrom("file")
		.where("file.id", "=", "example-file-id")
		.select((eb) => [
			"file.id",
			"file.path",
			// Directly using jsonArrayFrom with an array - standard JSON array conversion
			jsonArrayFrom(["related", "tag", "search"]).as("tags"),
			// Using jsonArrayFrom with a subquery - SQL aggregation
			jsonArrayFrom(
				eb
					.selectFrom("file as related_file")
					.select(["related_file.id", "related_file.path"])
					.where("related_file.id", "<>", "file.id") // Not the same file
					.limit(5)
			).as("related_files"),
		])
		.executeTakeFirst();
}

// Example usage
//
// Using these JSON utilities ensures consistent handling of JSON data
// regardless of whether it's stored as JSON or JSONB in the database.
// The functions abstract away the storage details, making the codebase
// more maintainable and consistent.

// Prevent unused function warning by showing how you would use it
// This is just example code and won't actually run
if (process.env.NODE_ENV === "EXAMPLE") {
	// This is just for demonstration and would require a real database instance
	const db = {} as Kysely<LixDatabaseSchema>;
	void exampleInsertWithJsonb(db);
}
