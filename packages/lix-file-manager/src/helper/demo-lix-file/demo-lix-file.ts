import {
	changeHasLabel,
	createAccount,
	createChangeSet,
	createComment,
	createDiscussion,
	fileQueueSettled,
	Label,
	Lix,
	newLixFile,
	openLixInMemory,
	switchAccount,
	toBlob,
} from "@lix-js/sdk";
import { supportedFileTypes } from "@/state.ts";

export async function lixCsvDemoFile(): Promise<{ blob: Blob; id: string }> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: supportedFileTypes.map((type) => type.plugin),
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await demoSalariesCsv(lix);

	await fileQueueSettled({ lix });
	return { blob: await toBlob({ lix }), id: id.value };
}

async function demoSalariesCsv(lix: Lix): Promise<void> {
	const anna = await createAccount({
		lix,
		name: "Anna",
	});
	const otto = await createAccount({
		lix,
		name: "Otto",
	});
	const peter = await createAccount({
		lix,
		name: "Peter",
	});

	const rows = [
		"Name,Position,Department,Salary",
		"John Doe,Software Engineer,Engineering,90000",
		"Jane Smith,Product Manager,Product,95000",
		"Alice Johnson,Data Scientist,Data,100000",
		"Bob Brown,Designer,Design,85000",
		"Charlie Davis,Marketing Specialist,Marketing,70000",
		"Emily Wilson,HR Manager,HR,75000",
		"Frank Miller,Sales Manager,Sales,80000",
		"Grace Lee,Customer Support,Support,60000",
		"Henry Clark,DevOps Engineer,Engineering,95000",
	];

	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.selectAll()
		.executeTakeFirstOrThrow();

	await switchAccount({ lix, to: [anna] });

	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/salaries.csv",
			data: new TextEncoder().encode(rows.join("\n")),
			metadata: {
				unique_column: "Name",
			},
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	// anna is creating a checkpoint for the initial salaries
	await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2022-03-11 14:53:00.000",
		checkpointLabel,
		comment: "Initial salaries",
	});

	// Otto increases the salary of Charlie Davis
	await switchAccount({ lix, to: [otto] });

	rows[5] = "Charlie Davis,Marketing Specialist,Marketing,74000";

	await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2022-04-14 19:53:00.000",
		checkpointLabel,
		comment: "Increased Charlie Davis salary",
	});

	// Peter promotes Alice Johnson
	await switchAccount({ lix, to: [peter] });

	rows[3] = "Alice Johnson,Senior Data Scientist,Data,110000";

	await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2022-05-11 14:53:00.000",
		checkpointLabel,
		comment: "Promoted Alice Johnson to Senior Data Scientist",
	});

	// Peter hires a new employee
	rows.push("Klaus Kleber,Intern,HR,40000");

	const { discussion } = await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2022-05-13 14:53:00.000",
		checkpointLabel,
		comment: "Hired Klaus Kleber",
	});

	// Anna thinks the salary is too low of Klaus Kleber
	await switchAccount({ lix, to: [anna] });

	const annasComment = await createComment({
		lix,
		parentComment: discussion.firstComment,
		content: "I think the salary is too low. Adjust to 45000?",
	});

	// Otto agrees with Anna
	await switchAccount({ lix, to: [otto] });

	const ottosComment = await createComment({
		lix,
		parentComment: annasComment,
		content: "I agree. Adjust to 45000.",
	});

	// Peter agrees with Anna and Otto
	await switchAccount({ lix, to: [peter] });

	await createComment({
		lix,
		parentComment: ottosComment,
		content: "Aye from me as well",
	});

	// Anna adjusts the salary
	await switchAccount({ lix, to: [anna] });

	rows[10] = "Klaus Kleber,Intern,HR,45000";

	await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2022-05-14 11:42:00.000",
		checkpointLabel,
		comment: "Increased Klaus Kleber salary",
	});

	// Peter promotes Klaus Kleber

	await switchAccount({ lix, to: [peter] });

	rows[10] = "Klaus Kleber,Junior HR Manager,HR,60000";

	await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2023-01-01 10:45:00.000",
		checkpointLabel,
		comment: "Hired Klaus Kleber after intern period",
	});

	// Anna updates the salary bands

	await switchAccount({ lix, to: [anna] });

	// skip header row
	for (const row of rows.slice(1)) {
		const [name, position, department, salary] = row.split(",");
		const salaryInt = parseInt(salary);
		rows[rows.indexOf(row)] =
			`${name},${position},${department},${(salaryInt * 1.1).toFixed(0)}`;
	}

	await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2023-02-01 10:45:00.000",
		checkpointLabel,
		comment: "Updated salary bands",
	});
}

async function createChangesWithCheckpoint(args: {
	lix: Lix;
	file: { id: string };
	rows: string[];
	timestamp: string;
	checkpointLabel: Label;
	comment: string;
}) {
	await args.lix.db
		.updateTable("file")
		.set({
			data: new TextEncoder().encode(args.rows.join("\n")),
		})
		.where("id", "=", args.file.id)
		.execute();

	await fileQueueSettled({ lix: args.lix });

	const changes = await args.lix.db
		.selectFrom("change")
		.selectAll()
		// don't copy changes that are already tagged as a checkpoint
		.where((eb) => eb.not(changeHasLabel("checkpoint")))
		.where("file_id", "=", args.file.id)
		.execute();

	// set the time
	for (const change of changes) {
		await args.lix.db
			.updateTable("change")
			.set({ created_at: args.timestamp })
			.where("id", "=", change.id)
			.execute();
	}

	const changeSet = await createChangeSet({
		lix: args.lix,
		elements: changes.map((change) => ({
			file_id: change.file_id,
			schema_key: change.schema_key,
			change_id: change.id,
			entity_id: change.entity_id,
		})),
	});

	const discussion = await createDiscussion({
		changeSet,
		lix: args.lix,
		firstComment: { content: args.comment },
	});

	await args.lix.db
		.insertInto("change_set_label")
		.values({
			change_set_id: changeSet.id,
			label_id: args.checkpointLabel.id,
		})
		.execute();

	return { discussion };
}
