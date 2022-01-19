import { language_set_policies } from "./policies/language";
import { project_member_set_policies } from "./policies/project_member";
import { projects_set_policies } from "./policies/project";
import { user_set_policies } from "./policies/user";

async function main() {
  await language_set_policies();
  await project_member_set_policies();
  await user_set_policies();
  await projects_set_policies();
}

main().catch((e) => console.error(e));
