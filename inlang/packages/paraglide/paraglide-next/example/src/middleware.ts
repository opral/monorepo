import { NextRequest } from "next/server";
import * as paraglide from "./paraglide/adapter";

export function middleware(request: NextRequest) {
	return paraglide.middleware(request);
}
