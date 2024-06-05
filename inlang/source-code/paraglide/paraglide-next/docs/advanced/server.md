# Usage on the Server

In general you can use messages and the `languageTag()` function on the server without issues.

There are a few things to be aware of:
- Messages are just functions. Make sure they are called somewhere that's evaluated for every request. 

### Using the Language in Server Actions

Use the `initializeLanguage` function at the top of your server-action file to make sure the language is available.

```ts
// src/app/actions.ts
"use server"
import { initializeLanguage } from "@inlang/paraglide-next"
import { languageTag } from "@/paraglide/runtime"

initializeLanguage() //call it at the top of the file

export async function someAction() {
	languageTag() // "de"
}

export async function someOtherAction() {
	languageTag() // "de"
}
```

## Chaining Middleware

Paraglide-Next comes with middleware. Often you will want to chain that middleware with your own.

Just call Paraglide-Next's middleware inside your own middleware function. Pass it the request and use the returned response.

```ts
// src/middleware.ts
import { middleware as paraglide } from "@/lib/i18n"
export function middleware(request: NextRequest) {
	//do something with the request
	const response = paraglide(request)
	// do something with the response
	return response
}
```

## Using the language in Middleware

In some cases you may need to access the language of a request inside the middleware itself. For this the `middleware` function provides a `detectLanguage` function.

```ts
// src/middleware.ts
import { middleware as paraglideMiddleware } from "@/lib/i18n"
export function middleware(request: NextRequest) {
	const lang = paraglideMiddleware.detectLanguage(request)
	//do something with the language...
	// still use the paraglide middleware
	return paraglideMiddleware(request)
}
```