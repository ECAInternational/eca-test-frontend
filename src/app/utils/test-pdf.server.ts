import { generatePdfFromHtml } from './pdfPuppeteer.server';
import { promises as fs } from 'fs';
import path from 'path';

async function testPdfGeneration() {
  try {
    // Read the test HTML file
    const htmlPath = path.join(__dirname, 'test-pdf.html');
    const html = await fs.readFile(htmlPath, 'utf-8');
    
    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await generatePdfFromHtml(html);
    
    // Save the PDF to test output
    const outputPath = path.join(__dirname, 'test-output.pdf');
    await fs.writeFile(outputPath, pdfBuffer);
    
    console.log('PDF generated successfully!');
    console.log('Output saved to:', outputPath);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

// Run the test
testPdfGeneration();
