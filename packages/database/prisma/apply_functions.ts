import { apply_get_user_id_from_email } from "./functions/get_user_id_from_email";
import { apply_is_member_of_project } from "./functions/is_member_of_project";

async function main() {
  //   await apply_is_member_of_project();
  await apply_get_user_id_from_email();
}

main().catch((error) => console.error(error));
