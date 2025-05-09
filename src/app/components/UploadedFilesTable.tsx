import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@ecainternational/eca-components';
import { createPortal } from 'react-dom';
import FileUploadModal from './FileUploadModal';
import type { UploadedFile } from '~/types/uploadedFile';

interface UploadedFilesTableProps {
  files: UploadedFile[];
  onUpload: (data: { file: File; documentName: string; documentType: string; description?: string }) => void;
  onUpdate: (file: UploadedFile) => void;
  onDelete: (file: UploadedFile) => void;
  globalFilter: string;
}

export default function UploadedFilesTable({ files, onUpload, onUpdate, onDelete, globalFilter }: UploadedFilesTableProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredFiles = globalFilter
    ? files.filter(file => 
        file.fileName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        file.documentName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        file.documentType.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(globalFilter.toLowerCase()))
      )
    : files;

  // Close menu when files array changes (after update/delete)
  React.useEffect(() => {
    setOpenMenuId(null);
  }, [files]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="text-neutral-detail-boldest heading-md-mid">
          Uploaded Files{' '}
          <span className="text-neutral-detail-pale !font-[300]">{filteredFiles.length}</span>
        </div>
        <Button
          name="upload"
          variant="outline"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2"
        >
          Upload File
        </Button>
      </div>
      <div className="h-full overflow-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-controls-lines-paler bg-neutral-layer-2 text-neutral-detail-bolder border-y text-left">
              <th className="label-sm-heavier whitespace-nowrap px-4 py-3">File Name</th>
              <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Document Name</th>
              <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Type</th>
              <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Description</th>
              <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Size</th>
              <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Uploaded</th>
              <th className="label-sm-heavier whitespace-nowrap px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr key={file.fileId} className="group/row border-controls-lines-paler hover:bg-neutral-layer-2 border-b transition-colors">
                <td className="px-4 py-3">
                  <div className="text-neutral-body label-sm-mid flex items-center gap-2">
                    {file.fileName}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-neutral-body label-sm-mid flex items-center gap-2">
                    {file.documentName}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="paragraph-sm-mid flex items-center gap-2">
                    {file.documentType || file.fileType}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="paragraph-sm-mid flex items-center gap-2">
                    {file.description || '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="paragraph-sm-mid flex items-center gap-2">
                    {formatFileSize(file.fileSize)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="paragraph-sm-mid flex items-center gap-2">
                    {formatDate(file.uploadedOn)}
                  </div>
                </td>
                <td className="group-odd/row:bg-controls-tr-even-layer1 group-even/row:bg-neutral-layer-1 border-b-controls-lines-paler paragraph-sm-mid first:border-r-controls-lines-paler first:z-1 text-nowrap border-b p-3 first:sticky first:left-0 first:border-r">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      name="file-actions"
                      className="!p-1 !min-w-0"
                      onClick={(e) => {
                        const button = e.currentTarget;
                        const menu = button.nextElementSibling as HTMLDivElement;
                        const isOpen = menu.classList.contains('hidden');
                        
                        // Close all other menus first
                        document.querySelectorAll('.actions-menu').forEach(m => {
                          if (m !== menu) m.classList.add('hidden');
                        });
                        
                        // Toggle current menu
                        menu.classList.toggle('hidden');
                        setOpenMenuId(isOpen ? file.fileId : null);
                        
                        if (isOpen) {
                          const rect = button.getBoundingClientRect();
                          menu.style.top = `${rect.bottom + 8}px`;
                          menu.style.left = `${rect.left - menu.offsetWidth + rect.width}px`;
                          
                          // Close menu when clicking outside
                          const closeMenu = (e: MouseEvent) => {
                            if (!menu.contains(e.target as Node) && !button.contains(e.target as Node)) {
                              menu.classList.add('hidden');
                              setOpenMenuId(null);
                              document.removeEventListener('click', closeMenu);
                            }
                          };
                          document.addEventListener('click', closeMenu);
                        }
                      }}
                      aria-label="File actions"
                    >
                      <i className="fi-rr-menu-dots"></i>
                    </Button>
                    <div className={`actions-menu ${openMenuId === file.fileId ? '' : 'hidden'} fixed mt-2 w-56 rounded-md border border-neutral-detail-paler bg-neutral-layer-2 text-left shadow-lg paragraph-sm-lighter focus:outline-none`} style={{ zIndex: 50 }}>
                      <Button
                        variant="ghost"
                        name="update-file"
                        className="w-full !flex-row !justify-start gap-3 !rounded-none !border-0"
                        onClick={() => {
                          onUpdate(file);
                          setOpenMenuId(null);
                        }}
                      >
                        Update
                      </Button>
                      <Button
                        variant="ghost"
                        name="delete-file"
                        className="w-full !flex-row !justify-start gap-3 !rounded-none !border-0"
                        onClick={() => {
                          onDelete(file);
                          setOpenMenuId(null);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filteredFiles.length === 0 && (
              <tr className="border-controls-lines-paler hover:bg-neutral-layer-2 border-b transition-colors">
                <td colSpan={7} className="px-4 py-3 text-center text-neutral-detail">
                  No files found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={onUpload}
      />
    </div>
  );
}
