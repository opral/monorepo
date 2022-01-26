// See this https://github.com/sveltejs/kit/pull/2804#issuecomment-1014085883

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handle(args: { event: any; resolve: any }): Promise<unknown> {
	const response = await args.resolve(args.event, {
		ssr: false
	});
	return response;
}
