import React, { useEffect, useState } from 'react';
import { getFileFromLix } from '@/helper/upload-to-lix';
import { Spinner } from './spinner';
import { useAtom } from 'jotai';
import { lixAtom } from '@/state';
import { cn } from '@udecode/cn';

interface LixImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * Component to handle displaying images from Lix database
 */
export function LixImage({ src, alt, className, ...props }: LixImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lix] = useAtom(lixAtom)

  useEffect(() => {
    // Reset state when src changes
    setLoading(false);
    setError(false);
    setObjectUrl(null);

    // Handle empty or missing src
    if (!src) {
      setError(true);
      return;
    }

    // Only process if src is a https://lix.host URL
    if (!src.startsWith('https://lix.host')) {
      setObjectUrl(src);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      setError(false);
      try {
        // Extract file ID from URL
        try {
          // Parse URL and extract parameters
          const url = new URL(src);
          const fileId = url.searchParams.get('f');

          if (!fileId) {
            console.error('No file ID found in URL:', src);
            setError(true);
            setObjectUrl(null);
            return;
          }

          const blob = await getFileFromLix(fileId, lix);

          if (!blob) {
            console.error('File not found for ID:', fileId);
            setError(true);
            setObjectUrl(null);
            return;
          }

          // For base64 display in markdown
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setObjectUrl(base64data);
          };
          reader.readAsDataURL(blob);
        } catch (innerErr) {
          console.error('Error parsing URL or loading file:', innerErr);
          setError(true);
        }
      } catch (err) {
        console.error('Error loading image from Lix:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function to revoke object URL if needed
    return () => {
      if (objectUrl && objectUrl !== src && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-muted/20 h-48 w-full rounded-sm">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-destructive/10 h-48 w-full rounded-sm text-destructive">
        Failed to load image
      </div>
    );
  }

  if (!objectUrl) {
    // Don't render an image at all if there's no source
    return (
      <div className={cn("h-32 w-full flex items-center justify-center bg-muted/20", className)}>
        <span className="text-sm text-muted-foreground">No image</span>
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} {...props} />;
}