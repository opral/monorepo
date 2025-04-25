import {
	changeHasLabel,
	createAccount,
	createCheckpoint,
	createThread,
	fileQueueSettled,
	Lix,
	newLixFile,
	openLixInMemory,
	switchAccount,
	Thread,
	toBlob,
} from "@lix-js/sdk";
import { supportedFileTypes } from "@/state.ts";
import { getThreads, getWorkingChangeSet } from "@/state-active-file.ts";
import { fromPlainText } from "@lix-js/sdk/zettel-ast";

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
		comment: "Promoted Alice Johnson to Senior Data Scientist",
	});

	// Peter hires a new employee
	rows.push("Klaus Kleber,Intern,HR,40000");

	const { threads } = await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2022-05-13 14:53:00.000",
		comment: "Hired Klaus Kleber",
	});

	// Anna thinks the salary is too low of Klaus Kleber
	await switchAccount({ lix, to: [anna] });

	await createComment({
		lix,
		threadId: threads![0].id,
		content: "I think the salary is too low. Adjust to 45000?",
	});

	// Otto agrees with Anna
	await switchAccount({ lix, to: [otto] });

	await createComment({
		lix,
		threadId: threads![0].id,
		content: "I agree. Adjust to 45000.",
	});

	// Peter agrees with Anna and Otto
	await switchAccount({ lix, to: [peter] });

	await createComment({
		lix,
		threadId: threads![0].id,
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
		comment: "Updated salary bands",
	});
}

async function createChangesWithCheckpoint(args: {
	lix: Lix;
	file: { id: string };
	rows: string[];
	timestamp: string;
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
		.where((eb) => eb.not(changeHasLabel({ name: "checkpoint" })))
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

	const changeSet = await getWorkingChangeSet(args.lix, args.file.id);

	if (changeSet) {
		args.lix.db.transaction().execute(async (trx) => {
			const thread = await createThread({
				lix: { ...args.lix, db: trx },
				comments: [{ content: fromPlainText(args.comment) }],
			});
			await trx
				.insertInto("change_set_thread")
				.values({
					change_set_id: changeSet.id,
					thread_id: thread.id,
				})
				.execute();
		});
	}

	const threads = await getThreads(args.lix, changeSet!.id);

	await createCheckpoint({ lix: args.lix });

	return { threads };
}

const createComment = async (args: {
	lix: Lix;
	threadId: Thread["id"];
	content: string;
}) => {
	await args.lix.db
		.insertInto("thread_comment")
		.values({
			content: fromPlainText(args.content),
			thread_id: args.threadId,
		})
		.execute();
};