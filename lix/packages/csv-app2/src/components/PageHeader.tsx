export default function PageHeader(props: { title: string }) {
	return (
		<div className="py-6 px-3 bg-white border-b border-zinc-200 text-xl">
			<p className="leading-normal! mx-auto max-w-7xl">{props.title}</p>
		</div>
	);
}
