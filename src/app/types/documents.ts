export interface TenantDocument {
  documentId: string;
  documentName: string;
  documentType: string;
  documentVersion: string;
  documentCreatedOn: string;
  documentContent: string;
  templateId: string;
  case: {
    caseId: string;
    caseName: string;
    caseData: Record<string, string>;
  };
}

export interface PDFOptions {
  margin?: [number, number];
  format?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  scale?: number;
}
