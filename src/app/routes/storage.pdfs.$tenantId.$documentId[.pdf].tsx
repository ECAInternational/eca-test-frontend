import { LoaderFunction } from '@remix-run/node';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSession } from '~/utils/session.server';
import applicationData from '~/data/application-data.json';

export const loader: LoaderFunction = async ({ params, request }) => {
  console.log('PDF download requested', { params });
  
  const { tenantId, documentId } = params;
  if (!tenantId || !documentId) {
    console.error('Missing required parameters', { tenantId, documentId });
    throw new Response('Missing required parameters', { status: 400 });
  }

  // Validate tenant access
  const session = await getSession(request.headers.get('Cookie'));
  const sessionTenantId = session.get('tenantId');
  
  console.log('Validating tenant access', { sessionTenantId, requestedTenantId: tenantId });
  
  if (sessionTenantId !== tenantId) {
    console.error('Unauthorized tenant access', { sessionTenantId, requestedTenantId: tenantId });
    throw new Response('Unauthorized tenant access', { status: 403 });
  }

  // Validate document exists
  const selectedTenant = applicationData.tenants.find(t => t.tenantId === tenantId);
  if (!selectedTenant) {
    console.error('Tenant not found', { tenantId });
    throw new Response('Tenant not found', { status: 404 });
  }

  const documentExists = selectedTenant.cases.some(caseItem => 
    caseItem.documents.some(doc => doc.documentId === documentId.replace('.pdf', ''))
  );

  if (!documentExists) {
    console.error('Document not found', { documentId, tenantId });
    throw new Response('Document not found', { status: 404 });
  }

  // Get the PDF file
  const pdfPath = join(process.cwd(), 'storage', 'pdfs', tenantId, `${documentId}`);
  
  try {
    console.log('Reading PDF file', { pdfPath });
    const pdfBuffer = await readFile(pdfPath);
    console.log('PDF file read successfully', { size: pdfBuffer.length });

    // Get document name for the Content-Disposition header
    const document = selectedTenant.cases
      .flatMap(c => c.documents)
      .find(d => d.documentId === documentId.replace('.pdf', ''));
    
    const fileName = document ? document.documentName : documentId;

    // Return PDF with proper headers
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'same-origin',
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error reading PDF file:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Response('PDF file not found', { status: 404 });
  }
};
