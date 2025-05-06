import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export type User = Selectable<UserTable>;
export type NewAUser = Insertable<UserTable>;
export type AccountUpdate = Updateable<UserTable>;
export type UserTable = {
  id: Generated<string>;
  name: string;
};

export type DatabaseSchema = {
  // user
  user: UserTable;
};
