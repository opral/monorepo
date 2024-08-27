import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { Bundle, Message, Variant } from "../schema/schemaV2.js";

export type InlangDatabaseSchema = {
	bundle: BundleTable;
	message: MessageTable;
	variant: VariantTable;
};

type BundleTable = Omit<Bundle, "id"> & {
	id: Generated<string>;
};

type MessageTable = Omit<Message, "id"> & {
	id: Generated<string>;
};

type VariantTable = Omit<Variant, "id"> & {
	id: Generated<string>;
};

export type NewBundle = Insertable<BundleTable>;
export type BundleUpdate = Updateable<BundleTable>;

export type NewMessage = Insertable<MessageTable>;
export type MessageUpdate = Updateable<MessageTable>;

export type NewVariant = Selectable<VariantTable>;
export type VariantUpdate = Updateable<VariantTable>;

export type MessageNested = Message & {
	variants: Variant[];
};
export type NewMessageNested = NewMessage & {
	variants: NewVariant[];
};
export type MessageNestedUpdate = Updateable<MessageTable> & {
	variants: VariantUpdate[];
};

export type BundleNested = Bundle & {
	messages: MessageNested[];
};
export type NewBundleNested = NewBundle & {
	messages: NewMessageNested[];
};
export type BundleNestedUpdate = BundleUpdate & {
	messages: MessageNestedUpdate[];
};
