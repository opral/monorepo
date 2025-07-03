import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getFileFromLix, IMAGE_REPLACED_EVENT } from '@/helper/uploadToLix';
import { Spinner } from './spinner';
import { useLix } from '@lix-js/react-utils';
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
  const lix = useLix();
  // Keep track of the last timestamp to force reload when src is the same
  const timestampRef = useRef<number>(Date.now());
  // Store the fileId for this image to respond to replacement events
  const fileIdRef = useRef<string | null>(null);

  // Extract fileId from a Lix URL
  const extractFileId = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.searchParams.get('f');
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  };

  // Encapsulate the image loading logic to make it reusable
  const loadImage = useCallback(async (imageUrl: string) => {
    if (!imageUrl &&
      !imageUrl.startsWith("https://lix.host") || imageUrl.startsWith("https://lix.host/app/flashtype/images/") &&
      !imageUrl.startsWith("http://localhost:3009") || imageUrl.startsWith("http://localhost:3009/images/")
    ) {
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Extract file ID from URL
      const fileId = extractFileId(imageUrl);
      fileIdRef.current = fileId; // Store for event listener reference

      if (!fileId) {
        console.error('No file ID found in URL:', imageUrl);
        setError(true);
        setObjectUrl(null);
        return;
      }

      if (!lix) {
        console.error('Lix not available');
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

      // For base64 display in markdown with cache busting
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Add timestamp to prevent caching issues when an image is replaced
        setObjectUrl(`${base64data}#t=${timestampRef.current}`);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error loading image from Lix:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lix]);

  // Handle image replaced events
  const handleImageReplaced = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ fileId: string, timestamp: number }>;

    // If this is our fileId, reload the image
    if (customEvent.detail.fileId === fileIdRef.current) {
      console.log(`Image ${fileIdRef.current} was replaced, reloading...`);
      timestampRef.current = customEvent.detail.timestamp;
      loadImage(src);
    }
  }, [src, loadImage]);

  useEffect(() => {
    // Reset state when src changes
    setLoading(false);
    setError(false);
    setObjectUrl(null);

    // Generate new timestamp for cache busting
    timestampRef.current = Date.now();

    // Handle empty or missing src
    if (!src) {
      setError(true);
      return;
    }

    // Only process if src is a https://lix.host URL
    if (
      !src.startsWith("https://lix.host") || src.startsWith("https://lix.host/app/flashtype/images/") &&
      !src.startsWith("http://localhost:3009") || src.startsWith("http://localhost:3009/images/")
    ) {
      setObjectUrl(src);
      return;
    }

    // Load the image initially
    loadImage(src);

    // Add event listener for image replacements
    window.addEventListener(IMAGE_REPLACED_EVENT, handleImageReplaced);

    // Cleanup function to revoke object URL and remove event listener
    return () => {
      window.removeEventListener(IMAGE_REPLACED_EVENT, handleImageReplaced);

      if (objectUrl && objectUrl !== src && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, lix, loadImage, handleImageReplaced]);

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