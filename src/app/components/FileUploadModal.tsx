import React from 'react';
import { Dialog } from '@headlessui/react';
import { Button, TextInput, Select } from '@ecainternational/eca-components';
import { Form } from '@remix-run/react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { file: File; documentName: string; documentType: string; description?: string }) => void;
}

export default function FileUploadModal({ isOpen, onClose, onUpload }: FileUploadModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [documentName, setDocumentName] = React.useState('');
  const [documentType, setDocumentType] = React.useState('');
  const [description, setDescription] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submit attempted with:', { documentName, documentType, description, fileName: file?.name });
    
    if (!file || !documentName || !documentType) {
      console.log('Validation failed:', {
        hasFile: !!file,
        hasDocumentName: !!documentName,
        hasDocumentType: !!documentType
      });
      return;
    }

    console.log('Calling onUpload with:', {
      fileName: file.name,
      documentName,
      documentType,
      description: description || '',
    });

    onUpload({
      file,
      documentName,
      documentType,
      description: description || '',
    });

    // Reset form
    setFile(null);
    setDocumentName('');
    setDocumentType('');
    setDescription('');
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    console.log('File selected:', selectedFile?.name);
    
    if (selectedFile) {
      setFile(selectedFile);
      if (!documentName) {
        const newDocumentName = selectedFile.name.replace(/\.[^/.]+$/, '');
        console.log('Setting default document name:', newDocumentName);
        setDocumentName(newDocumentName);
      }
    }
  };

  const documentTypeOptions = [
    { value: 'Passport', label: 'Passport' },
    { value: 'Visa', label: 'Visa' },
    { value: 'Identification', label: 'Identification' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-75" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-neutral-layer-1 dark:bg-neutral-layer-3 shadow-xl transition-all border-2 border-controls-lines">
          <div className="border-b border-controls-lines px-6 py-4">
            <Dialog.Title className="heading-md-heavier text-neutral-content-default dark:text-neutral-content-inverse">
              Upload Document
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
                    File
                  </label>
                  <input
                    type="file"
                    name="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <Button
                    name="choose-file"
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    {file ? file.name : 'Choose File'}
                  </Button>
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
                  name="upload"
                  variant="primary"
                  type="submit"
                  disabled={!file || !documentName || !documentType}
                >
                  Upload
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
