import { handle_insert_organization } from "./triggers/handle_insert_organization";
import { handle_insert_user } from "./triggers/handle_insert_user";

async function main() {
  await handle_insert_user();
  await handle_insert_organization();
}

main().catch((e) => console.error(e));
