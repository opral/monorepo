import { handle_insert_organization } from "./triggers/handle_insert_organization";
import { handle_insert_user } from "./triggers/handle_insert_user";
import { apply_get_user_id_from_email } from "./functions/get_user_id_from_email";

async function main() {
  await handle_insert_user();
  await handle_insert_organization();
  await apply_get_user_id_from_email();
}

main().catch((e) => console.error(e));
