import React from 'react';
import type { LoaderFunction, ActionFunction, UploadHandler } from '@remix-run/node';
import { json, unstable_parseMultipartFormData } from '@remix-run/node';
import { useLoaderData, useOutletContext, useSubmit, useNavigation, useRevalidator } from '@remix-run/react';
import DocumentsTable from '~/cases/components/DocumentsTable';
import DocumentsControlBar from '~/cases/components/DocumentsControlBar';
import CaseSelector from '~/cases/components/CaseSelector';
import UploadedFilesTable from '~/components/UploadedFilesTable';
import DeleteConfirmationModal from '~/components/DeleteConfirmationModal';
import FileUpdateModal from '~/components/FileUpdateModal';
import { getSession, commitSession } from '~/utils/session.server';
import { saveUploadedFile, getUploadedFiles, deleteUploadedFile, updateUploadedFile } from '~/utils/fileUpload.server';
import type { Case, Document } from '~/types/template';
import type { UploadedFile } from '~/types/uploadedFile';
import applicationData from '~/data/application-data.json';

type ContextType = {
  selectedTenant: {
    tenantId: string;
    tenantName: string;
    cases: Case[];
  };
  systemVariables: Array<{
    variableId: string;
    variableName: string;
    variableLabel: string;
  }>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
  const selectedTenant = applicationData.tenants.find((t) => t.tenantId === selectedTenantId);

  if (!selectedTenant) {
    throw new Response("Tenant not found", { status: 404 });
  }

  const selectedCaseId = session.get("caseId") || selectedTenant.cases[0]?.caseId;
  const selectedCase = selectedTenant.cases.find((c) => c.caseId === selectedCaseId);

  if (!selectedCase) {
    throw new Response("Case not found", { status: 404 });
  }

  // Get uploaded files for the case
  const uploadedFiles = await getUploadedFiles(selectedTenantId, selectedCaseId);

  return json({
    selectedTenant,
    selectedCase,
    uploadedFiles,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const selectedTenantId = session.get("tenantId") || applicationData.tenants[0].tenantId;
  const selectedCaseId = session.get("caseId");

  // First try to get the intent from the form data
  let formData = await request.clone().formData();
  const intent = formData.get("intent")?.toString();

  // If it's a delete operation, handle it before checking content type
  if (intent === "deleteFile") {
    if (!selectedCaseId) {
      throw new Response("Case ID is required", { status: 400 });
    }

    const fileId = formData.get("fileId");
    if (!fileId || typeof fileId !== "string") {
      throw new Response("File ID is required", { status: 400 });
    }

    try {
      await deleteUploadedFile(selectedTenantId, selectedCaseId, fileId);
      const updatedFiles = await getUploadedFiles(selectedTenantId, selectedCaseId);
      return json({ success: true, uploadedFiles: updatedFiles }, {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Response(error instanceof Error ? error.message : "Error deleting file", { status: 500 });
    }
  }

  // Check content type for multipart form data operations
  const contentType = request.headers.get("Content-Type") || "";
  
  // Handle non-multipart form data (case selection)
  if (!contentType.includes("multipart/form-data")) {
    const caseId = formData.get("caseId");
    
    if (!caseId || typeof caseId !== "string") {
      throw new Response("Case ID is required", { status: 400 });
    }

    // Validate case ID belongs to tenant
    const tenant = applicationData.tenants.find(t => t.tenantId === selectedTenantId);
    if (!tenant || !tenant.cases.some(c => c.caseId === caseId)) {
      throw new Response("Invalid case ID for tenant", { status: 400 });
    }
    
    session.set("caseId", caseId);
    return json({ success: true }, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  const uploadHandler: UploadHandler = async ({ name, contentType, filename, data }) => {
    if (name !== "file") {
      const chunks: Uint8Array[] = [];
      for await (const chunk of data) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      return buffer.toString('utf8');
    }

    if (!filename) {
      return undefined;
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    return new File([Buffer.concat(chunks)], filename, { type: contentType });
  };

  // For multipart form data, parse using unstable_parseMultipartFormData
  formData = await unstable_parseMultipartFormData(request, uploadHandler);

  // Handle file update
  if (intent === "updateFile") {
    const fileId = formData.get("fileId");
    const documentName = formData.get("documentName");
    const documentType = formData.get("documentType");
    const description = formData.get("description");
    const file = formData.get("file");

    if (!fileId || typeof fileId !== "string" || !documentName || typeof documentName !== "string" || !documentType || typeof documentType !== "string") {
      throw new Response("Missing required fields", { status: 400 });
    }

    try {
      await updateUploadedFile(selectedTenantId, selectedCaseId, fileId, {
        documentName,
        documentType,
        description: description?.toString(),
        file: file instanceof File ? file : undefined,
      });

      const updatedFiles = await getUploadedFiles(selectedTenantId, selectedCaseId);
      return json({ success: true, uploadedFiles: updatedFiles }, {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    } catch (error) {
      console.error('Error updating file:', error);
      throw new Response(error instanceof Error ? error.message : "Error updating file", { status: 500 });
    }
  }

  // Handle file upload (new file)
  const documentName = formData.get("documentName");
  const documentType = formData.get("documentType");
  const description = formData.get("description")?.toString();
  const file = formData.get("file");

  if (!documentName || typeof documentName !== "string" || !documentType || typeof documentType !== "string") {
    throw new Response("Missing required fields", { status: 400 });
  }

  try {
    if (!(file instanceof File)) {
      throw new Response("No file uploaded", { status: 400 });
    }

    await saveUploadedFile(selectedTenantId, selectedCaseId, {
      file,
      documentName,
      documentType,
      description,
    });

    const updatedFiles = await getUploadedFiles(selectedTenantId, selectedCaseId);
    return json({ success: true, uploadedFiles: updatedFiles }, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    throw new Response(error instanceof Error ? error.message : "Error processing file upload", { status: 400 });
  }
};

export default function CaseDocumentsIndex() {
  const { selectedTenant, selectedCase, uploadedFiles } = useLoaderData<{ 
    selectedTenant: ContextType['selectedTenant']; 
    selectedCase: Case;
    uploadedFiles: UploadedFile[];
  }>();
  const [documentFilter, setDocumentFilter] = React.useState('');
  const [uploadFilter, setUploadFilter] = React.useState('');
  const submit = useSubmit();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [fileToDelete, setFileToDelete] = React.useState<UploadedFile | null>(null);
  const [fileToUpdate, setFileToUpdate] = React.useState<UploadedFile | null>(null);

  // Transform documents to match DocumentsTable type
  const documents = selectedCase.documents.map(doc => ({
    ...doc,
    caseName: selectedCase.caseName,
    caseId: selectedCase.caseId
  }));

  const handleUpload = async (data: { file: File; documentName: string; documentType: string; description?: string }) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('documentName', data.documentName);
    formData.append('documentType', data.documentType);
    if (data.description) {
      formData.append('description', data.description);
    }
    submit(formData, { method: 'post', encType: 'multipart/form-data' });
  };

  const handleUpdate = async (data: { fileId: string; documentName: string; documentType: string; description?: string; file?: File }) => {
    const formData = new FormData();
    formData.append('intent', 'updateFile');
    formData.append('fileId', data.fileId);
    formData.append('documentName', data.documentName);
    formData.append('documentType', data.documentType);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.file) {
      formData.append('file', data.file);
    }
    submit(formData, { method: 'post', encType: 'multipart/form-data', action: '?' });
    setFileToUpdate(null);
  };

  const handleDelete = async (file: UploadedFile) => {
    setFileToDelete(file);
  };

  const confirmDelete = () => {
    if (!fileToDelete) return;
    
    const formData = new FormData();
    formData.append('intent', 'deleteFile');
    formData.append('fileId', fileToDelete.fileId);
    submit(formData, { method: 'post', encType: 'multipart/form-data', action: '?' });
    setFileToDelete(null);
  };

  // Revalidate data after successful upload, update, or delete
  React.useEffect(() => {
    const formData = navigation.formData as FormData | null;
    if (navigation.state === 'idle' && formData) {
      revalidator.revalidate();
    }
  }, [navigation.state, navigation.formData]);

  return (
    <div className="flex h-full flex-col bg-neutral-layer-1">
      <div className="flex flex-col gap-6 px-8 pb-10 pt-4">
        <div className="flex items-center justify-between">
          <CaseSelector
            selectedCase={selectedCase}
            cases={selectedTenant.cases}
          />
          <DocumentsControlBar setGlobalFilter={setDocumentFilter} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-neutral-detail-boldest heading-md-mid">
              Documents <span className="text-neutral-detail-pale !font-[300]">{selectedCase.documents.length}</span>
            </div>
          </div>
          <DocumentsTable
            documents={documents}
            globalFilter={documentFilter}
            setGlobalFilter={setDocumentFilter}
          />
          <div className="mt-8">
            <UploadedFilesTable
              files={uploadedFiles}
              onUpload={handleUpload}
              onUpdate={(file) => setFileToUpdate(file)}
              onDelete={handleDelete}
              globalFilter={uploadFilter}
            />
          </div>
          <FileUpdateModal
            isOpen={fileToUpdate !== null}
            onClose={() => setFileToUpdate(null)}
            onUpdate={handleUpdate}
            file={fileToUpdate}
          />
          <DeleteConfirmationModal
            isOpen={fileToDelete !== null}
            onClose={() => setFileToDelete(null)}
            onConfirm={confirmDelete}
            title="Delete File"
            message={`Are you sure you want to delete ${fileToDelete?.fileName}? This action cannot be undone.`}
          />
        </div>
      </div>
    </div>
  );
}
