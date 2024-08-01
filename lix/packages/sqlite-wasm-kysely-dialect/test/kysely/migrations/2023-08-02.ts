import { Kysely, Migration } from "kysely";

export const Migration20230802: Migration = {
  async up(db: Kysely<any>) {
    await db.schema
      .alterTable("groceries")
      .addColumn("quantity", "integer")
      .execute();
  },
  async down(db: Kysely<any>) {
    await db.schema.alterTable("groceries").dropColumn("quantity").execute();
  },
};
