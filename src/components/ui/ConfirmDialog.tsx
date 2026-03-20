import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-foreground/50 mt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-full h-10 border-white/10"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 rounded-full h-10 active:scale-95 transition-all duration-150 ${
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                : ''
            }`}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
