import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface PDFOptions {
  margin?: [number, number];
  format?: string;
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  scale?: number;
}

export async function savePdf(
  tenantId: string, 
  documentId: string, 
  pdfBlob: Buffer,
  options: PDFOptions = {}
): Promise<string> {
  console.log('Starting PDF save operation', {
    tenantId,
    documentId,
    bufferSize: pdfBlob.length,
    options
  });

  // Ensure tenant isolation by using tenant-specific directories
  const pdfDir = join(process.cwd(), 'storage', 'pdfs', tenantId);
  const pdfPath = join(pdfDir, `${documentId}.pdf`);
  
  console.log('PDF paths configured', {
    pdfDir,
    pdfPath
  });

  try {
    // Create tenant-specific directory if it doesn't exist
    console.log('Creating PDF directory if needed:', pdfDir);
    await mkdir(pdfDir, { recursive: true });
    
    // Save PDF with versioning
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionedPath = join(pdfDir, `${documentId}_${timestamp}.pdf`);
    
    console.log('Saving PDF files', {
      currentPath: pdfPath,
      versionedPath
    });

    // Save both current and versioned copies
    await Promise.all([
      writeFile(pdfPath, pdfBlob),
      writeFile(versionedPath, pdfBlob)
    ]);

    console.log('PDF files saved successfully');
    return pdfPath;
  } catch (error) {
    console.error('Error saving PDF:', {
      error,
      tenantId,
      documentId,
      pdfDir,
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : 'Unknown error type'
    });
    throw new Error(`Failed to save PDF for tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
