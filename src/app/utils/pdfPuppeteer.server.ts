// utils/pdfPuppeteer.server.ts
import puppeteer from 'puppeteer';

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();

    // Set viewport for high quality (2x scale as per memory requirements)
    await page.setViewport({
      width: 1200,  // A4 width at 144 DPI
      height: 1697, // A4 height at 144 DPI
      deviceScaleFactor: 2, // 2x scale for better resolution as per requirements
    });

    // Enable request interception for logging and security
    await page.setRequestInterception(true);
    page.on('request', request => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      // Allow data URLs (base64 images) and regular image requests
      if (url.startsWith('data:') || resourceType === 'image' || resourceType === 'document') {
        console.log(`Allowing resource: ${url.substring(0, 100)}... (${resourceType})`);
        request.continue();
      } else {
        console.log(`Blocked resource: ${url} (${resourceType})`);
        request.abort();
      }
    });

    // Log any failed requests for debugging
    page.on('requestfailed', request => {
      const failure = request.failure();
      console.error(`Request failed: ${request.url()} - ${failure?.errorText}`);
    });

    // Set content with proper wait conditions
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 30000 
    });

    // Wait for all images with proper logging
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      console.log(`Found ${images.length} images to process`);
      
      await Promise.all(
        images.map(img => {
          if (img.complete) {
            const isLoaded = img.naturalWidth !== 0;
            console.log(`Image already processed:`, {
              src: img.src.substring(0, 100) + '...',
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              isLoaded
            });
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.error('Image load timeout:', {
                src: img.src.substring(0, 100) + '...',
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
              });
              resolve();
            }, 5000);

            img.addEventListener('load', () => {
              clearTimeout(timeout);
              console.log('Image loaded successfully:', {
                src: img.src.substring(0, 100) + '...',
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
              });
              resolve();
            });

            img.addEventListener('error', (error) => {
              clearTimeout(timeout);
              console.error('Image failed to load:', {
                src: img.src.substring(0, 100) + '...',
                error: error.type,
                complete: img.complete
              });
              resolve();
            });
          });
        })
      );

      // Final verification of images
      images.forEach(img => {
        const style = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        
        console.log('Final image state:', {
          src: img.src.substring(0, 100) + '...',
          display: style.display,
          visibility: style.visibility,
          width: rect.width,
          height: rect.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          position: {
            top: rect.top,
            left: rect.left
          }
        });
      });
    });

    // Add a small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate PDF with high quality settings from memory requirements
    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      landscape: false,
      scale: 1, // Using deviceScaleFactor instead for better quality
      preferCSSPageSize: true
    });

    return Buffer.from(pdfData);
  } finally {
    await browser.close();
  }
}
