import type { LoaderFunction } from '@remix-run/node';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const loader: LoaderFunction = async ({ params }) => {
  const { tenantId, documentId } = params;
  const pdfPath = join(process.cwd(), 'storage', 'pdfs', tenantId!, `${documentId}`);

  try {
    const pdfBuffer = await readFile(pdfPath);
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${documentId}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    throw new Response('PDF not found', { status: 404 });
  }
};
