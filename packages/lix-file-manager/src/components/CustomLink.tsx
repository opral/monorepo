import React from 'react';
import { Link as RouterLink } from "react-router-dom";

interface CustomLinkProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	to: string;
}

const CustomLink = React.forwardRef<HTMLAnchorElement, CustomLinkProps>(
	({ to, ...props }, ref) => {
		const isCrossAppNavigation =
			// if /app route but the /app route is not /app/fm]
			to.startsWith("/app") && to.startsWith("/app/fm") === false;
			
		if (isCrossAppNavigation) {
			return (
				<a href={to} ref={ref} {...props}>
					{props.children}
				</a>
			);
		}

		return <RouterLink to={to} ref={ref} {...props} />;
	}
);

CustomLink.displayName = "CustomLink";

export default CustomLink;