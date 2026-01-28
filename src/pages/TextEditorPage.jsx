import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TextEditor from '../components/TextEditor';
import { handleDocumentExport } from '../utils/exportUtils';

import { useNotification } from '../components/useNotification'; // Add this

const TextEditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const { showNotification } = useNotification(); // Add this
  
  // Extract query parameters
  const searchParams = new URLSearchParams(location.search);
  const content = searchParams.get('content') || '';
  const docType = searchParams.get('docType') || 'document';
  const isMerged = searchParams.get('merged') === 'true';
  
  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };
  
  const handleSave = async (savedContent, format = 'json') => {
    try {
      console.log('Saving content with format:', format, savedContent);
      
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
        const savedDocuments = JSON.parse(localStorage.getItem('textEditorDocuments') || '[]');
        const newDocument = {
          ...dataToSave,
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          savedAt: new Date().toISOString(),
          format: format
        };
        
        savedDocuments.push(newDocument);
        localStorage.setItem('textEditorDocuments', JSON.stringify(savedDocuments));
        
        showNotification(`Document saved successfully! (ID: ${newDocument.id})`, 'success'); // Changed from alert
      } else {
        // For other formats, use the export utility
        await handleDocumentExport(format, dataToSave);
        showNotification(`Document exported as ${format.toUpperCase()}!`, 'success'); // Changed from alert
      }
      
    } catch (error) {
      console.error('Save error:', error);
      showNotification(`Error saving document: ${error.message}`, 'error'); // Changed from alert
    }
  };

  return (
    <TextEditor
      open={open}
      onClose={handleClose}
      content={content}
      onSave={handleSave}
      documentType={docType}
      aiResults={isMerged ? { isMerged: true } : null}
    />
  );
};

export default TextEditorPage;