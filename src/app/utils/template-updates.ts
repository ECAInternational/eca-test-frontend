import type { Template, Document, TemplateVersion } from '~/types/template';

export type UpdateResult = {
  success: boolean;
  error?: string;
  updatedDocuments: string[];
  skippedDocuments: string[];
  requiresManualUpdate: string[];
};

export type TemplateChange = {
  type: 'major' | 'minor';
  oldContent: string;
  newContent: string;
  description: string;
};

export type UpdateOptions = {
  autoApplyMinor?: boolean;
  forceUpdate?: boolean;
};

function detectBreakingChanges(oldContent: string, newContent: string): boolean {
  // Check for potentially breaking changes:
  // 1. Removed variables
  const oldVariables = [...oldContent.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1]);
  const newVariables = [...newContent.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1]);
  const removedVariables = oldVariables.filter(v => !newVariables.includes(v));
  
  // 2. Major structural changes (e.g., removed sections)
  const oldSections = oldContent.split('\n\n').length;
  const newSections = newContent.split('\n\n').length;
  const majorStructuralChange = Math.abs(oldSections - newSections) > 2;

  return removedVariables.length > 0 || majorStructuralChange;
}

function applyTemplateUpdate(document: Document, oldContent: string, newContent: string): string {
  // For minor changes, we try to intelligently merge the changes
  // while preserving any document-specific modifications
  
  // 1. Find document-specific modifications
  const segments = oldContent.split(/(\{\{[^}]+\}\})/);
  const documentSegments = document.documentContent.split(/(\{\{[^}]+\}\})/);
  const customizations: Record<string, string> = {};
  
  segments.forEach((segment, i) => {
    if (segment !== documentSegments[i]) {
      customizations[segment] = documentSegments[i];
    }
  });

  // 2. Apply document customizations to new template
  let updatedContent = newContent;
  Object.entries(customizations).forEach(([original, custom]) => {
    updatedContent = updatedContent.replace(original, custom);
  });

  return updatedContent;
}

export async function handleTemplateUpdate(
  template: Template,
  change: TemplateChange,
  documents: Document[],
  options: UpdateOptions = {}
): Promise<UpdateResult> {
  const result: UpdateResult = {
    success: true,
    updatedDocuments: [],
    skippedDocuments: [],
    requiresManualUpdate: []
  };

  const hasBreakingChanges = detectBreakingChanges(change.oldContent, change.newContent);

  // For major changes or when breaking changes are detected,
  // we require manual updates unless forceUpdate is true
  if ((change.type === 'major' || hasBreakingChanges) && !options.forceUpdate) {
    result.requiresManualUpdate = documents.map(doc => doc.documentId);
    return result;
  }

  // For minor changes, we can auto-apply if enabled
  if (change.type === 'minor' && options.autoApplyMinor) {
    for (const document of documents) {
      try {
        const updatedContent = applyTemplateUpdate(
          document,
          change.oldContent,
          change.newContent
        );
        
        // Here we would update the document in the database
        // For now, we just track the update
        result.updatedDocuments.push(document.documentId);
        
      } catch (error) {
        console.error('Failed to update document:', document.documentId, error);
        result.skippedDocuments.push(document.documentId);
      }
    }
  } else {
    result.skippedDocuments = documents.map(doc => doc.documentId);
  }

  return result;
}
