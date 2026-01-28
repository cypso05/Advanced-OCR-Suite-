// src/app/features/ocr/components/useEditorNavigation.js
import { useNavigate, useLocation } from 'react-router-dom';

export const useEditorNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const goToTextEditor = (content, docType, additionalState = {}) => {
    navigate(`/ocr/text-editor?content=${encodeURIComponent(content)}&docType=${docType}`, {
      state: { 
        cameFromAdvancedOCR: true,
        ...additionalState
      }
    });
  };
  
  const goToPDFEditor = (content, docType, additionalState = {}) => {
    navigate(`/ocr/pdf-editor?content=${encodeURIComponent(content)}&docType=${docType}`, {
      state: { 
        cameFromAdvancedOCR: true,
        ...additionalState
      }
    });
  };
  
  const goToPreview = (previewData) => {
    navigate('/ocr/export-preview', {
      state: { 
        ...previewData,
        cameFromPDFEditor: true,
        previousLocation: location.pathname // Track where we came from
      }
    });
  };
  
  const goBackToAdvancedOCR = () => {
    // Use replace: true to clear the navigation stack
    navigate('/ocr/advanced', { 
      replace: true
    });
  };
  
  const goBackToPDFEditor = (stateData = {}) => {
    navigate('/ocr/pdf-editor', {
      state: {
        ...stateData,
        cameFromPreview: true
      }
    });
  };
  
  const goBackToTextEditor = (stateData = {}) => {
    navigate('/ocr/text-editor', {
      state: {
        ...stateData,
        cameFromPreview: true
      }
    });
  };
  
  const goBackSafely = () => {
    // Smart back navigation that checks where we came from
    if (location.state?.cameFromAdvancedOCR) {
      goBackToAdvancedOCR();
    } else if (location.state?.cameFromPreview) {
      navigate(-1); // Go back once
    } else {
      navigate(-1); // Default behavior
    }
  };
  
  return {
    goToTextEditor,
    goToPDFEditor,
    goToPreview,
    goBackToAdvancedOCR,
    goBackToPDFEditor,
    goBackToTextEditor,
    goBackSafely, // ADD THIS for flexible back navigation
    currentLocation: location
  };
};