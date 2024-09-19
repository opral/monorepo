import { BundleNested } from "@inlang/sdk2";
export const demoBundles: BundleNested[] = [
	{
		id: "even_hour_mule_drum",
		messages: [
			{
				id: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
				bundleId: "even_hour_mule_drum",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "6a860f96-0cf3-477c-80ad-7893d8fde852",
						messageId: "c2684c3d-3e14-47e4-96b7-8d33579bb7e9",
						match: {},
						pattern: [
							{
								type: "text",
								value: "My Awesome Todo App",
							},
						],
					},
				],
			},
			{
				id: "31223268-c026-4345-a876-7131bbee6b7b",
				bundleId: "even_hour_mule_drum",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "17cf9bc2-1a3c-4494-beae-e42dbcaac763",
						messageId: "31223268-c026-4345-a876-7131bbee6b7b",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Meine tolle Todo App",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "knotty_next_opossum_link",

		messages: [
			{
				id: "9ea0640c-ebf7-4672-a0a6-f0eeed5c1f1a",
				bundleId: "knotty_next_opossum_link",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "bec40dd6-85c3-4ad2-b226-027f8afac9f4",
						messageId: "9ea0640c-ebf7-4672-a0a6-f0eeed5c1f1a",
						match: {},
						pattern: [
							{
								type: "text",
								value:
									"This is a simple todo app that showcases Inlang in a real world application.",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "trite_lime_tapir_surge",

		messages: [
			{
				id: "c7d17bd4-a379-4649-802c-b875ffc0e3ca",
				bundleId: "trite_lime_tapir_surge",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "5bb02876-8eaa-4454-88fa-e19008785ea3",
						messageId: "c7d17bd4-a379-4649-802c-b875ffc0e3ca",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Today {{date}}",
							},
						],
					},
				],
			},
			{
				id: "4c8c6915-a3a4-450e-93a4-ee049c553968",
				bundleId: "trite_lime_tapir_surge",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "543110f3-25da-421c-9da5-fc814a61f41e",
						messageId: "4c8c6915-a3a4-450e-93a4-ee049c553968",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Heute, {{date}}",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "sour_caring_kitten_lend",

		messages: [
			{
				id: "ddf9be5e-9dcb-4829-afb8-e9d12c64295c",
				bundleId: "sour_caring_kitten_lend",
				locale: "en",
				selectors: [
					{
						type: "expression",
						arg: {
							type: "variable",
							name: "numTodos",
						},
						annotation: {
							type: "function",
							name: "plural",
							options: [],
						},
					},
				],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						messageId: "ddf9be5e-9dcb-4829-afb8-e9d12c64295c",
						id: "1458e8e3-c2e2-409c-949c-b4b214f4d094",
						match: {
							numTodos: "one",
						},
						pattern: [
							{
								type: "expression",
								arg: {
									type: "variable",
									name: "numTodos",
								},
							},
							{
								type: "text",
								value: " task",
							},
						],
					},
					{
						messageId: "ddf9be5e-9dcb-4829-afb8-e9d12c64295c",
						id: "f0890476-ef1d-460f-8b17-bff2613c3fcb",
						match: {
							numTodos: "other",
						},
						pattern: [
							{
								type: "expression",
								arg: {
									type: "variable",
									name: "numTodos",
								},
							},
							{
								type: "text",
								value: " tasks",
							},
						],
					},
				],
			},
			{
				id: "9802b8fe-70fb-4689-9ac6-7de0c9f3e01a",
				bundleId: "sour_caring_kitten_lend",
				locale: "de",
				selectors: [
					{
						type: "expression",
						arg: {
							type: "variable",
							name: "numTodos",
						},
						annotation: {
							type: "function",
							name: "plural",
							options: [],
						},
					},
				],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						messageId: "9802b8fe-70fb-4689-9ac6-7de0c9f3e01a",
						id: "fc8c80af-0e34-47bf-bf49-7540bfa67531",
						match: {
							numTodos: "one",
						},
						pattern: [
							{
								type: "text",
								value: "Eine Aufgabe",
							},
						],
					},
					{
						messageId: "9802b8fe-70fb-4689-9ac6-7de0c9f3e01a",
						id: "a63a9762-a86d-4c50-9cef-2dd1e91da424",
						match: {
							numTodos: "other",
						},
						pattern: [
							{
								type: "expression",
								arg: {
									type: "variable",
									name: "numTodos",
								},
							},
							{
								type: "text",
								value: " Aufgaben",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "born_mean_beetle_pull",

		messages: [
			{
				id: "c6bfd5d0-035b-4917-853a-a3545ff6b309",
				bundleId: "born_mean_beetle_pull",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "65374620-8677-429a-8bc3-67bd5b3d4fc6",
						messageId: "c6bfd5d0-035b-4917-853a-a3545ff6b309",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Mark as done",
							},
						],
					},
				],
			},
			{
				id: "45ef2505-2888-45f5-83bb-1dc25fe8c328",
				bundleId: "born_mean_beetle_pull",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "a4f46c99-040b-4262-937c-671c1712558c",
						messageId: "45ef2505-2888-45f5-83bb-1dc25fe8c328",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Als erledigt markiert",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "sound_aqua_tern_exhale",

		messages: [
			{
				id: "b9437d65-9b2e-4a36-b2c4-cb78c43e0fc6",
				bundleId: "sound_aqua_tern_exhale",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "2a878a9a-79e2-45c0-917d-5739d0ff432c",
						messageId: "b9437d65-9b2e-4a36-b2c4-cb78c43e0fc6",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Mark as incomplete",
							},
						],
					},
				],
			},
			{
				id: "d56d332d-b171-445b-a176-03059e43ef0c",
				bundleId: "sound_aqua_tern_exhale",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "58946078-e0d8-413a-a6a5-ad8cbed7ab3e",
						messageId: "d56d332d-b171-445b-a176-03059e43ef0c",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Als unvollständig Aldwin",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "lime_minor_emu_exhale",

		messages: [
			{
				id: "c3770a58-96fe-459b-a2be-036c2372ed14",
				bundleId: "lime_minor_emu_exhale",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "32b1a201-90ae-4d74-b3dc-b7386e698cf3",
						messageId: "c3770a58-96fe-459b-a2be-036c2372ed14",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Delete",
							},
						],
					},
				],
			},
			{
				id: "3c379c7f-fc7b-4645-85c6-691005e20206",
				bundleId: "lime_minor_emu_exhale",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "1985408c-e157-4f11-aaf3-27531bd53008",
						messageId: "3c379c7f-fc7b-4645-85c6-691005e20206",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Löschen",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "plane_cool_moth_dust",

		messages: [
			{
				id: "a60c59b2-805a-4296-84c8-047c85afdca0",
				bundleId: "plane_cool_moth_dust",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "d989145b-443a-40ec-b15a-f105f957fe39",
						messageId: "a60c59b2-805a-4296-84c8-047c85afdca0",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Add todo...",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "odd_stout_panther_edit",

		messages: [
			{
				id: "87fd3f2c-905c-44df-9a2f-29770d2684bf",
				bundleId: "odd_stout_panther_edit",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "0d9843e8-be73-46bc-b2b9-bd4e537f3da9",
						messageId: "87fd3f2c-905c-44df-9a2f-29770d2684bf",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Add new",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "teal_cuddly_midge_ripple",

		messages: [
			{
				id: "7db2dd7a-d453-4a03-b5fd-c0d699a46daa",
				bundleId: "teal_cuddly_midge_ripple",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "e4573db5-137f-482e-9dbb-2a0cfad3e16f",
						messageId: "7db2dd7a-d453-4a03-b5fd-c0d699a46daa",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Enter app",
							},
						],
					},
				],
			},
			{
				id: "c67c65cf-017b-4eff-97cb-48ba4e702465",
				bundleId: "teal_cuddly_midge_ripple",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "f6dd628a-f14d-413d-8963-8d16d9bf70f6",
						messageId: "c67c65cf-017b-4eff-97cb-48ba4e702465",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Zur Todo-App",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "fancy_weary_blackbird_ripple",

		messages: [
			{
				id: "ac36ac47-0e7c-4d13-8059-3ed08c1a2ccb",
				bundleId: "fancy_weary_blackbird_ripple",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "35e25739-85ba-43ca-b60f-aa5925601441",
						messageId: "ac36ac47-0e7c-4d13-8059-3ed08c1a2ccb",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Back",
							},
						],
					},
				],
			},
			{
				id: "30b05269-b648-4867-9864-6432da479bbc",
				bundleId: "fancy_weary_blackbird_ripple",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "8ea71a9a-c67e-4dc3-a3eb-83c1de868a0a",
						messageId: "30b05269-b648-4867-9864-6432da479bbc",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Zurück",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "spicy_last_whale_boil",

		messages: [
			{
				id: "8c96e549-85bb-4698-9109-fceb26f25099",
				bundleId: "spicy_last_whale_boil",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "b7355c3a-137e-46ad-acb5-07868c73614c",
						messageId: "8c96e549-85bb-4698-9109-fceb26f25099",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Page not found",
							},
						],
					},
				],
			},
			{
				id: "51be006f-5d0c-43ed-b920-5c5d988bac47",
				bundleId: "spicy_last_whale_boil",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "1a05b4ac-195a-45dc-8012-996c0d13f9a5",
						messageId: "51be006f-5d0c-43ed-b920-5c5d988bac47",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Seite nicht gefunden",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "slow_busy_mule_leap",

		messages: [
			{
				id: "ed0065ba-c788-43cd-8b8f-30c4d7f740b7",
				bundleId: "slow_busy_mule_leap",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "28027974-43f8-4a60-9a94-cccf16a1cb72",
						messageId: "ed0065ba-c788-43cd-8b8f-30c4d7f740b7",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Click here to return to the homepage",
							},
						],
					},
				],
			},
			{
				id: "06777f2b-662d-427a-bed7-b485df94e3dd",
				bundleId: "slow_busy_mule_leap",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "fbf61dce-0c1c-48c0-bcb9-b0e22611b2e6",
						messageId: "06777f2b-662d-427a-bed7-b485df94e3dd",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Hier klicken, um zur Startseite zurückzukehren",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "elegant_wacky_sheep_type",

		messages: [
			{
				id: "074ac662-5c53-4010-af83-af4c3e40b37f",
				bundleId: "elegant_wacky_sheep_type",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "9ecf0637-43ff-4e39-96e3-ae671e411781",
						messageId: "074ac662-5c53-4010-af83-af4c3e40b37f",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Something went wrong",
							},
						],
					},
				],
			},
			{
				id: "91eb395b-2971-4e1a-86cb-3826fbfc3afa",
				bundleId: "elegant_wacky_sheep_type",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "c6b8872e-c4e3-4690-bbd3-12364c06bea5",
						messageId: "91eb395b-2971-4e1a-86cb-3826fbfc3afa",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Etwas ist schief gelaufen",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "broad_petty_camel_trust",

		messages: [
			{
				id: "1424b800-843e-4237-abbc-9dca9a7d1bb9",
				bundleId: "broad_petty_camel_trust",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "7d9efcdb-7f92-4926-8598-e1f8f9c1853b",
						messageId: "1424b800-843e-4237-abbc-9dca9a7d1bb9",
						match: {},
						pattern: [
							{
								type: "text",
								value: "The field {{field}} is missing",
							},
						],
					},
				],
			},
			{
				id: "55ebe70c-d11f-4421-9bf7-3e7bed82a07b",
				bundleId: "broad_petty_camel_trust",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "07beb216-3f99-4791-9278-834ce2057f59",
						messageId: "55ebe70c-d11f-4421-9bf7-3e7bed82a07b",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Das Feld '{{field}}' ist nicht gesetzt",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "lazy_slimy_monkey_fade",

		messages: [
			{
				id: "62e4af96-2d32-4adb-9ca4-5694c5f40c38",
				bundleId: "lazy_slimy_monkey_fade",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "ef72b6e2-63d2-4e6e-8fec-0fe7a36a5131",
						messageId: "62e4af96-2d32-4adb-9ca4-5694c5f40c38",
						match: {},
						pattern: [
							{
								type: "text",
								value: "The field {{field}} has an invalid data type",
							},
						],
					},
				],
			},
			{
				id: "9055be81-5ec5-4f8a-95a5-d8cb5bb82054",
				bundleId: "lazy_slimy_monkey_fade",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "cf2ab463-eb51-4d63-982e-b0eff1708990",
						messageId: "9055be81-5ec5-4f8a-95a5-d8cb5bb82054",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Das Feld '{field}' hat einen ungültigen Datentyp",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "good_fair_otter_fade",

		messages: [
			{
				id: "0192afed-c106-4f09-953e-a432da48a78e",
				bundleId: "good_fair_otter_fade",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "8402102d-290e-4f95-810a-239512bfa3f6",
						messageId: "0192afed-c106-4f09-953e-a432da48a78e",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Loaded {count} todos",
							},
						],
					},
				],
			},
			{
				id: "dc06000e-27e9-467c-85ac-c1dd1ee2ece0",
				bundleId: "good_fair_otter_fade",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "43b83c5c-6950-44a6-b414-16fa238ced5d",
						messageId: "dc06000e-27e9-467c-85ac-c1dd1ee2ece0",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{count}} Aufgaben geladen",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "witty_ok_liger_hurl",

		messages: [
			{
				id: "9e06cd68-3544-4cd2-bd2f-44dcb8d0ed18",
				bundleId: "witty_ok_liger_hurl",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "20fd5716-e3ba-41ad-a97f-bc77908f1a2c",
						messageId: "9e06cd68-3544-4cd2-bd2f-44dcb8d0ed18",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} added a new todo",
							},
						],
					},
				],
			},
			{
				id: "f5bed312-52c5-411a-bb66-eef63f1212a7",
				bundleId: "witty_ok_liger_hurl",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "f71cce9f-c9b7-41b8-b417-222bababb39b",
						messageId: "f5bed312-52c5-411a-bb66-eef63f1212a7",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} hat ein Todo erstellt",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "kind_weird_lynx_roar",

		messages: [
			{
				id: "fd9ecf15-f04e-4e8f-8ad1-7c806adbeb5b",
				bundleId: "kind_weird_lynx_roar",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "43967374-04df-477d-85e8-dad4f17e4c5f",
						messageId: "fd9ecf15-f04e-4e8f-8ad1-7c806adbeb5b",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} deleted a todo",
							},
						],
					},
				],
			},
			{
				id: "b2c8cdc1-7be7-467d-808b-8aa6078944ac",
				bundleId: "kind_weird_lynx_roar",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "02e1b704-3e3b-4939-a0f0-5a7edd25480d",
						messageId: "b2c8cdc1-7be7-467d-808b-8aa6078944ac",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} hat ein Todo gelöscht",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "teary_aloof_falcon_harbor",

		messages: [
			{
				id: "ee4d80f5-bc2f-4422-97e2-a2c0fd6eb64b",
				bundleId: "teary_aloof_falcon_harbor",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "412ca989-09c9-47f6-b600-43a421334228",
						messageId: "ee4d80f5-bc2f-4422-97e2-a2c0fd6eb64b",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} marked a todo as done",
							},
						],
					},
				],
			},
			{
				id: "bc8d0524-fe01-4fed-b7a5-d2502e49ef1f",
				bundleId: "teary_aloof_falcon_harbor",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "e3b34650-fe3c-437e-a2ec-b8f5d34bea2f",
						messageId: "bc8d0524-fe01-4fed-b7a5-d2502e49ef1f",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} hat ein Todo als erledigt markiert",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "such_jumpy_elk_wish",

		messages: [
			{
				id: "9ee4587a-e8d2-4714-91da-f040ff5be0ce",
				bundleId: "such_jumpy_elk_wish",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "f5987620-1b64-46d3-b192-2cd8166bc170",
						messageId: "9ee4587a-e8d2-4714-91da-f040ff5be0ce",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} marked a todo as incomplete",
							},
						],
					},
				],
			},
			{
				id: "42899468-140a-44fa-89c9-eedf17973b1c",
				bundleId: "such_jumpy_elk_wish",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "9bd80720-0065-4483-9d7e-711d3025421d",
						messageId: "42899468-140a-44fa-89c9-eedf17973b1c",
						match: {},
						pattern: [
							{
								type: "text",
								value: "{{id}} hat ein Todo als unvollständig markiert",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "nice_nimble_buzzard_hush",

		messages: [
			{
				id: "879ef91b-f5cf-412e-bae0-b16f4cd2851b",
				bundleId: "nice_nimble_buzzard_hush",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "a9c2be43-a5fe-456d-9b71-1989908f46c7",
						messageId: "879ef91b-f5cf-412e-bae0-b16f4cd2851b",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Choose language",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "crisp_key_leopard_kiss",

		messages: [
			{
				id: "43f4cafe-94e5-4dd7-96ed-e29b5c34a626",
				bundleId: "crisp_key_leopard_kiss",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "c045e3d7-2a55-4a82-9c08-3193a98ec040",
						messageId: "43f4cafe-94e5-4dd7-96ed-e29b5c34a626",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Made with ❤️ by Inlang",
							},
						],
					},
				],
			},
			{
				id: "e58a125e-3f57-43af-ac79-7c6fe9b6927c",
				bundleId: "crisp_key_leopard_kiss",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "2aa6322f-6a8d-4b7f-9b61-25dc32d394cb",
						messageId: "e58a125e-3f57-43af-ac79-7c6fe9b6927c",
						match: {},
						pattern: [
							{
								type: "text",
								value: "Mit ❤️ von Inlang erstellt",
							},
						],
					},
				],
			},
		],
	},
	{
		id: "north_moving_florian_twirl",

		messages: [
			{
				id: "045336c1-5bb0-4e66-8708-96a84210dffc",
				bundleId: "north_moving_florian_twirl",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "2ee84f2e-cf64-4e74-a9b0-29935b6b6e65",
						messageId: "045336c1-5bb0-4e66-8708-96a84210dffc",
						match: {},
						pattern: [
							{
								type: "text",
								value:
									'Visit the <a href="https://www.inlang.com">docs</a> to learn more about Inlang.',
							},
						],
					},
				],
			},
			{
				id: "05c828e9-a9f3-41b2-8a54-7ec5d6fff12d",
				bundleId: "north_moving_florian_twirl",
				locale: "de",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "d7fde0c4-9fc7-424e-bb3e-2926aba12fa2",
						messageId: "05c828e9-a9f3-41b2-8a54-7ec5d6fff12d",
						match: {},
						pattern: [
							{
								type: "text",
								value:
									'Besuchen Sie die <a href="https://www.inlang.com">Dokumentation</a> um mehr über Inlang zu erfahren.',
							},
						],
					},
				],
			},
		],
	},
	{
		id: "weak_weird_pigeon_strive",

		messages: [
			{
				id: "f33260f9-c3a6-432d-8216-3662c7b1b900",
				bundleId: "weak_weird_pigeon_strive",
				locale: "en",
				selectors: [],
				declarations: [
					{
						type: "input",
						name: "numTodos",
						value: {
							type: "expression",
							arg: {
								type: "variable",
								name: "numTodos",
							},
						},
					},
				],
				variants: [
					{
						id: "373c369a-a43e-4d96-bbd5-0cf83518d522",
						messageId: "f33260f9-c3a6-432d-8216-3662c7b1b900",
						match: {},
						pattern: [
							{
								type: "text",
								value: "View the source code on Github",
							},
						],
					},
				],
			},
		],
	},
];
