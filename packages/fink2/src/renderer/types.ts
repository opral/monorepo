import type { PageContextClient } from "vike/types"

export type PageTemplate = (pageContext: PageContextClient) => ReturnType<typeof import("lit").html>
