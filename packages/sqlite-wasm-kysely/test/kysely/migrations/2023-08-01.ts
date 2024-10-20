import { Kysely, Migration } from "kysely";

export const Migration20230801: Migration = {
  async up(db: Kysely<any>) {
    await db.schema
      .createTable("groceries")
      .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
      .addColumn("name", "text", (cb) => cb.notNull())
      .execute();
  },
  async down(db: Kysely<any>) {
    await db.schema.dropTable("groceries").execute();
  },
};
