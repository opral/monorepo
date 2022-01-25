// export everything from supabase
// wrapping supabase in this package has the benefit that all
// dependent packages use the same supabase version, namely
// the one defined in this package.
export * from "@supabase/supabase-js";
export type { definitions } from "./types/definitions";
export { updateResources } from "./utils/updateResources";
