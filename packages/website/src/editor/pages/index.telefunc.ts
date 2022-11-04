export async function onHello({ name }: { name: string }) {
	const message = "Welcome " + name;
	return { message };
}
