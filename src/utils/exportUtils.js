// src\app\features\ocr\utils\exportUtils.js
import { saveAs } from 'file-saver';

// Simple notification function (you can import your actual notification system)
const showNotification = (message, type = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  // Replace with your actual notification system
};

// PDF Export using jsPDF - FIXED font issue
export const exportAsPDF = async (content, formatting, metadata = {}) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Use a font that jsPDF supports by default
    // Available fonts: 'helvetica', 'times', 'courier'
    
    const safeFont = formatting.fontFamily === 'Courier New' ? 'courier' : 
                    formatting.fontFamily === 'Times New Roman' ? 'times' : 
                    'helvetica';
    
    doc.setFont(safeFont);
    doc.setFontSize(formatting.fontSize || 12);
    
    // Add title
    doc.setFontSize(16);
    doc.text('OCR Document', 20, 20);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    if (metadata.documentType) {
      doc.text(`Type: ${metadata.documentType.replace('_', ' ')}`, 20, 35);
    }
    
    // Add content with safe font
    doc.setFontSize(formatting.fontSize || 12);
    const pageWidth = doc.internal.pageSize.width - 40;
    
    // Split text into lines
    const lines = doc.splitTextToSize(content, pageWidth);
    
    let y = 45; // Start position
    for (let i = 0; i < lines.length; i++) {
      // Add new page if needed
      if (y > doc.internal.pageSize.height - 20) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(lines[i], 20, y);
      y += 7; // Line spacing
    }
    
    // Generate filename
    const filename = `ocr-document-${Date.now()}.pdf`;
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('PDF export error:', error);
    showNotification('Failed to export as PDF', 'error');
    return { success: false, error: error.message };
  }
};

// Word Document (.docx) Export - FIXED for browser
export const exportAsDOCX = async (content, formatting, metadata = {}) => {
  try {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');

    // Apply metadata with defaults
    const {
      title = 'Untitled Document',
      subject = '',
      author = 'Unknown Author',
      keywords = '',
      description = '',
      lastModifiedBy = author,
      revision = '1'
    } = metadata;

    // Create a simple document structure
    const doc = new Document({
      creator: author,
      title,
      description,
      subject,
      keywords,
      lastModifiedBy,
      revision,
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: content,
                  bold: formatting.bold || false,
                  italics: formatting.italic || false,
                  underline: formatting.underline ? {} : undefined,
                  size: Math.min((formatting.fontSize || 12) * 2, 72), // Limit font size
                  font: 'Arial', // Use Arial instead of formatting.fontFamily (safer)
                  color: (formatting.color || '#000000').replace('#', '')
                })
              ]
            })
          ]
        }
      ]
    });

    // Use Packer.toBlob() instead of Packer.toBuffer() for browser compatibility
    const blob = await Packer.toBlob(doc);
    
    const filename = `ocr-document-${Date.now()}.docx`;
    saveAs(blob, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('DOCX export error:', error);
    showNotification('Failed to export as Word document', 'error');
    return { success: false, error: error.message };
  }
};


// Plain Text Export
export const exportAsTXT = (content, formatting, metadata = {}) => {
  try {
    const textContent = `
OCR Document
Generated: ${new Date().toLocaleString()}
Type: ${metadata.documentType || 'Unknown'}
========================================

${content}
    `.trim();
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const filename = `ocr-document-${Date.now()}.txt`;
    saveAs(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('TXT export error:', error);
    showNotification('Failed to export as text file', 'error');
    return { success: false, error: error.message };
  }
};

// HTML Export
export const exportAsHTML = (content, formatting, metadata = {}) => {
  try {
    const safeContent = content
      .replace(/\n/g, '<br>')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OCR Document</title>
    <style>
        body {
            font-family: ${formatting.fontFamily || 'Arial'}, sans-serif;
            font-size: ${formatting.fontSize || 16}px;
            color: ${formatting.color || '#000000'};
            background-color: ${formatting.backgroundColor || '#ffffff'};
            line-height: ${formatting.lineHeight || 1.6};
            margin: 40px;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .content {
            white-space: pre-wrap;
            font-weight: ${formatting.bold ? 'bold' : 'normal'};
            font-style: ${formatting.italic ? 'italic' : 'normal'};
            text-decoration: ${formatting.underline ? 'underline' : 'none'};
            text-align: ${formatting.alignment || 'left'};
        }
        .metadata {
            color: #718096;
            font-size: 0.9em;
            margin-top: 40px;
            border-top: 1px solid #E2E8F0;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>OCR Document</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Document Type: ${metadata.documentType ? metadata.documentType.replace('_', ' ') : 'Unknown'}</p>
    </div>
    
    <div class="content">
        ${safeContent}
    </div>
    
    <div class="metadata">
        <p>Total Words: ${content.split(/\s+/).filter(word => word.length > 0).length}</p>
        <p>Total Characters: ${content.length}</p>
        <p>Export Format: HTML</p>
    </div>
</body>
</html>
    `.trim();
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const filename = `ocr-document-${Date.now()}.html`;
    saveAs(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('HTML export error:', error);
    showNotification('Failed to export as HTML', 'error');
    return { success: false, error: error.message };
  }
};

// JSON Export (preserves all data)
export const exportAsJSON = (content, formatting, shapes = [], canvasBackground, metadata = {}) => {
  try {
    const fullData = {
      text: content,
      formatting: formatting,
      shapes: shapes,
      canvasBackground: canvasBackground,
      metadata: {
        documentType: metadata.documentType,
        timestamp: new Date().toISOString(),
        aiResults: metadata.aiResults || null,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: content.length
      }
    };
    
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { 
      type: 'application/json' 
    });
    const filename = `ocr-document-${Date.now()}.json`;
    saveAs(blob, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('JSON export error:', error);
    showNotification('Failed to export as JSON', 'error');
    return { success: false, error: error.message };
  }
};

// Main export handler function
export const handleDocumentExport = async (format, data) => {
    console.log('Export called with:', format, data);
  const {
    content = '',
    formatting = {},
    shapes = [],
    canvasBackground = '#FFFFFF',
    metadata = {}
  } = data;

  if (!format) {
    console.error('No format specified');
    return { success: false, error: 'Export format not specified' };
  }

  if (!data || !data.content) {
    console.error('No content to export');
    return { success: false, error: 'No content to export' };
  }

  try {
    let result;
    
    switch (format.toLowerCase()) {
      case 'pdf':
        result = await exportAsPDF(content, formatting, metadata);
        break;
        
      case 'docx':
      case 'word':
        result = await exportAsDOCX(content, formatting, metadata);
        break;
        
      case 'txt':
      case 'text':
        result = exportAsTXT(content, formatting, metadata);
        break;
        
      case 'html':
        result = exportAsHTML(content, formatting, metadata);
        break;
        
      case 'json':
        result = exportAsJSON(content, formatting, shapes, canvasBackground, metadata);
        break;
        
      default:
        result = exportAsJSON(content, formatting, shapes, canvasBackground, metadata);
    }
    
    if (result.success) {
      showNotification(`Document exported as ${format.toUpperCase()}`, 'success');
    }
    
    return result;
  } catch (error) {
    console.error(`Export error for ${format}:`, error);
    showNotification(`Export failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
};