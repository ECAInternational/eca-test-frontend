import type { UploadedFile } from './uploadedFile';

export type UploadedFilesStore = {
  tenants: {
    [tenantId: string]: {
      [caseId: string]: UploadedFile[];
    };
  };
};
