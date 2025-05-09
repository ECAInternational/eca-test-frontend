import type { FC, PropsWithChildren } from 'react';
import React, { Fragment, useRef, useState } from 'react';
import {
  useLoaderData,
  useOutletContext,
  useActionData,
  useFetcher,
  useSubmit,
  Form,
} from '@remix-run/react';
import {
  Button,
  IconButton,
  Select as ECASelect,
  TextInput,
  Progress
} from '@ecainternational/eca-components';
import { Dialog, Transition } from '@headlessui/react';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import type { Editor } from '@tiptap/core';
import { getSession } from '~/utils/session.server';
import { savePdf } from '~/utils/pdf.server';
import { generatePdfFromHtml } from '~/utils/pdfPuppeteer.server';
import applicationData from '~/data/application-data.json';
import CaseDocumentEditor from '~/components/CaseDocumentEditor';
import CaseToolPanel from '~/components/CaseToolPanel';

export type ContextType = {
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
        documentStatus?: string;
      }>;
      caseData: Record<string, string>;
    }>;
    templates: Array<{
      templateId: string;
      templateName: string;
      templateContent: string;
      versions: Array<{
        versionNumber: string;
        content: string;
      }>;
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

export const loader: LoaderFunction = async ({ params, request }) => {
  const { documentId } = params;
  const session = await getSession(request.headers.get("Cookie"));
  const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
  const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);
  if (!selectedTenant) {
    throw new Response("Tenant not found", { status: 404 });
  }
  let document = null;
  for (const caseItem of selectedTenant.cases) {
    const foundDoc = caseItem.documents.find(doc => doc.documentId === documentId);
    if (foundDoc) {
      const template = selectedTenant.templates.find(t => t.templateId === foundDoc.templateId);
      const templateVersion = template?.versions.find(v => v.versionNumber === foundDoc.documentVersion);
      document = {
        ...foundDoc,
        documentContent: foundDoc.documentContent || templateVersion?.content || '',
        case: {
          caseId: caseItem.caseId,
          caseName: caseItem.caseName,
          caseData: caseItem.caseData,
        },
      };
      break;
    }
  }
  if (!document) {
    throw new Response("Document not found", { status: 404 });
  }
  // Derive the base URL from the request.
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  // If your static assets (logo, fonts, etc.) are served from the "public" folder, you may use baseUrl + "/public"
  return json({ document, selectedTenantId, baseUrl });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "savePdf") {
    console.log('Processing PDF save request', { documentId: params.documentId });
    const htmlContent = formData.get("htmlContent") as string;
    const selectedTenantId = formData.get("selectedTenantId") as string;
    const documentId = params.documentId as string;
    if (!htmlContent || !selectedTenantId || !documentId) {
      console.error('Missing required data:', {
        hasHtmlContent: !!htmlContent,
        hasSelectedTenantId: !!selectedTenantId,
        hasDocumentId: !!documentId,
      });
      throw new Response("Missing required data", { status: 400 });
    }
    const session = await getSession(request.headers.get("Cookie"));
    const sessionTenantId = session.get("tenantId");
    if (sessionTenantId !== selectedTenantId) {
      console.error('Unauthorized tenant access', { sessionTenantId, requestedTenantId: selectedTenantId });
      throw new Response("Unauthorized tenant access", { status: 403 });
    }
    const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);
    if (!selectedTenant) {
      console.error('Tenant not found', { selectedTenantId });
      throw new Response("Tenant not found", { status: 404 });
    }
    const documentExists = selectedTenant.cases.some(caseItem =>
      caseItem.documents.some(doc => doc.documentId === documentId)
    );
    if (!documentExists) {
      console.error('Document not found', { documentId, tenantId: selectedTenantId });
      throw new Response("Document not found", { status: 404 });
    }
    try {
      const pdfBuffer = await generatePdfFromHtml(htmlContent);
      console.log('PDF generated with Puppeteer, buffer size:', pdfBuffer.length);
      await savePdf(selectedTenantId, documentId, pdfBuffer, {
        format: 'a4',
        orientation: 'portrait',
        quality: 0.98,
        scale: 2,
        margin: [15, 15],
      });
      const downloadUrl = `/storage/pdfs/${selectedTenantId}/${documentId}.pdf`;
      console.log('PDF saved successfully', { downloadUrl });
      return json({ success: true, downloadUrl });
    } catch (error) {
      console.error('Error generating/saving PDF with Puppeteer:', error);
      if (error instanceof Error) {
        console.error('Error details:', { name: error.name, message: error.message, stack: error.stack });
      }
      throw new Response("Failed to save PDF", { status: 500 });
    }
  }

  if (intent === "generatePdf") {
    console.log('Processing PDF generation request for preview', { documentId: params.documentId });
    const htmlContent = formData.get("htmlContent") as string;
    const selectedTenantId = formData.get("selectedTenantId") as string;
    const documentId = params.documentId as string;
    if (!htmlContent || !selectedTenantId || !documentId) {
      console.error('Missing required data:', {
        hasHtmlContent: !!htmlContent,
        hasSelectedTenantId: !!selectedTenantId,
        hasDocumentId: !!documentId,
      });
      throw new Response("Missing required data", { status: 400 });
    }
    const session = await getSession(request.headers.get("Cookie"));
    const sessionTenantId = session.get("tenantId");
    if (sessionTenantId !== selectedTenantId) {
      console.error('Unauthorized tenant access', { sessionTenantId, requestedTenantId: selectedTenantId });
      throw new Response("Unauthorized tenant access", { status: 403 });
    }
    const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);
    if (!selectedTenant) {
      console.error('Tenant not found', { selectedTenantId });
      throw new Response("Tenant not found", { status: 404 });
    }
    const documentExists = selectedTenant.cases.some(caseItem =>
      caseItem.documents.some(doc => doc.documentId === documentId)
    );
    if (!documentExists) {
      console.error('Document not found', { documentId, tenantId: selectedTenantId });
      throw new Response("Document not found", { status: 404 });
    }
    try {
      const pdfBuffer = await generatePdfFromHtml(htmlContent);
      const base64Pdf = pdfBuffer.toString('base64');
      const previewUrl = `data:application/pdf;base64,${base64Pdf}`;
      await savePdf(selectedTenantId, documentId, pdfBuffer, {
        format: 'a4',
        orientation: 'portrait',
        quality: 0.98,
        scale: 2,
        margin: [15, 15],
      });
      return json({
        success: true,
        previewUrl,
        downloadUrl: `/storage/pdfs/${selectedTenantId}/${documentId}.pdf`,
      });
    } catch (error) {
      console.error('Error generating PDF with Puppeteer:', error);
      if (error instanceof Error) {
        console.error('Error details:', { name: error.name, message: error.message, stack: error.stack });
      }
      throw new Response("Failed to generate PDF", { status: 500 });
    }
  }

  if (intent === "shareForApproval") {
    const approverName = formData.get("approverName") as string;
    const approverEmail = formData.get("approverEmail") as string;
    const approverJobTitle = formData.get("approverJobTitle") as string;
    const selectedTenantId = formData.get("selectedTenantId") as string;
    const documentId = params.documentId as string;
    const pdfUrl = formData.get("pdfUrl") as string;
    if (!approverName || !approverEmail || !approverJobTitle || !selectedTenantId || !documentId || !pdfUrl) {
      console.error('Missing required data:', {
        hasApproverName: !!approverName,
        hasApproverEmail: !!approverEmail,
        hasApproverJobTitle: !!approverJobTitle,
        hasSelectedTenantId: !!selectedTenantId,
        hasDocumentId: !!documentId,
        hasPdfUrl: !!pdfUrl,
      });
      throw new Response("Missing required data", { status: 400 });
    }
    const session = await getSession(request.headers.get("Cookie"));
    const sessionTenantId = session.get("tenantId");
    if (sessionTenantId !== selectedTenantId) {
      console.error('Unauthorized tenant access', { sessionTenantId, requestedTenantId: selectedTenantId });
      throw new Response("Unauthorized tenant access", { status: 403 });
    }
    const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);
    if (!selectedTenant) {
      console.error('Tenant not found', { selectedTenantId });
      throw new Response("Tenant not found", { status: 404 });
    }
    const documentExists = selectedTenant.cases.some(caseItem =>
      caseItem.documents.some(doc => doc.documentId === documentId)
    );
    if (!documentExists) {
      console.error('Document not found', { documentId, tenantId: selectedTenantId });
      throw new Response("Document not found", { status: 404 });
    }
    try {
      console.log('Processing approval request:', {
        documentId,
        tenantId: selectedTenantId,
        approverName,
        approverEmail,
        approverJobTitle,
        pdfUrl,
      });
      return json({ success: true, message: 'Document sent for approval' });
    } catch (error) {
      console.error('Error processing approval request:', error);
      if (error instanceof Error) {
        console.error('Error details:', { name: error.name, message: error.message, stack: error.stack });
      }
      throw new Response("Failed to process approval request", { status: 500 });
    }
  }

  return null;
};

