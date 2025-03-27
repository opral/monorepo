import React from 'react';
import { useImagePreviewValue } from '@udecode/plate-media/react';
import { useEditorRef } from '@udecode/plate/react';
import { LixImage } from './lix-image';
import { useAtom } from 'jotai';
import { lixAtom } from '@/state';

interface LixPreviewImageProps {
  className?: string;
}

/**
 * Component to show preview images from Lix storage
 */
export function LixPreviewImage({ className }: LixPreviewImageProps) {
  const editor = useEditorRef();
  const [lix] = useAtom(lixAtom);
  const urls = useImagePreviewValue('urls', editor.id) || [];
  const currentUrlIndex = useImagePreviewValue('currentUrlIndex', editor.id) || 0;
  const scale = useImagePreviewValue('scale') || 1;
  
  if (!urls.length) return null;
  
  const currentUrl = urls[currentUrlIndex];
  
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      <LixImage src={currentUrl} alt="" className={className} />
    </div>
  );
}