import { Button } from "@/components/ui/button.tsx";
import IconArrowLeft from "@/components/icons/IconArrowLeft.tsx";

interface SectionHeaderProps {
	title: string;
	backaction?: () => void;
	fileActions?: React.ReactNode[];
	children?: React.ReactNode;
}

const SectionHeader = ({
	title,
	backaction,
	fileActions,
	children,
}: SectionHeaderProps) => {
	return (
		<div className="flex items-center justify-between px-5 h-[60px] min-w-0">
			<div className="flex items-center gap-3 min-w-0">
				{backaction && (
					<Button variant="ghost" size="icon" onClick={backaction}>
						<IconArrowLeft />
					</Button>
				)}
				<h2 className="text-lg font-medium text-foreground">{title}</h2>
				{fileActions && fileActions.length > 0 && (
					<div className="flex items-center gap-3 flex-shrink-0">
						{fileActions.map((action, index) => (
							<div key={index}>{action}</div>
						))}
					</div>
				)}
			</div>
			<div className="flex items-center flex-shrink-0">{children}</div>
		</div>
	);
};

export default SectionHeader