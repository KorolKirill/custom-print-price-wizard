import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFViewerProps {
  pdfUrl: string;
  scale?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, scale = 1.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const renderPDF = async () => {
      if (!canvasRef.current) return;

      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    renderPDF();
  }, [pdfUrl, scale]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />;
};

export default PDFViewer;