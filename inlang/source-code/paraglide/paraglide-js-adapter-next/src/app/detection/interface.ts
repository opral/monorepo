import { NextRequest } from "next/server"

export interface LanguageDetector<T extends string> {
	resolveLanguage(request: NextRequest): T | undefined
}
