import { NextRequest } from "next/server"

export type LanguageDetector<T extends string> = (request: NextRequest) => T | undefined