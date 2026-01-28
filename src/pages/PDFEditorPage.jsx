import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PDFEditor from '../components/PDFEditor';
import { useNotification } from '../components/useNotification';

const PDFEditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const { showNotification } = useNotification();
  
  const searchParams = new URLSearchParams(location.search);
  const content = searchParams.get('content') || '';
  const docType = searchParams.get('docType') || 'document';
  const isMerged = searchParams.get('merged') === 'true';
  
  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };
  
  // Updated handleSave function that works with PDFEditor
  const handleSave = async (savedContent, format = 'json') => {
    try {
      console.log('Saving PDF content with format:', format, savedContent);
      
      // Parse the content
      let dataToSave;
      try {
        dataToSave = JSON.parse(savedContent);
      } catch {
        dataToSave = { 
          text: savedContent, 
          timestamp: new Date().toISOString(),
          metadata: {
            documentType: docType,
            savedAt: new Date().toISOString()
          }
        };
      }
      
      if (format === 'json') {
        // Save to localStorage for JSON format
        const savedDesigns = JSON.parse(localStorage.getItem('pdfEditorDesigns') || '[]');
        const newDesign = {
          ...dataToSave,
          id: `pdf_design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          savedAt: new Date().toISOString(),
          format: format
        };
        
        savedDesigns.push(newDesign);
        localStorage.setItem('pdfEditorDesigns', JSON.stringify(savedDesigns));
        
        showNotification(`Design saved successfully! (ID: ${newDesign.id})`, 'success');
        return { success: true, id: newDesign.id };
      } else {
        // For other formats, show appropriate message
        // The actual export is handled inside PDFEditor via handlePDFDocumentExport
        showNotification(`Exporting as ${format.toUpperCase()}...`, 'info');
        return { success: true };
      }
      
    } catch (error) {
      console.error('Save error:', error);
      showNotification(`Error saving document: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  };

  return (
    <PDFEditor
      open={open}
      onClose={handleClose}
      content={content}
      onSave={handleSave}  // Pass the save function
      documentType={docType}
      aiResults={isMerged ? { isMerged: true } : null}
    />
  );
};

export default PDFEditorPage;