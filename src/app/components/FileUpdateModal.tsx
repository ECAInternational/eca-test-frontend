import React from 'react';
import { Dialog } from '@headlessui/react';
import { Button, TextInput, Select } from '@ecainternational/eca-components';
import type { UploadedFile } from '~/types/uploadedFile';

interface FileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: { fileId: string; documentName: string; documentType: string; description?: string; file?: File }) => void;
  file: UploadedFile | null;
}

export default function FileUpdateModal({ isOpen, onClose, onUpdate, file }: FileUpdateModalProps) {
  const [documentName, setDocumentName] = React.useState('');
  const [documentType, setDocumentType] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [newFile, setNewFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize form when file changes
  React.useEffect(() => {
    if (file) {
      setDocumentName(file.documentName);
      setDocumentType(file.documentType);
      setDescription(file.description || '');
      setNewFile(null);
    }
  }, [file]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file || !documentName || !documentType) {
      return;
    }

    onUpdate({
      fileId: file.fileId,
      documentName,
      documentType,
      description: description || '',
      file: newFile || undefined,
    });

    // Reset form
    setNewFile(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setNewFile(selectedFile);
    }
  };

  const documentTypeOptions = [
    { value: 'Passport', label: 'Passport' },
    { value: 'Visa', label: 'Visa' },
    { value: 'Identification', label: 'Identification' },
    { value: 'Other', label: 'Other' }
  ];

  if (!file) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-75" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-neutral-layer-1 dark:bg-neutral-layer-3 shadow-xl transition-all border-2 border-controls-lines">
          <div className="border-b border-controls-lines px-6 py-4">
            <Dialog.Title className="heading-md-heavier text-neutral-content-default dark:text-neutral-content-inverse">
              Update Document
            </Dialog.Title>
          </div>
          
          <form onSubmit={handleSubmit} encType="multipart/form-data" method="post">
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="label-sm-heavier text-neutral-detail-bold dark:text-neutral-detail-muted block mb-2">
                    Document Name
                  </label>
                  <TextInput
                    name="documentName"
                    value={documentName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentName(e.target.value)}
                    required
                    placeholder="Enter document name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="label-sm-heavier text-neutral-detail-bold dark:text-neutral-detail-muted block mb-2">
                    Document Type
                  </label>
                  <Select
                    name="documentType"
                    value={documentType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDocumentType(e.target.value)}
                    required
                    className="w-full"
                  >
                    <option value="">Select document type</option>
                    {documentTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="label-sm-heavier text-neutral-detail-bold dark:text-neutral-detail-muted block mb-2">
                    Description (Optional)
                  </label>
                  <TextInput
                    name="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    placeholder="Enter document description"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="label-sm-heavier text-neutral-detail-bold dark:text-neutral-detail-muted block mb-2">
                    Replace File (Optional)
                  </label>
                  <input
                    type="file"
                    name="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    name="choose-file"
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    {newFile ? newFile.name : 'Choose New File'}
                  </Button>
                  {!newFile && (
                    <p className="mt-2 text-neutral-detail dark:text-neutral-detail-muted paragraph-sm-light">
                      Current file: {file.fileName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-controls-lines bg-neutral-layer-2 dark:bg-neutral-layer-4 px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button
                  name="cancel"
                  variant="ghost"
                  type="button"
                  onClick={onClose}
                  className="hover:bg-neutral-layer-3 dark:hover:bg-neutral-layer-5"
                >
                  Cancel
                </Button>
                <Button
                  name="update"
                  variant="primary"
                  type="submit"
                  disabled={!documentName || !documentType}
                >
                  Update
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
