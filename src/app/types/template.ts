import type { UploadedFile } from './uploadedFile';

export type TemplateVersion = {
  versionId: string;
  versionNumber: string;  // e.g., "v1.0", "v2.1"
  content: string;
  createdAt: string;
  createdBy?: string;
  changeType: 'major' | 'minor';
  changeDescription: string;
  linkedDocuments?: string[];  // List of document IDs using this version
};

export type Template = {
  templateId: string;
  templateName: string;
  policyType: string;
  currentVersion: string;
  versions: TemplateVersion[];
  lastModified: string;
  documentCount?: number;  // Number of documents currently using this template
};

export type Document = {
  documentId: string;
  documentName: string;
  documentType: string;
  documentVersion: string;
  documentContent: string;  // The actual content of the document
  templateId: string;
  templateVersion: string;  // The specific version of the template being used
  documentCreatedOn: string;
  documentStatus: string;
};

export type Case = {
  caseId: string;
  employeeId: string;
  caseName: string;
  documents: Document[];
  uploadedFiles: UploadedFile[];
  caseData: {
    [key: string]: string;
  };
};

export type Tenant = {
  tenantId: string;
  tenantName: string;
  policies: Array<{
    policyId: string;
    policyName: string;
    policyType: string;
    requiredDocumentIds: string[];
  }>;
  templates: Template[];
  cases: Case[];
  variables: Array<{
    variableId: string;
    variableName: string;
    variableLabel: string;
  }>;
};

export function incrementVersion(currentVersion: string, changeType: 'major' | 'minor'): string {
  const match = currentVersion.match(/v(\d+)\.(\d+)/);
  if (!match) {
    return 'v1.0';
  }

  const [, major, minor] = match;
  if (changeType === 'major') {
    return `v${parseInt(major) + 1}.0`;
  } else {
    return `v${major}.${parseInt(minor) + 1}`;
  }
}

export function getTemplateStats(tenant: Tenant, templateId: string): { 
  documentCount: number; 
  versionUsage: Record<string, string[]>;  // Map of version numbers to document IDs
} {
  const documentCount = tenant.cases.reduce((count, caseItem) => {
    return count + caseItem.documents.filter(doc => doc.templateId === templateId).length;
  }, 0);

  const versionUsage: Record<string, string[]> = {};
  tenant.cases.forEach(caseItem => {
    caseItem.documents.forEach(doc => {
      if (doc.templateId === templateId) {
        if (!versionUsage[doc.templateVersion]) {
          versionUsage[doc.templateVersion] = [];
        }
        versionUsage[doc.templateVersion].push(doc.documentId);
      }
    });
  });

  return { documentCount, versionUsage };
}
