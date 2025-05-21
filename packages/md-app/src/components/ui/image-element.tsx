

import type { TImageElement } from '@udecode/plate-media';
import type { PlateElementProps } from '@udecode/plate/react';

import { useDraggable } from '@udecode/plate-dnd';
import { ImagePlugin, useMediaState } from '@udecode/plate-media/react';
import { PlateElement } from '@udecode/plate/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';
import { LixImage } from './lix-image';
import { MediaPopover } from './media-popover';

export const ImageElement =
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { align = 'center', focused, readOnly, selected } = useMediaState();

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    return (
      <MediaPopover plugin={ImagePlugin}>
        <PlateElement {...props} className="py-2.5">
          <figure className="group relative m-0" contentEditable={false}>
            <div ref={handleRef} style={{ width: '100%' }}>
              <LixImage
                className={cn(
                  'block w-full max-w-full cursor-pointer object-cover px-0',
                  'rounded-sm',
                  focused && selected && 'ring-2 ring-ring ring-offset-2',
                  isDragging && 'opacity-50'
                )}
                alt={(props.attributes as any).alt}
                src={props.element.url || ''}
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

          {props.children}
        </PlateElement>
      </MediaPopover >
    );
  }