const Select: FC<PropsWithChildren<{}>> = ({ children }) => (
  <div className="inline-flex">
    <ECASelect size="small" className="!label-sm-mid !text-neutral-detail-boldest py-px">
      {children}
    </ECASelect>
  </div>
);

const getStatusIconColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'draft':
      return 'text-visualisation-1-main';
    case 'pending approval':
      return 'text-visualisation-5-main';
    case 'approved':
      return 'text-visualisation-3-main';
    case 'rejected':
      return 'text-visualisation-4-main';
    default:
      return 'text-visualisation-1-main';
  }
};

const CaseDocument: FC = () => {
  const { document, selectedTenantId, baseUrl } = useLoaderData<typeof loader>();
  const { selectedTenant, systemVariables } = useOutletContext<ContextType>();
  const actionData = useActionData<{ success: boolean; downloadUrl: string; previewUrl: string }>();
  const fetcher = useFetcher();
  const submit = useSubmit();
  const template = selectedTenant.templates.find(t => t.templateId === document.templateId);
  const templateVersion = template?.versions.find(v => v.versionNumber === document.documentVersion);
  const documentRef = useRef<HTMLDivElement>(null);
  const [isPreview, setIsPreview] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showApproverModal, setShowApproverModal] = useState(false);
  const [approverName, setApproverName] = useState('David Reynolds');
  const [approverEmail, setApproverEmail] = useState('david.reynolds@example.com');
  const [approverJobTitle, setApproverJobTitle] = useState('Global Mobility Manager');
  const [editorContent, setEditorContent] = useState(() => {
    if (document.documentContent) return document.documentContent;
    if (templateVersion?.content) return templateVersion.content;
    return '';
  });
  const [activeToolGroup, setActiveToolGroup] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [previewPdfBlob, setPreviewPdfBlob] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showConfigMessage, setShowConfigMessage] = useState(false);

  const getPreviewContent = (): string => {
    const content = editor ? editor.getHTML() : editorContent;
    const allVariables = [
      ...systemVariables,
      ...selectedTenant.variables
    ];
    const previewData = document.case?.caseData || {};

    // Replace all variables with their values
    let previewContent = content;
    allVariables.forEach(variable => {
      const value = previewData[variable.variableName] || `{{${variable.variableName}}}`;
      const regex = new RegExp(`\\{\\{${variable.variableName}\\}\\}`, 'g');
      previewContent = previewContent.replace(regex, value);
    });

    return previewContent;
  };

  const getFinalHtml = (): string => {
    // Always use preview content for PDFs
    const content = getPreviewContent();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <base href="${baseUrl}/public" />
          <style>
            @font-face {
              font-family: 'Manrope';
              src: url('${baseUrl}/public/fonts/Manrope-Regular.woff2') format('woff2'),
                   url('${baseUrl}/public/fonts/Manrope-Regular.woff') format('woff');
              font-weight: normal;
              font-style: normal;
            }
            body {
              font-family: 'Manrope', sans-serif;
              margin: 0;
              padding: 0;
            }
            .logo-container {
              margin-left: -15mm;
              margin-right: -15mm;
              padding-left: 15mm;
              padding-right: 15mm;
              margin-bottom: 2rem;
            }
            .logo {
              height: 40px;
              width: auto;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div style="padding: 40px;">
            <div class="logo-container">
              <img src="${baseUrl}/public/prototype/ageas-logo.svg" alt="DNV Logo" class="logo" />
            </div>
            ${content}
          </div>
        </body>
      </html>
    `;
  };

  // (Optional helper for client-side preview; not used by Puppeteer.)
  const buildPdfContentForPreview = (): HTMLElement => {
    const container = window.document.createElement('div');
    container.style.width = '793px';
    container.style.height = '1123px';
    container.style.backgroundColor = 'white';
    container.style.boxSizing = 'border-box';
    container.style.padding = '57px';
    const header = window.document.createElement('div');
    header.style.marginBottom = '20px';
    header.innerHTML = `
      <div style="width:48px; height:48px;">
        <img src="${baseUrl}/public/prototype/ageas-logo.svg" alt="Assignment Letter Logo" style="width:100%; height:100%;" />
      </div>
    `;
    container.appendChild(header);
    const contentElem = window.document.createElement('div');
    contentElem.innerHTML = getFinalHtml();
    container.appendChild(contentElem);
    console.log('Preview PDF Container dimensions:', container.getBoundingClientRect());
    return container;
  };

  React.useEffect(() => {
    console.log('Document data:', {
      documentId: document.documentId,
      hasTemplate: !!template,
      hasCaseData: !!document.case?.caseData,
      systemVarsCount: systemVariables.length,
      tenantVarsCount: selectedTenant.variables.length,
      isPreview,
      templateContent: template?.templateContent,
      editorContent,
    });
  }, [document, template, systemVariables, selectedTenant.variables, isPreview, editorContent]);

  React.useEffect(() => {
    if (actionData?.success && actionData.downloadUrl) {
      console.log('PDF saved successfully, initiating download', { url: actionData.downloadUrl });
      const link = window.document.createElement('a');
      link.href = actionData.downloadUrl;
      link.download = `${document.documentName}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  }, [actionData, document.documentName]);

  // Download handler – sends HTML (with inline CSS) to action with intent "savePdf"
  const handleDownload = async () => {
    setIsDownloading(true);
    console.log('Download initiated', { documentId: document.documentId, tenantId: selectedTenantId });
    const htmlContent = getFinalHtml();
    const formData = new FormData();
    formData.append('intent', 'savePdf');
    formData.append('htmlContent', htmlContent);
    formData.append('selectedTenantId', selectedTenantId);
    formData.append('documentId', document.documentId);
    submit(formData, { method: 'post', replace: true });
  };

  // Share handler – uses fetcher to call intent "generatePdf" and then shows preview modal.
  const handleShare = async () => {
    setIsSharing(true);
    console.log('Share initiated', { documentId: document.documentId, tenantId: selectedTenantId });
    const htmlContent = getFinalHtml();
    const formData = new FormData();
    formData.append('intent', 'generatePdf');
    formData.append('htmlContent', htmlContent);
    formData.append('selectedTenantId', selectedTenantId);
    formData.append('documentId', document.documentId);
    fetcher.submit(formData, { method: 'post' });
  };

  React.useEffect(() => {
    if (actionData?.success) {
      setIsDownloading(false);
    }
  }, [actionData]);

  React.useEffect(() => {
    const data = fetcher.data as { success: boolean; previewUrl: string } | undefined;
    if (data?.success) {
      setIsSharing(false);
      setShowShareModal(true);
      setPreviewPdfBlob(data.previewUrl);
    }
  }, [fetcher.data]);

  const handleSendForSigning = () => {
    if (!previewPdfBlob) {
      console.error('No PDF preview available');
      alert('Please wait for the PDF preview to load before sending for approval.');
      return;
    }
    setShowShareModal(false);
    setShowApproverModal(true);
  };

  const handleSubmitApprover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewPdfBlob) {
      alert('PDF preview is not available. Please try again.');
      return;
    }
    const form = e.target as HTMLFormElement;
    form.insertAdjacentHTML('afterbegin', '<p>Please configure your DocuSign integration in your tenant settings to enable document approval workflow.</p>');
  };

  return (
    <div className="flex h-full flex-col bg-neutral-layer-1">
      <div className="@container/case-document text-neutral-body flex flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-controls-lines-paler bg-neutral-layer-1 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="text-neutral-detail-boldest heading-md-mid">{document.documentName}</div>
            <div className="text-neutral-detail label-sm-mid">Version: <span className="text-neutral-detail-boldest">{document.documentVersion}</span></div>
            <div className="text-neutral-detail label-sm-mid flex items-center gap-2">
              Status: <span className="text-neutral-detail-boldest flex items-center gap-2">
                <i className={`fi fi-ss-circle ${getStatusIconColor(document.documentStatus)} flex`}></i>
                {document.documentStatus}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-1 items-center justify-center">
              {[
                { name: 'edit', label: 'Edit', icon: 'fi-rr-pencil', active: !isPreview },
                { name: 'preview', label: 'Preview', icon: 'fi-rr-eye', active: isPreview },
              ].map(({ name, label, icon, active }) => (
                <Button
                  key={name}
                  name={name}
                  variant="ghost"
                  className={`flex items-center gap-2 ${active ? 'bg-secondary-palest' : ''}`}
                  onClick={() => {
                    setIsPreview(name === 'preview');
                    setActiveToolGroup(null);
                  }}
                >
                  <i className={`fi ${icon} flex`} />
                  <span className="label-sm-mid !leading-[1.125rem]">{label}</span>
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border border-neutral-detail-boldest"
                onClick={handleDownload}
                disabled={isDownloading}
                title="Download as PDF"
                name="download"
              >
                <i className="fi fi-rr-download text-lg mr-2" />
                {isDownloading ? (
                  <>
                    <div className="mr-2">
                      <Progress />
                    </div>
                    Downloading...
                  </>
                ) : (
                  'Download'
                )}
              </Button>
              <Button
                variant="primary"
                className="border border-neutral-detail-boldest"
                onClick={handleShare}
                disabled={isSharing}
                title="Share for approval"
                name="share"
              >
                <i className="fi fi-rr-check text-lg mr-2" />
                {isSharing ? (
                  <>
                    <div className="mr-2">
                      <Progress />
                    </div>
                    Preparing...
                  </>
                ) : (
                  'Approve'
                )}
              </Button>
            </div>
          </div>
        </header>
        {(isDownloading || isSharing) && (
          <div className="h-0.5 bg-neutral-layer-2">
            <Progress className="w-full" />
          </div>
        )}
        <div className="flex flex-1">
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-[816px] px-8 py-6">
              <div className="border-controls-lines-paler flex flex-col gap-6 border-b py-4">
                <div className="bg-neutral-layer-2 eca-dark:bg-neutral-layer-3 border-controls-lines-paler eca-dark:border-controls-lines me-3 flex flex-col gap-6 border p-10">
                  <div className="h-32 w-32">
                    <img src="/prototype/ageas-logo.svg" alt="Document Logo" className="h-full w-full" />
                  </div>
                  <div className="prose max-w-none [&_*]:text-neutral-content-default dark:[&_strong]:text-neutral-content-default">
                    <CaseDocumentEditor
                      content={editorContent}
                      isPreview={isPreview}
                      variables={{
                        caseData: document.case?.caseData || {},
                        systemVariables,
                        tenantVariables: selectedTenant.variables,
                      }}
                      onUpdate={setEditorContent}
                      onEditorReady={setEditor}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-controls-lines-pale border-s h-full">
            <CaseToolPanel
              editor={editor}
              activeGroup={activeToolGroup}
              onGroupClick={(name) => setActiveToolGroup(activeToolGroup === name ? null : name)}
              variables={{
                caseData: document.case.caseData,
                systemVariables,
                tenantVariables: selectedTenant.variables
              }}
              showCaseVariables={true}
            />
          </div>
        </div>
      </div>
      <Transition appear show={showShareModal} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowShareModal(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-neutral-layer-2 relative w-[800px] rounded px-10 py-9">
                  <div className="absolute right-6 top-4">
                    <button
                      type="button"
                      onClick={() => setShowShareModal(false)}
                      className="flex items-center justify-center outline-2 outline-offset-2 outline-default-transparent transition rounded p-0 bg-controls-highlight-palest text-neutral-detail-bold hover:bg-controls-highlight-paler"
                    >
                      <i className={`fi fi-rr-cross text-lg m-2.5 flex items-center justify-center`} />
                    </button>
                  </div>
                  <Dialog.Title className="text-neutral-body heading-md-mid pb-6 pl-1">
                    Review Document
                  </Dialog.Title>
                  <div className="mb-4 h-[600px] overflow-auto">
                    {previewPdfBlob && (
                      <iframe
                        src={previewPdfBlob}
                        className="h-full w-full"
                        title="PDF Preview"
                      />
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      name="cancel"
                      variant="outline"
                      onClick={() => setShowShareModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      name="send"
                      variant="primary"
                      onClick={handleSendForSigning}
                    >
                      Send for Signing
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={showApproverModal} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            setShowApproverModal(false);
            setShowConfigMessage(false);
          }}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-neutral-layer-2 relative w-[600px] rounded px-10 py-9">
                  <div className="absolute right-6 top-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowApproverModal(false);
                        setShowConfigMessage(false);
                      }}
                      className="flex items-center justify-center outline-2 outline-offset-2 outline-default-transparent transition rounded p-0 bg-controls-highlight-palest text-neutral-detail-bold hover:bg-controls-highlight-paler"
                    >
                      <i className="fi fi-rr-cross text-lg m-2.5 flex items-center justify-center" />
                    </button>
                  </div>
                  <Dialog.Title className="text-neutral-body heading-md-mid pb-6 pl-1">
                    Enter Approver Details
                  </Dialog.Title>
                  <form onSubmit={handleSubmitApprover} className="flex flex-col gap-6">
                    {showConfigMessage && <p>Please configure your DocuSign integration in your tenant settings to enable document approval workflow.</p>}
                    <fieldset className="w-full has-[:disabled]:text-controls-content-disabled">
                      <label className="block py-1 text-neutral-body transition-all label-sm-mid">
                        Approver Name
                      </label>
                      <span className="flex rounded-md border p-3 text-controls-placeholder-text outline outline-2 outline-offset-2 outline-default-transparent transition has-[:disabled]:border-neutral-detail-paler hover:outline-neutral-detail-paler border-controls-border focus-within:border-controls-highlight hover:focus-within:outline-controls-highlight focus-within:outline-controls-highlight">
                        <TextInput
                          name="approverName"
                          value={approverName}
                          onChange={(e) => setApproverName(e.target.value)}
                          className="w-full"
                          placeholder="Enter approver's name"
                        />
                      </span>
                    </fieldset>
                    <fieldset className="w-full has-[:disabled]:text-controls-content-disabled">
                      <label className="block py-1 text-neutral-body transition-all label-sm-mid">
                        Approver Email
                      </label>
                      <span className="flex rounded-md border p-3 text-controls-placeholder-text outline outline-2 outline-offset-2 outline-default-transparent transition has-[:disabled]:border-neutral-detail-paler hover:outline-neutral-detail-paler border-controls-border focus-within:border-controls-highlight hover:focus-within:outline-controls-highlight focus-within:outline-controls-highlight">
                        <TextInput
                          name="approverEmail"
                          value={approverEmail}
                          onChange={(e) => setApproverEmail(e.target.value)}
                          className="w-full"
                          placeholder="Enter approver's email"
                          type="email"
                        />
                      </span>
                    </fieldset>
                    <fieldset className="w-full has-[:disabled]:text-controls-content-disabled">
                      <label className="block py-1 text-neutral-body transition-all label-sm-mid">
                        Job Title
                      </label>
                      <span className="flex rounded-md border p-3 text-controls-placeholder-text outline outline-2 outline-offset-2 outline-default-transparent transition has-[:disabled]:border-neutral-detail-paler hover:outline-neutral-detail-paler border-controls-border focus-within:border-controls-highlight hover:focus-within:outline-controls-highlight focus-within:outline-controls-highlight">
                        <TextInput
                          name="approverJobTitle"
                          value={approverJobTitle}
                          onChange={(e) => setApproverJobTitle(e.target.value)}
                          className="w-full"
                          placeholder="Enter approver's job title"
                        />
                      </span>
                    </fieldset>
                    <div className="flex justify-end gap-2">
                      <Button
                        name="cancel"
                        variant="outline"
                        onClick={() => {
                          setShowApproverModal(false);
                          setShowConfigMessage(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        name="submit"
                        variant="primary"
                        type="submit"
                        disabled={!approverName || !approverEmail || !approverJobTitle}
                      >
                        <i className="fi fi-rr-check text-lg mr-2" />
                        Submit
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default CaseDocument;
