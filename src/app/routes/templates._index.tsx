import React from 'react';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useOutletContext, useNavigate } from '@remix-run/react';
import { Button, Select, TextInput } from '@ecainternational/eca-components';
import { getSession } from '~/utils/session.server';
import applicationData from '~/data/application-data.json';

type Template = {
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

type ContextType = {
  selectedTenant: {
    tenantId: string;
    tenantName: string;
    templates: Template[];
    policies: Array<{
      policyId: string;
      policyName: string;
      policyType: string;
    }>;
  };
};

type LoaderData = {
  selectedTenant: ContextType['selectedTenant'];
  templates: Template[];
};

export const loader: LoaderFunction = async ({ request }: { request: Request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
  const selectedTenant = applicationData.tenants.find((t: { tenantId: string }) => t.tenantId === selectedTenantId);

  if (!selectedTenant) {
    throw new Response("Tenant not found", { status: 404 });
  }

  // Map templates to include policy types from policies
  const templatesWithMetadata = selectedTenant.templates.map(template => ({
    ...template,
    policyType: template.policyType
  }));

  return json({
    selectedTenant: {
      ...selectedTenant,
      templates: templatesWithMetadata,
      policies: selectedTenant.policies
    },
    templates: templatesWithMetadata
  });
};

export const action: ActionFunction = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    // Create a new template with default values
    const templateId = `template_${Date.now()}`;
    const newTemplate: Template = {
      templateId,
      templateName: "New Template",
      policyType: "General",
      currentVersion: "v1.0",
      versions: [{
        versionId: crypto.randomUUID(),
        versionNumber: "v1.0",
        content: "",
        createdAt: new Date().toISOString(),
        changeType: "major",
        changeDescription: "Initial version",
        linkedDocuments: []
      }],
      lastModified: new Date().toISOString()
    };

    // Return the new template ID for redirect
    return json({ templateId });
  }

  return null;
};

export default function TemplatesIndex() {
  const { selectedTenant, templates } = useLoaderData<LoaderData>();
  const [selectedPolicy, setSelectedPolicy] = React.useState<string>('all');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const navigate = useNavigate();

  // Get unique policy types
  const policyTypes = React.useMemo(() => {
    const types = new Set(templates.map((template: Template) => template.policyType));
    return ['all', ...Array.from(types)];
  }, [templates]);

  // Filter templates by policy and search term
  const filteredTemplates = React.useMemo(() => {
    return templates.filter((template: Template) => {
      const matchesPolicy = selectedPolicy === 'all' || template.policyType === selectedPolicy;
      const matchesSearch = !globalFilter || 
        template.templateName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        template.policyType.toLowerCase().includes(globalFilter.toLowerCase());
      return matchesPolicy && matchesSearch;
    });
  }, [templates, selectedPolicy, globalFilter]);

  const handleNewTemplate = async () => {
    const formData = new FormData();
    formData.append("intent", "create");
    
    try {
      const response = await fetch("/templates", {
        method: "POST",
        body: formData
      });
      
      const result = await response.json();
      if (result.templateId) {
        navigate(`/templates/${result.templateId}`);
      }
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/templates/${templateId}`);
  };

  return (
    <div className="flex h-full flex-col bg-neutral-layer-1">
      <div className="flex flex-col gap-6 px-8 pb-10 pt-4">
        {/* Header */}
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-neutral-detail-boldest heading-md-mid">
              Templates <span className="text-neutral-detail-pale !font-[300]">{templates.length}</span>
            </div>

          </div>
          <Button
            name="new-template"
            variant="primary"
            onClick={handleNewTemplate}
          >
            + New Template
          </Button>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between gap-4 bg-neutral-layer-2 px-6 py-4 rounded-lg">
          <div className="flex items-center gap-4">
            <i className="fi fi-rr-filter text-xl m-3 flex items-center justify-center"></i>
            <div className="w-48">
              <Select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="!text-neutral-detail-boldest !w-full"
              >
                {policyTypes.map((policy: string) => (
                  <option key={policy} value={policy}>
                    {policy === 'all' ? 'All Policies' : policy}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TextInput
              name="search"
              type="text"
              placeholder="Search templates..."
              onChange={(e) => setGlobalFilter(e.target.value)}
              variant="tonal"
              icon="fi-rr-search"
              className="w-[300px]"
            />
          </div>
        </div>

        {/* Templates Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-controls-lines-paler bg-neutral-layer-2 text-neutral-detail-bolder border-y text-left">
                  <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Name</th>
                  <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Policy</th>
                  <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Last Modified</th>
                  <th className="label-sm-heavier whitespace-nowrap px-4 py-3">Version</th>
                  <th className="label-sm-heavier whitespace-nowrap px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template: Template) => (
                  <tr 
                    key={template.templateId}
                    className="border-controls-lines-paler hover:bg-neutral-layer-2 border-b transition-colors"
                    onClick={() => handleEditTemplate(template.templateId)}
                  >
                    <td className="px-4 py-3 paragraph-sm-mid text-neutral-detail-boldest">
                      {template.templateName}
                    </td>
                    <td className="px-4 py-3 paragraph-sm-mid text-neutral-detail">
                      {template.policyType}
                    </td>
                    <td className="px-4 py-3 paragraph-sm-mid text-neutral-detail">
                      {new Date(template.lastModified).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 paragraph-sm-mid text-neutral-detail">
                      {template.currentVersion}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        name="edit"
                        variant="outline"
                        className="flex items-center justify-center p-0 text-neutral-detail-bold hover:bg-controls-highlight-palest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-detail-bold focus-visible:bg-controls-highlight-palest active:bg-controls-highlight-paler active:text-neutral-detail-bolder disabled:bg-neutral-layer-1 disabled:text-neutral-detail-paler disabled:cursor-not-allowed border-neutral-detail-bold min-w-[20px] min-h-[20px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template.templateId);
                        }}
                        aria-label={`Edit ${template.templateName}`}
                      >
                        <i className="fi fi-rr-pencil text-xs m-0.5 flex items-center justify-center" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
