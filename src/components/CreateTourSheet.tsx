import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { InlineTourChat } from '@/components/InlineTourChat';
import { TourPlan } from '@/types/tour';

interface CreateTourSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTourGenerated: (tour: TourPlan) => void;
  onTourUpdated?: (tour: TourPlan) => void;
}

export function CreateTourSheet({ open, onOpenChange, onTourGenerated, onTourUpdated }: CreateTourSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Create a custom tour</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <InlineTourChat onTourGenerated={onTourGenerated} onTourUpdated={onTourUpdated} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
