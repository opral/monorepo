/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Selectable } from "kysely";
import type {
	Bundle,
	InlangDatabaseSchema,
	Message,
	Variant,
} from "./schema.js";

let _;

// expect a bundle to equal the type that the database returns
_ = {} as Bundle satisfies Selectable<InlangDatabaseSchema["bundle"]>;

// expect a message to equal the type that the database returns
_ = {} as Message satisfies Selectable<InlangDatabaseSchema["message"]>;

// expect a variant to equal the type that the database returns
_ = {} as Variant satisfies Selectable<InlangDatabaseSchema["variant"]>;
