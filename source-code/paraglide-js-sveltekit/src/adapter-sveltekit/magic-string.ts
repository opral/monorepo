import MagicStringImport from "magic-string"

export const MagicString = MagicStringImport as unknown as typeof MagicStringImport
export type MagicStringType = InstanceType<typeof MagicStringImport>
