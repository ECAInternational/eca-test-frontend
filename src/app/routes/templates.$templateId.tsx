import React, { Fragment, useRef, useState } from 'react';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useOutletContext, useNavigate } from '@remix-run/react';
import { Button, IconButton, Select as ECASelect, TextInput } from '@ecainternational/eca-components';
import { Dialog, Transition } from '@headlessui/react';
import type { Editor } from '@tiptap/core';
import { getSession } from '~/utils/session.server';
import applicationData from '~/data/application-data.json';
import DocumentEditor from '~/components/DocumentEditor';
import CaseToolPanel from '~/components/CaseToolPanel';
import type { Template, TemplateVersion, Tenant, Document } from '~/types/template';
import { incrementVersion, getTemplateStats } from '~/types/template';
import { handleTemplateUpdate, type UpdateResult } from '~/utils/template-updates';

type ContextType = {
  selectedTenant: Tenant;
  systemVariables: Array<{
    variableId: string;
    variableName: string;
    variableLabel: string;
  }>;
};

type LoaderData = {
  template: Template;
  selectedTenantId: string;
  documentCount: number;
  versionUsage: Record<string, string[]>;
};

// Helper type for the raw template data in application-data.json
type RawTemplate = {
  templateId: string;
  templateName: string;
  policyType: string;
  currentVersion: string;
  versions: Array<{
    versionId: string;
    versionNumber: string;
    content: string;
    createdAt: string;
    changeType: 'major' | 'minor';
    changeDescription: string;
    linkedDocuments: string[];
  }>;
  lastModified: string;
};

export const loader: LoaderFunction = async ({ params, request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
  
  const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);

  if (!selectedTenant) {
    throw new Response("Tenant not found", { status: 404 });
  }

  // Find the template in the tenant's templates array
  const template = selectedTenant.templates?.find(t => t.templateId === params.templateId) as RawTemplate;

  if (!template) {
    throw new Response("Template not found", { status: 404 });
  }

  // Get template usage statistics
  const { documentCount, versionUsage } = getTemplateStats(selectedTenant as unknown as Tenant, template.templateId);

  return json({
    template,
    selectedTenantId,
    documentCount,
    versionUsage
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const templateContent = formData.get("content") as string;
  const changeType = formData.get("changeType") as 'major' | 'minor';
  const changeDescription = formData.get("changeDescription") as string;
  const currentVersion = formData.get("currentVersion") as string;
  const affectedDocuments = formData.get("affectedDocuments") as string;
  const autoApplyMinor = formData.get("autoApplyMinor") === "true";
  const forceUpdate = formData.get("forceUpdate") === "true";
  const duplicateName = formData.get("duplicateName") as string;

  if (intent === "save" && 
      typeof templateContent === "string" && 
      typeof changeType === "string" && 
      typeof changeDescription === "string" &&
      typeof currentVersion === "string") {
    
    const session = await getSession(request.headers.get("Cookie"));
    const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
    const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId) as unknown as Tenant;

    if (!selectedTenant) {
      throw new Response("Tenant not found", { status: 404 });
    }

    const template = selectedTenant.templates.find(t => t.templateId === params.templateId) as Template;
    if (!template) {
      throw new Response("Template not found", { status: 404 });
    }

    const currentVersionData = template.versions.find(v => v.versionNumber === currentVersion);
    if (!currentVersionData) {
      throw new Response("Version not found", { status: 404 });
    }

    const affectedDocsList = affectedDocuments ? JSON.parse(affectedDocuments) as string[] : [];
    
    // Find all affected documents
    const documents: Document[] = [];
    selectedTenant.cases.forEach(caseItem => {
      caseItem.documents.forEach(doc => {
        if (affectedDocsList.includes(doc.documentId)) {
          documents.push(doc);
        }
      });
    });

    // Handle template update
    const updateResult = await handleTemplateUpdate(
      template,
      {
        type: changeType,
        oldContent: currentVersionData.content,
        newContent: templateContent,
        description: changeDescription
      },
      documents,
      {
        autoApplyMinor,
        forceUpdate
      }
    );

    const newVersion = incrementVersion(currentVersion, changeType);
    
    // Create new version
    const newVersionData = {
      versionId: crypto.randomUUID(),
      versionNumber: newVersion,
      content: templateContent,
      createdAt: new Date().toISOString(),
      changeType,
      changeDescription,
      linkedDocuments: documents.map(d => d.documentId)
    };

    // Update template with new version
    template.versions.push(newVersionData);
    template.currentVersion = newVersion;
    template.lastModified = new Date().toISOString();
    
    return json({ 
      success: true,
      newVersion,
      timestamp: new Date().toISOString(),
      updateResult
    });
  }

  if (intent === "duplicate" && typeof duplicateName === "string") {
    const session = await getSession(request.headers.get("Cookie"));
    const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
    const selectedTenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);

    if (!selectedTenant) {
      throw new Response("Tenant not found", { status: 404 });
    }

    const sourceTemplate = (selectedTenant as unknown as Tenant).templates.find(t => t.templateId === params.templateId) as Template;
    if (!sourceTemplate) {
      throw new Response("Template not found", { status: 404 });
    }

    const latestVersion = sourceTemplate.versions[sourceTemplate.versions.length - 1];

    // Create a new template based on the current one
    const newTemplate: Template = {
      templateId: crypto.randomUUID(),
      templateName: duplicateName,
      policyType: sourceTemplate.policyType,
      currentVersion: "v1.0",
      versions: [{
        versionId: crypto.randomUUID(),
        versionNumber: "v1.0",
        content: latestVersion.content,
        createdAt: new Date().toISOString(),
        changeType: "major",
        changeDescription: "Initial version (duplicated from " + sourceTemplate.templateName + ")",
        linkedDocuments: []
      }],
      lastModified: new Date().toISOString()
    };

    // Here we would save the new template to the database
    return json({ 
      success: true,
      newTemplateId: newTemplate.templateId
    });
  }

  return null;
};

