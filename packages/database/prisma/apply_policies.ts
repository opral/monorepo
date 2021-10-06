import { key_set_policies } from "./policies/key";
import { language_set_policies } from "./policies/language";
import { member_set_policies } from "./policies/member";
import { organization_set_policies } from "./policies/organizations";
import { projects_set_policies } from "./policies/projects";
import { translation_set_policies } from "./policies/translation";
import { user_set_policies } from "./policies/user";

async function main() {
    await key_set_policies();
    await language_set_policies();
    await member_set_policies();
    await translation_set_policies();
    await user_set_policies();
    await organization_set_policies();
    await projects_set_policies();
}

main().catch((e) => console.error(e));