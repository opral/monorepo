import { language_set_policies } from "./policies/language";
import { member_set_policies } from "./policies/member";
import { organization_set_policies } from "./policies/organizations";
import { projects_set_policies } from "./policies/projects";
import { user_set_policies } from "./policies/user";

async function main() {
    await language_set_policies();
    await member_set_policies();
    await user_set_policies();
    await organization_set_policies();
    await projects_set_policies();
}

main().catch((e) => console.error(e));