import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadedFile {
  fileId: string;
  fileName: string;
  fileType: string;
  documentName: string;
  documentType: string;
  description: string;
  uploadedOn: string;
  caseId: string;
  tenantId: string;
  fileSize: number;
  contentType: string;
}

interface UploadedFilesData {
  tenants: {
    [tenantId: string]: {
      [caseId: string]: UploadedFile[];
    };
  };
}

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const METADATA_FILE = path.join(process.cwd(), 'src', 'app', 'data', 'uploaded-files.json');

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function readMetadataFile(): Promise<UploadedFilesData> {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { tenants: {} };
  }
}

async function writeMetadataFile(data: UploadedFilesData) {
  await fs.writeFile(METADATA_FILE, JSON.stringify(data, null, 2));
}

export async function saveUploadedFile(
  tenantId: string,
  caseId: string,
  data: {
    file: File;
    documentName: string;
    documentType: string;
    description?: string;
  }
): Promise<UploadedFile> {
  // Generate unique file ID
  const fileId = uuidv4();
  const fileExtension = path.extname(data.file.name).slice(1);

  // Create tenant and case directories if they don't exist
  const tenantDir = path.join(UPLOADS_DIR, tenantId);
  const caseDir = path.join(tenantDir, caseId);
  await ensureDirectoryExists(caseDir);

  // Save file with UUID name
  const fileName = `${fileId}.${fileExtension}`;
  const filePath = path.join(caseDir, fileName);
  const fileBuffer = Buffer.from(await data.file.arrayBuffer());
  await fs.writeFile(filePath, fileBuffer);

  // Create metadata
  const metadata: UploadedFile = {
    fileId,
    fileName: data.file.name,
    fileType: fileExtension.toUpperCase(),
    documentName: data.documentName,
    documentType: data.documentType,
    description: data.description || '',
    uploadedOn: new Date().toISOString(),
    caseId,
    tenantId,
    fileSize: data.file.size,
    contentType: data.file.type,
  };

  // Update metadata file
  const metadataData = await readMetadataFile();
  if (!metadataData.tenants[tenantId]) {
    metadataData.tenants[tenantId] = {};
  }
  if (!metadataData.tenants[tenantId][caseId]) {
    metadataData.tenants[tenantId][caseId] = [];
  }
  metadataData.tenants[tenantId][caseId].push(metadata);
  await writeMetadataFile(metadataData);

  return metadata;
}

export async function getUploadedFiles(tenantId: string, caseId: string): Promise<UploadedFile[]> {
  const data = await readMetadataFile();
  return data.tenants[tenantId]?.[caseId] || [];
}

export async function deleteUploadedFile(tenantId: string, caseId: string, fileId: string): Promise<void> {
  const data = await readMetadataFile();
  const files = data.tenants[tenantId]?.[caseId] || [];
  const fileIndex = files.findIndex(f => f.fileId === fileId);

  if (fileIndex === -1) {
    throw new Error('File not found');
  }

  const file = files[fileIndex];
  const filePath = path.join(UPLOADS_DIR, tenantId, caseId, `${fileId}.${file.fileType.toLowerCase()}`);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  files.splice(fileIndex, 1);
  await writeMetadataFile(data);
}

export async function updateUploadedFile(
  tenantId: string,
  caseId: string,
  fileId: string,
  updates: {
    documentName?: string;
    documentType?: string;
    description?: string;
    file?: File;
  }
): Promise<UploadedFile> {
  const data = await readMetadataFile();
  const files = data.tenants[tenantId]?.[caseId] || [];
  const fileIndex = files.findIndex(f => f.fileId === fileId);

  if (fileIndex === -1) {
    throw new Error('File not found');
  }

  const currentFile = files[fileIndex];

  // If a new file is provided, replace the old one
  if (updates.file) {
    const fileExtension = path.extname(updates.file.name).toLowerCase().slice(1);
    const filePath = path.join(UPLOADS_DIR, tenantId, caseId, `${fileId}.${fileExtension}`);
    
    // Delete old file if it exists
    try {
      const oldFilePath = path.join(UPLOADS_DIR, tenantId, caseId, `${fileId}.${currentFile.fileType.toLowerCase()}`);
      await fs.unlink(oldFilePath).catch(() => {});
    } catch (error) {
      console.error('Error deleting old file:', error);
    }

    // Ensure the directory exists
    await ensureDirectoryExists(path.join(UPLOADS_DIR, tenantId, caseId));

    // Save new file
    const fileBuffer = Buffer.from(await updates.file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Update file metadata
    files[fileIndex] = {
      ...currentFile,
      fileName: updates.file.name,
      fileType: fileExtension.toUpperCase(),
      fileSize: updates.file.size,
      contentType: updates.file.type,
      documentName: updates.documentName || currentFile.documentName,
      documentType: updates.documentType || currentFile.documentType,
      description: updates.description || currentFile.description
    };
  } else {
    // Update only the specified metadata fields
    files[fileIndex] = {
      ...currentFile,
      documentName: updates.documentName || currentFile.documentName,
      documentType: updates.documentType || currentFile.documentType,
      description: updates.description || currentFile.description
    };
  }

  // Ensure the tenant and case structure exists and update metadata
  if (!data.tenants[tenantId]) {
    data.tenants[tenantId] = {};
  }
  if (!data.tenants[tenantId][caseId]) {
    data.tenants[tenantId][caseId] = [];
  }
  data.tenants[tenantId][caseId] = files;

  await writeMetadataFile(data);
  return files[fileIndex];
}
