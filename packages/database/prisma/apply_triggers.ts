import { on_insert_auth_user } from "./triggers/on_insert_auth_user";
import { on_insert_project } from "./triggers/on_insert_project";

async function main() {
  await on_insert_auth_user();
  await on_insert_project();
}

main().catch((e) => console.error(e));
