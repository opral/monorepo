import { Paraglide } from "./paraglide"
import type { NextRequest, NextResponse } from "next/server"

export type CreateI18nOptions<T extends string> = {}

export type I18n<T extends string> = {
	/** Temporary dev only property - Should not be shipped */
	_env: string
	config: {
		runtime: Paraglide<T>
	}
	ClientProvider: React.FC<{}>
	ServerProvider: React.FC<{}>
	middleware: (request: NextRequest, response: NextResponse) => void
}
