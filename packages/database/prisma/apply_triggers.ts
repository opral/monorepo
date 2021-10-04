import { handle_new_organization } from "./triggers/handle_new_organization";
import { handle_supabase_auth } from "./triggers/handle_supabase_auth";

async function main() {
  await handle_supabase_auth();
  await handle_new_organization();
}

main().catch((e) => console.error(e));
