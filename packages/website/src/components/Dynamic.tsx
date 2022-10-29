export function Dynamic(props: { color: string; children?: React.ReactNode }) {
	return <div className={`bg-${props.color} p-5`}>{props.children}</div>;
}
