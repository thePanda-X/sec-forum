import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-0 right-0 bottom-0 z-50 w-full m-0 max-h-[70vh] rounded-t-2xl",
            "bg-background border shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "md:left-1/2 md:right-1/2 md:top-1/2 md:bottom-auto md:max-w-md md:rounded-lg",
            "md:translate-x-[-50%] md:translate-y-[-50%]",
            className
          )}
        >
          <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 md:p-6">
              <div className="flex items-center justify-between">
                <DialogPrimitive.Title className="text-base font-semibold md:text-lg">{title}</DialogPrimitive.Title>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center mt-2 md:hidden">
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
