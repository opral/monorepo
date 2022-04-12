// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handle(args: { event: any; resolve: any }): Promise<unknown> {
	const response = await args.resolve(args.event, {
		// disable ssr for now
		ssr: false
	});
	return response;
}
