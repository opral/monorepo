export const middleware = async (ctx: any, next: any) => {
	await next()
}

export const config = {
	//Must be hardcoded string
	matcher: ["/", `/(de|en|de-CH)/:path*`],
}
