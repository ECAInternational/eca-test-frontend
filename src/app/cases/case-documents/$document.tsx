import type { FC, PropsWithChildren } from 'react';
import React from 'react';
import { useLoaderData, useOutletContext, Link } from '@remix-run/react';
import { Avatar, Button, IconButton, Select as ECASelect } from '@ecainternational/eca-components';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getSession } from '~/utils/session.server';
import applicationData from '~/data/application-data.json';
import type { Document } from '~/cases/components/DocumentsTable';

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
      caseData: Record<string, string>;
    }>;
    templates: Array<{
      templateId: string;
      templateName: string;
      templateContent: string;
    }>;
    variables: Array<{
      variableId: string;
      variableName: string;
      variableLabel: string;
    }>;
  };
  systemVariables: Array<{
    variableId: string;
    variableName: string;
    variableLabel: string;
  }>;
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-neutral-detail-palest text-neutral-detail-bold';
    case 'pending approval':
      return 'bg-warning-palest text-warning-main';
    case 'approved':
      return 'bg-success-palest text-success-main';
    case 'rejected':
      return 'bg-error-palest text-error-main';
    default:
      return 'bg-neutral-detail-palest text-neutral-detail-bold';
  }
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const { documentId } = params;
  const session = await getSession(request.headers.get("Cookie"));
  const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
  const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);

  if (!selectedTenant) {
    throw new Response("Tenant not found", { status: 404 });
  }

  // Find the document across all cases
  const document = selectedTenant.cases
    .flatMap(caseItem => 
      caseItem.documents.map(doc => ({
        ...doc,
        caseName: caseItem.caseName,
        caseId: caseItem.caseId
      }))
    )
    .find(doc => doc.documentId === documentId);

  if (!document) {
    throw json({
      message: "Document not found",
      backUrl: "/cases/case-documents"
    }, { status: 404 });
  }

  return json(document);
};

const Select: FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <div className="inline-flex">
      <ECASelect size="small" className="!label-sm-mid !text-neutral-detail-boldest py-px">
        {children}
      </ECASelect>
    </div>
  );
};

const Document: FC = () => {
  const document = useLoaderData<typeof loader>();
  const { selectedTenant, systemVariables } = useOutletContext<ContextType>();
  const template = selectedTenant.templates.find(t => t.templateId === document.templateId);

  return (
    <div className="flex h-full flex-col bg-neutral-layer-1">
      <div className="@container/case-document text-neutral-body flex flex-col">
        <header className="text-neutral-body border-neutral-detail-paler mt-4 flex border-b px-4 pb-2 pt-px">
          <div className="flex flex-1 items-center justify-start gap-4">
            <h2 className="heading-md-mid text-2xl">{document.documentName}</h2>
            <div className="paragraph-sm-mid ml-6 flex items-center gap-2">
              <i className={`fi fi-ss-circle flex ${document.documentStatus === 'Approved' ? 'text-success-main' : 'text-neutral-detail-bold'}`} />
              <span className="paragraph-sm-mid">{document.documentType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`paragraph-sm-mid rounded-full px-2 py-0.5 ${getStatusColor(document.documentStatus)}`}>
                {document.documentStatus}
              </span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            {[
              { name: 'edit', label: 'Edit', icon: 'fi fi-rr-pencil', active: true },
              { name: 'preview', label: 'Preview', icon: 'fi fi-rr-eye', active: false },
            ].map(({ name, label, icon, active }) => (
              <Button
                key={name}
                name={name}
                variant="ghost"
                className={`flex items-center gap-2 ${active ? 'bg-secondary-palest' : ''}`}
              >
                <i className={`fi ${icon} flex`} />
                <span className="label-sm-mid !leading-[1.125rem]">{label}</span>
              </Button>
            ))}
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <IconButton
              icon="fi-rr-download"
              name="Download"
              variant="tonal"
              size="small"
              className="!bg-controls-element-tonal"
            />
            <Button name="share" variant="primary" size="small">
              Share for approval
            </Button>
          </div>
        </header>
        <div className="flex flex-1">
          <div className="bg-neutral-layer-3 flex-1 py-6 pe-3 ps-6">
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 11.5rem)' }}>
              <div className="bg-neutral-layer-2 border-controls-lines-paler me-3 flex flex-col gap-6 rounded-xl border p-10">
                <div className="flex flex-col gap-6">
                  {/* Render template content with variable selectors */}
                  {template && (
                    <div className="flex flex-col gap-6">
                      {template.templateContent.split(/(\{\{[^}]+\}\})/).map((part, index) => {
                        const match = part.match(/\{\{([^}]+)\}\}/);
                        if (match) {
                          const variableName = match[1].trim();
                          const variable = [...selectedTenant.variables, ...systemVariables]
                            .find(v => v.variableName === variableName);
                          
                          return variable ? (
                            <Select key={index}>
                              <option>{variable.variableLabel}</option>
                            </Select>
                          ) : part;
                        }
                        return <span key={index}>{part}</span>;
                      })}
                    </div>
                  )}
                </div>
                <div className="border-controls-lines-paler flex flex-col gap-6 border-b pb-10">
                  <div className="h-32 w-32">
                    <img src="/prototype/ageas-logo.svg" alt="Assignment Letter Logo" className="h-full w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-controls-lines-pale flex flex-col gap-6 border-s px-3 py-8">
            <ul className="flex flex-col gap-3">
              {[
                { name: 'input', icon: 'fi-rr-text-box-edit', active: false },
                { name: 'pen', icon: 'fi-rr-pen-nib', active: true },
                { name: 'info', icon: 'fi-rr-info', active: false },
              ].map(({ name, icon, active }, index) => (
                <li key={index}>
                  <IconButton name={name} icon={icon} variant={active ? 'tonal' : 'standard'} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Document;