import {
	createAccount,
	createCheckpoint,
	createConversation,
	Lix,
	newLixFile,
	openLix,
	switchAccount,
	LixConversation,
} from "@lix-js/sdk";
import { supportedFileTypes } from "@/state.ts";
import { getConversations, getWorkingChangeSet } from "@/state-active-file.ts";
import { fromPlainText } from "@lix-js/sdk/zettel-ast";
import { createConversationMessage } from "@lix-js/sdk";

export async function lixCsvDemoFile(): Promise<{ blob: Blob; id: string }> {
	const lix = await openLix({
		blob: await newLixFile(),
		providePlugins: supportedFileTypes.map((type) => type.plugin),
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	await demoSalariesCsv(lix);

	return { blob: await lix.toBlob(), id: id.value };
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
		comment: "0. Initial salaries",
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

	const { conversations } = await createChangesWithCheckpoint({
		lix,
		file,
		rows,
		timestamp: "2022-05-13 14:53:00.000",
		comment: "Hired Klaus Kleber",
	});

	// Anna thinks the salary is too low of Klaus Kleber
	await switchAccount({ lix, to: [anna] });

	await createConversationMessage({
		lix,
		conversation_id: conversations![0].id,
		body: fromPlainText("I think the salary is too low. Adjust to 45000?"),
	});

	// Otto agrees with Anna
	await switchAccount({ lix, to: [otto] });

	await createConversationMessage({
		lix,
		conversation_id: conversations![0].id,
		body: fromPlainText("I agree. Adjust to 45000."),
	});

	// Peter agrees with Anna and Otto
	await switchAccount({ lix, to: [peter] });

	await createConversationMessage({
		lix,
		conversation_id: conversations![0].id,
		body: fromPlainText("Aye from me as well"),
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

	const changeSet = await getWorkingChangeSet(args.lix, args.file.id);

	if (changeSet) {
		await args.lix.db.transaction().execute(async (trx) => {
			// Create the checkpoint first to get the commit ID
			const checkpoint = await createCheckpoint({ lix: { ...args.lix, db: trx } });
			
			// Now create the conversation and attach it to the commit
			await createConversation({
				lix: { ...args.lix, db: trx },
				comments: [{ body: fromPlainText(args.comment) }],
				entity: {
					entity_id: checkpoint.id,
					schema_key: "lix_commit",
					file_id: "lix",
				},
			});
		});

		// Get conversations for the newly created commit
		const checkpointCommit = await args.lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const conversations = await getConversations(args.lix, checkpointCommit.commit_id);
		return { conversations };
	}

	return { conversations: [] };
}
