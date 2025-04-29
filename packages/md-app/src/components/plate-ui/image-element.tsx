


import { cn, withRef } from '@udecode/cn';
import { useDraggable } from '@udecode/plate-dnd';
import { ImagePlugin, useMediaState } from '@udecode/plate-media/react';
import { PlateElement } from '@udecode/plate/react';

import { Caption, CaptionTextarea } from './caption';
import { LixImage } from './lix-image';
import { MediaPopover } from './media-popover';

export const ImageElement = withRef<typeof PlateElement>(
  ({ children, className, nodeProps, ...props }, ref) => {
    const { align = 'center', focused, readOnly, selected } = useMediaState();

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    return (
      <MediaPopover plugin={ImagePlugin}>
        <PlateElement
          ref={ref}
          className={cn(className, 'py-2.5')}
          {...props}
        >
          <figure className="group relative m-0" contentEditable={false}>
            <div ref={handleRef} style={{ width: '100%' }}>
              <LixImage
                className={cn(
                  'block w-full max-w-full cursor-pointer object-cover px-0',
                  'rounded-sm',
                  focused && selected && 'ring-2 ring-ring ring-offset-2',
                  isDragging && 'opacity-50'
                )}
                alt={props.element.alt as string || ''}
                src={props.element.url as string || ''}
                {...nodeProps}
              />
            </div>

            <Caption align={align}>
              <CaptionTextarea
                readOnly={readOnly}
                onFocus={(e) => {
                  e.preventDefault();
                }}
                placeholder="Write a caption..."
              />
            </Caption>
          </figure>

          {children}
        </PlateElement>
      </MediaPopover>
    );
  }
);
