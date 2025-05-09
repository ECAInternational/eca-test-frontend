export interface UploadedFile {
  fileId: string;
  fileName: string;
  fileType: string;
  documentName: string;
  documentType: string;
  description?: string;
  uploadedOn: string;
  caseId: string;
  tenantId: string;
  fileSize: number;
  contentType: string;
}

export interface UploadedFilesStore {
  tenants: {
    [tenantId: string]: {
      [caseId: string]: UploadedFile[];
    };
  };
}
