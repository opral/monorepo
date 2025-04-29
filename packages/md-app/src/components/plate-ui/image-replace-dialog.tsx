import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

interface ImageReplaceDialogProps {
  open: boolean;
  fileName: string;
  onReplace: () => void;
  onKeep: () => void;
}

export function ImageReplaceDialog({ 
  open, 
  fileName, 
  onReplace, 
  onKeep 
}: ImageReplaceDialogProps) {
  // Don't render anything if dialog shouldn't be open
  if (!open) return null;
  
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Image Name</DialogTitle>
          <DialogDescription>
            An image with the name "{fileName}" already exists.
            Do you want to replace it with the new image or keep the current one?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onKeep}>
            Keep Current
          </Button>
          <Button onClick={onReplace}>
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}