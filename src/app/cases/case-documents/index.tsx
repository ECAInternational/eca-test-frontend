import React, { useState } from 'react';
import { useOutletContext } from '@remix-run/react';
import DocumentsTable from '~/cases/components/DocumentsTable';
import DocumentsControlBar from '~/cases/components/DocumentsControlBar';
import { Select } from '@ecainternational/eca-components';

type ContextType = {
  selectedTenant: {
    tenantId: string;
    tenantName: string;
    cases: Array<{
      caseId: string;
      caseName: string;
      documents: Array<{
        documentId: string;
        documentName: string;
        documentType: string;
        documentVersion: string;
        documentCreatedOn: string;
        documentContent: string;
        templateId: string;
        documentStatus: string;
      }>;
    }>;
  };
  systemVariables: Array<{
    variableId: string;
    variableName: string;
    variableLabel: string;
  }>;
};

export default function CaseDocumentsIndex() {
  const { selectedTenant, systemVariables } = useOutletContext<ContextType>();
  const [selectedCaseId, setSelectedCaseId] = useState(selectedTenant.cases[0]?.caseId || '');
  const [globalFilter, setGlobalFilter] = useState('');

  const selectedCase = selectedTenant.cases.find(c => c.caseId === selectedCaseId);
  const documents = selectedCase?.documents.map(doc => ({
    ...doc,
    caseName: selectedCase.caseName,
    caseId: selectedCase.caseId
  })) || [];

  return (
    <div className="flex h-full flex-col bg-neutral-layer-1">
      <div className="flex flex-col gap-6 px-8 pb-10 pt-4">
        <div className="flex flex-row items-center justify-between">
          <div className="text-neutral-detail-boldest heading-md-mid">
            Documents <span className="text-neutral-detail-pale !font-[300]">{documents.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-neutral-detail label-sm-mid">
              Case:
            </div>
            <Select
              name="caseId"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              variant="tonal"
              className="!label-sm-mid !text-neutral-detail-boldest w-48"
            >
              {selectedTenant.cases.map(caseItem => (
                <option key={caseItem.caseId} value={caseItem.caseId}>
                  {caseItem.caseName}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DocumentsControlBar setGlobalFilter={setGlobalFilter} />
        <DocumentsTable 
          globalFilter={globalFilter} 
          setGlobalFilter={setGlobalFilter} 
          documents={documents} 
        />
      </div>
    </div>
  );
}