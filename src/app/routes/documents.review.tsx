import React from 'react';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useOutletContext, useNavigate } from '@remix-run/react';
import { Button, IconButton, Alert, Select } from '@ecainternational/eca-components';
import { getSession } from '~/utils/session.server';
import applicationData from '~/data/application-data.json';
import DocumentEditor from '~/components/DocumentEditor';
import type { Document, Template, Tenant } from '~/types/template';

type ContextType = {
  selectedTenant: Tenant;
  systemVariables: Array<{
    variableId: string;
    variableName: string;
    variableLabel: string;
  }>;
};

type LoaderData = {
  documentsToReview: Array<{
    document: Document;
    template: Template;
    caseId: string;
    caseName: string;
  }>;
  selectedTenantId: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
  const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId) as unknown as Tenant;

  if (!selectedTenant) {
    throw new Response("Tenant not found", { status: 404 });
  }

  // Find all documents that need review
  // In a real implementation, this would be based on a database query
  // For now, we'll find documents where template version doesn't match current
  const documentsToReview: LoaderData['documentsToReview'] = [];
  
  selectedTenant.cases.forEach(caseItem => {
    caseItem.documents.forEach(doc => {
      const template = selectedTenant.templates.find(t => t.templateId === doc.templateId);
      if (template && doc.templateVersion !== template.currentVersion) {
        documentsToReview.push({
          document: doc,
          template,
          caseId: caseItem.caseId,
          caseName: caseItem.caseName
        });
      }
    });
  });

  return json({ documentsToReview, selectedTenantId });
};

export default function DocumentReview() {
  const { documentsToReview } = useLoaderData<LoaderData>();
  const { selectedTenant, systemVariables } = useOutletContext<ContextType>();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [editorContent, setEditorContent] = React.useState(
    documentsToReview[0]?.document.documentContent || ''
  );
  const navigate = useNavigate();

  const currentDocument = documentsToReview[currentIndex];
  const templateContent = currentDocument?.template.versions.find(
    v => v.versionNumber === currentDocument.template.currentVersion
  )?.content || '';

  const handleApplyChanges = async () => {
    // Here we would update the document content and version
    // For now, we'll just move to the next document
    if (currentIndex < documentsToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setEditorContent(documentsToReview[currentIndex + 1].document.documentContent);
    } else {
      // All documents reviewed, return to templates
      navigate('/templates');
    }
  };

  const handleSkip = () => {
    if (currentIndex < documentsToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setEditorContent(documentsToReview[currentIndex + 1].document.documentContent);
    }
  };

  if (documentsToReview.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-neutral-layer-1 p-8">
        <div className="text-neutral-detail-boldest heading-lg-mid mb-4">
          No Documents to Review
        </div>
        <div className="text-neutral-detail mb-8">
          All documents are up to date with their templates.
        </div>
        <Button
          name="back"
          variant="primary"
          onClick={() => navigate('/templates')}
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-neutral-layer-1">
      <div className="@container/review text-neutral-body flex flex-col">
        {/* Header */}
        <div className="border-controls-lines-pale flex items-center justify-between border-b px-8 py-4">
          <div className="flex items-center gap-4">
            <IconButton
              name="back"
              variant="outline"
              icon="arrow-left"
              onClick={() => navigate('/templates')}
              aria-label="Back to templates"
            >
              ←
            </IconButton>
            <div className="text-neutral-detail-boldest heading-md-mid">
              Document Review
            </div>
            <div className="text-neutral-detail label-sm-mid">
              {currentIndex + 1} of {documentsToReview.length}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              name="skip"
              variant="outline"
              onClick={handleSkip}
              disabled={currentIndex === documentsToReview.length - 1}
            >
              Skip for Now
            </Button>
            <Button
              name="apply"
              variant="primary"
              onClick={handleApplyChanges}
            >
              {currentIndex === documentsToReview.length - 1 ? 'Finish Review' : 'Apply & Next'}
            </Button>
          </div>
        </div>

        {/* Document Info */}
        <div className="mx-8 mt-4">
          <Alert
            variant="info"
            label="Document Information"
            content={`Reviewing "${currentDocument.document.documentName}" from case "${currentDocument.caseName}". This document needs to be updated from template version ${currentDocument.document.templateVersion} to ${currentDocument.template.currentVersion}.`}
          />
        </div>

        {/* Editor */}
        <div className="flex flex-1 gap-4 p-8">
          {/* Original Document */}
          <div className="flex-1">
            <div className="text-neutral-detail-boldest mb-4">Current Document</div>
            <div className="bg-neutral-layer-2 border-controls-lines-paler h-full overflow-y-auto rounded-xl border p-6">
              <DocumentEditor
                content={editorContent}
                isPreview={false}
                variables={{
                  caseData: {},
                  systemVariables,
                  tenantVariables: selectedTenant.variables,
                }}
                onUpdate={setEditorContent}
                onEditorReady={() => {}}
              />
            </div>
          </div>

          {/* New Template */}
          <div className="flex-1">
            <div className="text-neutral-detail-boldest mb-4">New Template Version</div>
            <div className="bg-neutral-layer-2 border-controls-lines-paler h-full overflow-y-auto rounded-xl border p-6">
              <DocumentEditor
                content={templateContent}
                isPreview={true}
                variables={{
                  caseData: {},
                  systemVariables,
                  tenantVariables: selectedTenant.variables,
                }}
                onUpdate={() => {}}
                onEditorReady={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
