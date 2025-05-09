import React from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@ecainternational/eca-components';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-75" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-neutral-layer-1 dark:bg-neutral-layer-3 shadow-xl transition-all border-2 border-controls-lines">
          <div className="border-b border-controls-lines px-6 py-4">
            <Dialog.Title className="heading-md-heavier text-neutral-content-default dark:text-neutral-content-inverse">
              {title}
            </Dialog.Title>
          </div>
          <div className="px-6 py-4">
            <p className="text-neutral-body dark:text-neutral-body-muted paragraph-md-light">{message}</p>
          </div>
          <div className="border-t border-controls-lines bg-neutral-layer-2 dark:bg-neutral-layer-4 px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button variant="ghost" name="cancel" onClick={onClose} className="hover:bg-neutral-layer-3 dark:hover:bg-neutral-layer-5">
                Cancel
              </Button>
              <Button variant="primary" name="confirm" onClick={onConfirm} className="!bg-red-500 hover:!bg-red-600">
                Delete
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}