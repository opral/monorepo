import { NextRequest } from "next/server";
import * as paraglide from "./app/adapter.js";

export function middleware(request: NextRequest) {
	return paraglide.middleware(request);
}