export default function TemplateEditor() {
  const { template, selectedTenantId, documentCount, versionUsage } = useLoaderData<LoaderData>();
  const { selectedTenant, systemVariables } = useOutletContext<ContextType>();
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const [activeToolGroup, setActiveToolGroup] = React.useState<string | null>(null);
  const [isPreview, setIsPreview] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState(template.versions[template.versions.length - 1].content);
  const [showVersionDialog, setShowVersionDialog] = React.useState(false);
  const [changeType, setChangeType] = React.useState<'major' | 'minor'>('minor');
  const [changeDescription, setChangeDescription] = React.useState('');
  const [autoApplyMinor, setAutoApplyMinor] = React.useState(true);
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false);
  const [duplicateName, setDuplicateName] = React.useState('');
  const navigate = useNavigate();

  // Sample data for preview mode
  const sampleData = {
    employee_name: 'John Smith',
    assignment_location: 'Singapore',
    start_date: '2025-04-01',
    manager_name: 'Sarah Johnson',
    position_title: 'Senior Software Engineer',
    base_salary: 'USD 120,000',
    benefits_list: '- Health Insurance\n- Housing Allowance\n- Education Support',
    hr_representative: 'Jane Wilson',
    company_name: 'Acme Corporation',
    tax_terms: '- Home Country Tax Liability\n- Host Country Tax Protection\n- Tax Return Support',
    effective_date: '2025-04-01',
    work_location: 'Home Office',
    work_schedule: 'Monday-Friday, 9am-5pm',
    equipment_list: '- Laptop\n- Monitor\n- Keyboard\n- Mouse'
  };

  const handleSave = async () => {
    if (!editorContent) return;

    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("content", editorContent);
    formData.append("changeType", changeType);
    formData.append("changeDescription", changeDescription);
    formData.append("currentVersion", template.currentVersion);
    formData.append("autoApplyMinor", String(autoApplyMinor));

    // Get affected documents for this version
    const affectedDocs = versionUsage[template.currentVersion] || [];
    formData.append("affectedDocuments", JSON.stringify(affectedDocs));

    try {
      const response = await fetch(`/templates/${template.templateId}`, {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        // Handle successful save
        setShowVersionDialog(false);
        setChangeDescription('');
        // Optionally refresh the page to show new version
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateName) return;

    const formData = new FormData();
    formData.append("intent", "duplicate");
    formData.append("duplicateName", duplicateName);

    try {
      const response = await fetch(`/templates/${template.templateId}`, {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setShowDuplicateDialog(false);
        setDuplicateName('');
        navigate(`/templates/${result.newTemplateId}`);
      }
    } catch (error) {
      console.error("Failed to duplicate template:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-neutral-layer-1">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-controls-lines-paler bg-neutral-layer-1 px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="text-neutral-detail-boldest heading-md-mid">
            {template.templateName}
          </div>
          <div className="text-neutral-detail label-sm-mid">
            Version: <span className="text-neutral-detail-boldest">{template.currentVersion}</span>
          </div>
          <div className="text-neutral-detail label-sm-mid">
            Documents: <span className="text-neutral-detail-boldest">{documentCount}</span>
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
                  console.log(`Switching to ${name} mode`);
                  setIsPreview(name === 'preview');
                  // Close tool group when switching modes
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
              name="save"
              variant="primary"
              onClick={() => setShowVersionDialog(true)}
            >
              Save Changes
            </Button>
            <Button
              name="duplicate"
              variant="outline"
              onClick={() => setShowDuplicateDialog(true)}
            >
              Duplicate
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Editor Area */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[816px] px-8 py-6">
            {isPreview && (
              <div className="mb-4 flex items-center gap-2 rounded bg-secondary-palest px-3 py-2 text-secondary-dark">
                <i className="fi fi-rr-eye text-lg" />
                <span className="label-sm-mid">Sample Data Preview</span>
              </div>
            )}
            <div className="flex flex-col gap-6 py-4">
              <div className={`prose max-w-none ${isPreview ? 'preview-mode' : 'edit-mode'}`}>
                <DocumentEditor
                  content={editorContent}
                  isPreview={isPreview}
                  variables={{
                    systemVariables,
                    tenantVariables: selectedTenant.variables,
                    previewData: isPreview ? sampleData : undefined
                  }}
                  onUpdate={setEditorContent}
                  onEditorReady={setEditor}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tool Panel */}
        <div className="border-controls-lines-pale border-s h-full">
          <CaseToolPanel
            editor={editor}
            activeGroup={activeToolGroup}
            onGroupClick={(name) => setActiveToolGroup(activeToolGroup === name ? null : name)}
            variables={{
              caseData: {},
              systemVariables,
              tenantVariables: selectedTenant.variables
            }}
            showCaseVariables={false}
          />
        </div>
      </div>

      {/* Dialogs */}
      <Transition appear show={showVersionDialog} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowVersionDialog(false)}
        >
          <Transition.Child
            as={Fragment}
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
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-neutral-layer-2 relative w-[500px] rounded px-10 py-9">
                  <div className="absolute right-6 top-4">
                    <button
                      type="button"
                      onClick={() => setShowVersionDialog(false)}
                      className="flex items-center justify-center outline-2 outline-offset-2 outline-default-transparent transition rounded p-0 bg-controls-highlight-palest text-neutral-detail-bold hover:bg-controls-highlight-paler"
                    >
                      <i className="fi fi-rr-cross text-lg m-2.5 flex items-center justify-center" />
                    </button>
                  </div>
                  <Dialog.Title className="text-neutral-body heading-md-mid pb-6 pl-1">
                    Save Changes
                  </Dialog.Title>
                  <div className="mb-4">
                    <label className="block py-1 text-neutral-body transition-all label-sm-mid">Change Type</label>
                    <ECASelect
                      value={changeType}
                      onChange={(e) => setChangeType(e.target.value as 'major' | 'minor')}
                      className="w-full"
                    >
                      <option value="minor">Minor Change</option>
                      <option value="major">Major Change</option>
                    </ECASelect>
                  </div>
                  <div className="mb-4">
                    <label className="block py-1 text-neutral-body transition-all label-sm-mid">Description</label>
                    <textarea
                      value={changeDescription}
                      onChange={(e) => setChangeDescription(e.target.value)}
                      className="w-full rounded-md border border-controls-lines p-2"
                      rows={3}
                    />
                  </div>
                  {changeType === 'minor' && (
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={autoApplyMinor}
                          onChange={(e) => setAutoApplyMinor(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Auto-apply to existing documents</span>
                      </label>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      name="cancel"
                      variant="outline"
                      onClick={() => setShowVersionDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      name="save"
                      variant="primary"
                      onClick={handleSave}
                      disabled={!changeDescription}
                    >
                      Save
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={showDuplicateDialog} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowDuplicateDialog(false)}
        >
          <Transition.Child
            as={Fragment}
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
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-neutral-layer-2 relative w-[500px] rounded px-10 py-9">
                  <div className="absolute right-6 top-4">
                    <button
                      type="button"
                      onClick={() => setShowDuplicateDialog(false)}
                      className="flex items-center justify-center outline-2 outline-offset-2 outline-default-transparent transition rounded p-0 bg-controls-highlight-palest text-neutral-detail-bold hover:bg-controls-highlight-paler"
                    >
                      <i className="fi fi-rr-cross text-lg m-2.5 flex items-center justify-center" />
                    </button>
                  </div>
                  <Dialog.Title className="text-neutral-body heading-md-mid pb-6 pl-1">
                    Duplicate Template
                  </Dialog.Title>
                  <div className="mb-4">
                    <label className="block py-1 text-neutral-body transition-all label-sm-mid">New Template Name</label>
                    <TextInput
                      name="duplicateName"
                      type="text"
                      value={duplicateName}
                      onChange={(e) => setDuplicateName(e.target.value)}
                      className="w-full rounded-md border border-controls-lines p-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      name="cancel"
                      variant="outline"
                      onClick={() => setShowDuplicateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      name="duplicate"
                      variant="primary"
                      onClick={handleDuplicate}
                      disabled={!duplicateName}
                    >
                      Duplicate
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
