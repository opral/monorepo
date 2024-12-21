import {
	createAccount,
	createChangeSet,
	createDiscussion,
	fileQueueSettled,
	Label,
	Lix,
	newLixFile,
	openLixInMemory,
	switchAccount,
	toBlob,
} from "@lix-js/sdk";
import { plugin as csvPlugin } from "@lix-js/plugin-csv";
import minimalCsv from "./minimal.csv?raw";
import salariesCsv from "./salaries.csv?raw";

export async function lixCsvDemoFile(): Promise<{ blob: Blob; id: string }> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [csvPlugin],
	});

	const id = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.select("value")
		.executeTakeFirstOrThrow();

	// if (import.meta.env.PROD) {
	console.log("creating demo salaries csv");
	await demoSalariesCsv(lix);
	// } else {
	// New files get minimal demo csv for development purposes
	// 	await lix.db
	// 		.insertInto("file")
	// 		.values({
	// 			path: "/minimal.csv",
	// 			data: new TextEncoder().encode(minimalCsv),
	// 			metadata: {
	// 				unique_column: "email",
	// 			},
	// 		})
	// 		.execute();
	// }

	await fileQueueSettled({ lix });
	return { blob: await toBlob({ lix }), id: id.value };
}

async function demoSalariesCsv(lix: Lix): Promise<void> {
	debugger;

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

	const confirmedLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "confirmed")
		.selectAll()
		.executeTakeFirstOrThrow();

	const rows = salariesCsv.split("\n");

	await switchAccount({ lix, to: [anna] });

	// inserting the first 20 rows of the csv (+ header)
	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/salaries.csv",
			data: new TextEncoder().encode(rows.slice(0, 21).join("\n")),
			metadata: {
				unique_column: "Name",
			},
		})
		.returning("id")
		.executeTakeFirstOrThrow();

	// anna is confirming the initial salaries
	await confirmChanges({
		lix,
		file,
		confirmedLabel,
		comment: "Initial salaries",
	});

	console.log("inserting demo change");
}

async function confirmChanges(args: {
	lix: Lix;
	file: { id: string };
	confirmedLabel: Label;
	comment: string;
}) {
	await fileQueueSettled({ lix: args.lix });

	const changes = await args.lix.db
		.selectFrom("change")
		.selectAll()
		.where("file_id", "=", args.file.id)
		.execute();

	const changeSet = await createChangeSet({
		lix: args.lix,
		changes,
	});

	await createDiscussion({
		changeSet,
		lix: args.lix,
		firstComment: { content: "Initial salaries" },
	});

	await args.lix.db
		.insertInto("change_set_label")
		.values({
			change_set_id: changeSet.id,
			label_id: args.confirmedLabel.id,
		})
		.execute();
}
