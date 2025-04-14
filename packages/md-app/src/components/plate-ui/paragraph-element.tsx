

import React from 'react';

import { cn } from '@udecode/cn';
import { PlateElement, withRef } from '@udecode/plate/react';

export const ParagraphElement = withRef<typeof PlateElement>(
  ({ children, className, ...props }, ref) => {
    const hasListType = children.type === "ol" || children.type === "ul"

    return (
      <PlateElement
        ref={ref}
        className={cn(className, 'm-0 px-0 py-1', !hasListType && "ml-0!")}
        {...props}
      >
        {children}
      </PlateElement >
    );
  }
);
