import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ModalProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  title?: string;
  children: React.ReactNode;
}

export const Modal = ({ title, children, ...props }: ModalProps) => {
  return (
    <Dialog {...props}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};