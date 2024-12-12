import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

interface CustomLinkProps extends RouterLinkProps {
  to: string;
}

const CustomLink: React.FC<CustomLinkProps> = ({ to, ...props }) => {
  const isCrossAppNavigation = to.startsWith('/app/');
  const isHomePage = to.startsWith('/website');

  if (isCrossAppNavigation || isHomePage) {
    return (
      <a href={to} {...props}>
        {props.children}
      </a>
    );
  }

  return <RouterLink to={to} {...props} />;
};

export default CustomLink;