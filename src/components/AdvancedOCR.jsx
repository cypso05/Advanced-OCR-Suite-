// src/app/features/ocr/components/AdvancedOCR.jsx
import React, { useState, useRef, useEffect } from 'react';

import { useEditorNavigation } from './useEditorNavigation'; // ADD THIS
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  LinearProgress, List, ListItem, ListItemText, Chip,
  FormControlLabel, Switch, IconButton,
  MenuItem, Select, FormControl, InputLabel, Alert,
  Tooltip, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions  // Add these
} from '@mui/material';
import {
  CloudUpload, AutoFixHigh,
  CheckCircle, Error as ErrorIcon, Edit,
  PictureAsPdf, Description, Badge, Receipt,
  Work, LocalOffer, LocalShipping, MedicalServices,
  Translate, Book, Download, Delete,
  Analytics, Info, Warning
} from '@mui/icons-material';
import OCREngine from '../services/ocrEngine';
import { preprocessImage, convertPDFToImage, validateFile } from '../utils/imageProcessing';
import HybridTranslationService from '../services/hybridTranslationService';

// Import smart extraction
import { smartExtract } from '../utils/smartExtractor.js';
import SmartResults from '../components/SmartResults.jsx';

// Import storage
import { storageManager } from '../storage/storageManager';



// Helper function for proper singular/plural messages
const formatFileMessage = (count, fileName = '') => {
  if (count === 0) return 'No files added';
  if (count === 1) return fileName ? `Added "${fileName}"` : 'Added 1 file';
  return `Added ${count} files`;
};

const DOCUMENT_TYPES = {
  receipt: {
    name: 'Receipt Scanner',
    icon: <Receipt />,
    description: 'Extract items, totals, and taxes from receipts',
    color: '#4CAF50'
  },
  invoice: {
    name: 'Invoice Parser',
    icon: <Description />,
    description: 'Extract vendor, dates, totals from invoices',
    color: '#2196F3'
  },
  id_card: {
    name: 'ID Scanner',
    icon: <Badge />,
    description: 'Extract information from IDs and passports',
    color: '#FF9800'
  },
  shipping_label: {
    name: 'Shipping Label',
    icon: <LocalShipping />,
    description: 'Extract tracking numbers and addresses',
    color: '#607D8B'
  },
  medicine: {
    name: 'Medicine Scanner',
    icon: <MedicalServices />,
    description: 'Read drug names and expiration dates',
    color: '#F44336'
  },
  utility_bill: {
    name: 'Utility Bill',
    icon: <Receipt />,
    description: 'Extract usage data and amounts',
    color: '#9C27B0'
  },
  bank_statement: {
    name: 'Bank Statement',
    icon: <Description />,
    description: 'Parse transactions and balances',
    color: '#795548'
  },
  insurance: {
    name: 'Insurance Doc',
    icon: <Description />,
    description: 'Extract policy details',
    color: '#00BCD4'
  },
  pay_stub: {
    name: 'Pay Stub',
    icon: <Work />,
    description: 'Parse income and deductions',
    color: '#E91E63'
  },
  resume: {
    name: 'Resume Parser',
    icon: <Work />,
    description: 'Parse CVs into structured data',
    color: '#4CAF50'
  },
document: {
    name: 'Document Digitizer',
    icon: <Description />,
    description: 'Convert any document to searchable text with enhanced OCR',
    color: '#9C27B0'
},
  book: {
    name: 'Book Scanner',
    icon: <Book />,
    description: 'Extract text from books and textbooks',
    color: '#795548'
  },
  translation: {
    name: 'Translation Assistant',
    icon: <Translate />,
    description: 'OCR and translate text between languages',
    color: '#E91E63'
  },
  price_tag: {
    name: 'Price Tag Scanner',
    icon: <LocalOffer />,
    description: 'Read price tags and shelf labels',
    color: '#00BCD4'
  },
  handwriting: {
    name: 'Handwriting OCR',
    icon: <Edit />,
    description: 'Convert handwritten notes to digital text',
    color: '#8BC34A'
  }
};

// Enhanced Document-specific processing options
const getDocumentSpecificOptions = (documentType) => {
  const options = {
    receipt: {
      tableDetection: true,
      enhanceImages: true,
      preserveLayout: true,
      recommendedLanguages: ['eng', 'spa', 'fra', 'deu'],
      confidenceThreshold: 0.75,
      extractionFields: ['total', 'date', 'merchant', 'tax', 'subtotal'],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.3,
        brightness: 1.0,
        noiseReduction: true
      },
      processingTips: [
        "Ensure receipt is well-lit and all text is visible",
        "Totals and dates are automatically extracted",
        "Works best with clear, structured receipts"
      ]
    },
    invoice: {
      tableDetection: true,
      enhanceImages: true,
      preserveLayout: true,
      recommendedLanguages: ['eng', 'spa', 'fra', 'deu', 'ita'],
      confidenceThreshold: 0.8,
      extractionFields: ['invoiceNumber', 'vendor', 'dueDate', 'total', 'poNumber'],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.3,
        brightness: 1.0,
        noiseReduction: true
      },
      processingTips: [
        "Include vendor details and invoice numbers",
        "Due dates and totals are automatically extracted",
        "Table detection is enabled for structured data"
      ]
    },
    bank_statement: {
      tableDetection: true,
      enhanceImages: true,
      preserveLayout: true,
      recommendedLanguages: ['eng', 'spa', 'fra'],
      confidenceThreshold: 0.85,
      extractionFields: ['accountNumber', 'statementDate', 'openingBalance', 'closingBalance'],
      preprocessing: {
        enhanceContrast: true,
        grayscale: true,
        sharpness: 0.4,
        brightness: 1.1,
        noiseReduction: true
      },
      processingTips: [
        "Multi-page statements are supported",
        "Financial tables are automatically detected",
        "Balance amounts are extracted with high accuracy"
      ]
    },
    resume: {
      tableDetection: false,
      enhanceImages: true,
      preserveLayout: false,
      recommendedLanguages: ['eng'],
      confidenceThreshold: 0.9,
      extractionFields: ['fullName', 'email', 'phone', 'experience', 'education'],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.3,
        brightness: 1.0,
        noiseReduction: false
      },
      processingTips: [
        "Structured resumes yield best results",
        "Contact information is automatically extracted",
        "Education and experience sections are prioritized"
      ]
    },
    handwriting: {
      tableDetection: false,
      enhanceImages: true,
      preserveLayout: false,
      specialHandwritingMode: true,
      recommendedLanguages: ['eng', 'spa', 'fra'],
      confidenceThreshold: 0.6,
      extractionFields: [],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.5,
        brightness: 1.2,
        noiseReduction: true,
        deskew: true
      },
      processingTips: [
        "Use clear, well-spaced handwriting",
        "Higher contrast images work better",
        "Text enhancement is automatically applied"
      ]
    },
    id_card: {
      tableDetection: false,
      enhanceImages: true,
      preserveLayout: true,
      recommendedLanguages: ['eng', 'spa', 'fra', 'deu', 'ita'],
      confidenceThreshold: 0.9,
      extractionFields: ['name', 'idNumber', 'dob', 'expiry', 'nationality'],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.4,
        brightness: 1.0,
        noiseReduction: true,
        cropBorders: true
      },
      processingTips: [
        "Align ID card properly in frame",
        "Ensure text is not obscured or blurred",
        "Personal information is securely processed"
      ]
    },
    medicine: {
      tableDetection: false,
      enhanceImages: true,
      preserveLayout: true,
      recommendedLanguages: ['eng', 'spa', 'fra', 'deu'],
      confidenceThreshold: 0.85,
      extractionFields: ['drugName', 'expiry', 'dosage', 'frequency'],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.4,
        brightness: 1.0,
        noiseReduction: true
      },
      processingTips: [
        "Focus on drug name and expiry date areas",
        "Dosage information is automatically extracted",
        "Works with prescription labels and packaging"
      ]
    },
    shipping_label: {
      tableDetection: false,
      enhanceImages: true,
      preserveLayout: true,
      recommendedLanguages: ['eng'],
      confidenceThreshold: 0.8,
      extractionFields: ['trackingNumber', 'carrier', 'weight', 'service'],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.4,
        brightness: 1.1,
        noiseReduction: true
      },
      processingTips: [
        "Tracking numbers are automatically detected",
        "Address information is extracted",
        "Carrier and service type are identified"
      ]
    },
    translation: {
      tableDetection: false,
      enhanceImages: true,
      preserveLayout: false,
      recommendedLanguages: ['eng', 'spa', 'fra', 'deu', 'ita', 'chi_sim', 'jpn', 'kor'],
      confidenceThreshold: 0.7,
      extractionFields: [],
      preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.3,
        brightness: 1.0,
        noiseReduction: true
      },
      processingTips: [
        "Supports translation between multiple languages",
        "Original and translated text are displayed side-by-side",
        "Language detection is automatic"
      ]
    },
// If there's no specific 'document' config, add it before 'default'

document: {
    tableDetection: true,
    enhanceImages: true,
    preserveLayout: true,
    recommendedLanguages: ['eng', 'ces', 'spa', 'fra', 'deu', 'ita', 'por', 'rus'],
    confidenceThreshold: 0.8,
    extractionFields: [],
    preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.3,
        brightness: 1.0,
        noiseReduction: true
    },
    processingTips: [
        "For general documents, text-heavy content, and mixed layouts",
        "Enhanced grayscale mode for better character recognition",
        "Auto-deskew for crooked documents",
        "Works best with clear, high-contrast images"
    ]
},

default: {
    tableDetection: true,
    enhanceImages: true,
    preserveLayout: true,
    recommendedLanguages: ['eng'],
    confidenceThreshold: 0.7,
    extractionFields: [],
    preprocessing: {
        enhanceContrast: true,
        grayscale: false,
        sharpness: 0.3,
        brightness: 1.0,
        noiseReduction: true
    },
    processingTips: [
        "General document processing mode",
        "Text extraction with basic formatting",
        "Suitable for most document types"
    ]
}
  };
  
  return options[documentType] || options.default;
};

// Get document-specific tips for UI display
const getDocumentTips = (documentType) => {
  const tips = {
    receipt: "Upload clear images of receipts. Ensure totals and dates are visible.",
    invoice: "Invoices with tables and structured data work best. Include vendor details.",
    handwriting: "For best results, use high-contrast handwriting with clear spacing.",
    id_card: "Align ID cards properly in frame. Ensure text is not obscured.",
    medicine: "Focus on drug name, dosage, and expiry date areas.",
    bank_statement: "Multi-page statements supported. Financial tables will be extracted.",
    resume: "Structured resumes with clear sections yield best results.",
    shipping_label: "Tracking numbers and addresses will be automatically extracted.",
    translation: "Supports 50+ languages. Enable auto-translate for instant results.",
    default: "Ensure good lighting and clear text for optimal results."
  };
  
  return tips[documentType] || tips.default;
};
const AdvancedOCR = () => {
  const fileInputRef = useRef(null);
  const { goToTextEditor, goToPDFEditor } = useEditorNavigation();
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('document');
  const [translationProgress, setTranslationProgress] = useState(0);
  const [analyticsInsights, setAnalyticsInsights] = useState([]);
  const [useSmartAnalytics, setUseSmartAnalytics] = useState(false);
  const [analyticsProcessing, setAnalyticsProcessing] = useState(false);
  const [analyticsResults, setAnalyticsResults] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showEditorChoice, setShowEditorChoice] = useState(false);
  const [pendingMergedResult, setPendingMergedResult] = useState(null);

  const [options, setOptions] = useState({
    tableDetection: true,
    enhanceImages: true,
    language: 'eng',
    outputFormat: 'text',
    targetLanguage: 'en',
    autoTranslate: false
  });

  // Add this helper function inside the component
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get current document-specific options
  const currentDocOptions = getDocumentSpecificOptions(selectedDocumentType);

  // Update options when document type changes
  useEffect(() => {
    const docOptions = getDocumentSpecificOptions(selectedDocumentType);
    
    // Update tableDetection and enhanceImages based on document type
    setOptions(prev => ({
      ...prev,
      tableDetection: docOptions.tableDetection,
      enhanceImages: docOptions.enhanceImages,
      // For handwriting mode, ensure we use a supported language
      ...(docOptions.specialHandwritingMode && prev.language === 'chi_sim' && { language: 'eng' })
    }));

    // Show document-specific tip
    showDocumentTip(selectedDocumentType);
  }, [selectedDocumentType]);

  const showDocumentTip = (docType) => {
    const tip = getDocumentTips(docType);
    setSnackbar({
      open: true,
      message: `${DOCUMENT_TYPES[docType]?.name || docType}: ${tip}`,
      severity: 'info'
    });
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Enhanced smart analytics processing
  const processWithSmartAnalytics = async (ocrText, documentType, fileName) => {
    try {
      setAnalyticsProcessing(true);
      
      // Use enhanced smart extraction
      const extraction = smartExtract(ocrText, documentType);
      
      // Generate insights for dashboard
      const insights = generateDocumentInsights(extraction, documentType);
      setAnalyticsInsights(prev => [...prev, ...insights]);
      
      // Store for analytics dashboard
      const processedDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        documentType,
        rawText: ocrText,
        extractedData: extraction.extracted,
        analytics: extraction.analytics,
        timestamp: new Date().toISOString(),
        confidence: extraction.analytics.confidence,
        formattedText: extraction.formattedText,
        insights,
      };

      // Save to storage with enhanced structure
      await storageManager.storeDocument(processedDocument);
      
      // Update state with enhanced analytics
      setAnalyticsResults(prev => ({
        ...prev,
        [fileName]: {
          ...processedDocument,
          processingStatus: 'completed',
          qualityScore: calculateQualityScore(ocrText, extraction),
          exportOptions: {
            text: true,
            json: true,
            csv: true,
            pdf: true,
          }
        }
      }));

      return {
        success: true,
        extraction,
        insights,
        documentId: processedDocument.id,
      };
    } catch (error) {
      console.error('Smart analytics processing failed:', error);
      
      // Fallback extraction
      const extraction = smartExtract(ocrText, documentType);
      setAnalyticsResults(prev => ({
        ...prev,
        [fileName]: {
          extraction,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          processingStatus: 'failed'
        }
      }));
      
      return {
        success: false,
        error: error.message,
        extraction,
      };
    } finally {
      setAnalyticsProcessing(false);
    }
  };

  // Helper functions
  const generateDocumentInsights = (extraction, docType) => {
    const insights = [];
    const { extracted, analytics } = extraction;
    
    insights.push({
      type: 'summary',
      title: `${docType.replace('_', ' ').toUpperCase()} Analysis`,
      content: `Found ${extracted.dates.length} dates and ${extracted.money.length} monetary values`,
      icon: 'info',
      priority: 'low'
    });
    
    if (analytics.summary.hasFinancialData) {
      insights.push({
        type: 'financial',
        title: 'Financial Data Detected',
        content: 'Document contains monetary amounts for analysis',
        icon: 'money',
        priority: 'high'
      });
    }
    
    if (analytics.insights?.length > 0) {
      analytics.insights.forEach(insight => {
        insights.push({
          type: 'insight',
          title: 'Key Insight',
          content: insight,
          icon: 'lightbulb',
          priority: 'medium'
        });
      });
    }
    
    return insights;
  };

  const calculateQualityScore = (text, extraction) => {
    let score = 0;
    const { extracted } = extraction;
    
    // Text quality
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    if (lines.length === 0) return 0;
    
    const avgLineLength = lines.reduce((acc, line) => acc + line.length, 0) / lines.length;
    
    if (avgLineLength > 20) score += 25;
    if (lines.length > 3) score += 25;
    
    // Extraction quality
    if (extracted.dates.length > 0) score += 20;
    if (extracted.money.length > 0) score += 20;
    if (extracted.emails.length > 0 || extracted.phones.length > 0) score += 10;
    
    return Math.min(score, 100);
  };

  // Enhanced Analytics Dashboard Integration
  const navigateToAnalytics = (documentId = null) => {
    // Prepare comprehensive analytics data
    const analyticsData = {
      timestamp: new Date().toISOString(),
      documents: Object.values(analyticsResults).map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        extractedData: doc.extractedData,
        timestamp: doc.timestamp,
        confidence: doc.confidence,
      })),
      insights: analyticsInsights,
      summary: {
        totalProcessed: results.length,
        withAnalytics: results.filter(r => r.smartProcessed).length,
        avgConfidence: results.length > 0 
          ? results.reduce((acc, r) => acc + (r.confidence || 0), 0) / results.length 
          : 0,
        totalExtractions: results.reduce((acc, r) => {
          if (r.extraction?.extracted) {
            return acc + Object.values(r.extraction.extracted).flat().length;
          }
          return acc;
        }, 0)
      }
    };
    
    // Store for dashboard
    localStorage.setItem('advancedOCR_analytics', JSON.stringify(analyticsData));
    if (documentId) {
      localStorage.setItem('selectedDocumentId', documentId);
    }
    
    // Navigate with state
    window.location.href = '/dashboard';
  };

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    const validFiles = newFiles.filter(file => {
      try {
        validateFile(file);
        return true;
      } catch (error) {
        alert(`Skipping ${file.name}: ${error.message}`);
        return false;
      }
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // Get file name for single file message
      const fileName = validFiles.length === 1 ? validFiles[0].name : '';
      
      // Build the main message
      const mainMessage = formatFileMessage(validFiles.length, fileName);
      
      // Add info about skipped files
      const skippedCount = newFiles.length - validFiles.length;
      let fullMessage = mainMessage;
      
      if (skippedCount > 0) {
        fullMessage += ` (${skippedCount} invalid file${skippedCount === 1 ? '' : 's'} skipped)`;
      }
      
      showSnackbar(fullMessage, 'success');
    } else if (newFiles.length > 0) {
      // All files were invalid
      showSnackbar('All files were invalid. Please check file types and sizes.', 'warning');
    } else {
      // No files selected (shouldn't happen, but just in case)
      showSnackbar('No files selected', 'info');
    }
    
    // Reset file input to allow uploading the same file again
    resetFileInput();
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const fileToRemove = prev[index];
      const newFiles = prev.filter((_, i) => i !== index);
      
      // Show message about removed file
      if (fileToRemove) {
        showSnackbar(`Removed "${fileToRemove.name}"`, 'info');
      }
      
      if (newFiles.length === 0) {
        showSnackbar('All files removed', 'info');
      }
      
      return newFiles;
    });
  };

  // Main processing function with enhanced document-specific processing
  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults([]);
    setProgress(0);
    setAnalyticsResults({});
    setAnalyticsInsights([]);

    const processedResults = [];
    let successfulCount = 0;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      setProgress((i / files.length) * 50);

      try {
        let imageData;
        if (file.type === 'application/pdf') {
          const pdfPages = await convertPDFToImage(file);
          imageData = pdfPages[0]?.dataUrl || pdfPages[0];
        } else {
          imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }

        // Get document-specific preprocessing settings
        const docOptions = getDocumentSpecificOptions(selectedDocumentType);
        const processedImage = options.enhanceImages 
          ? await preprocessImage(imageData, { 
              documentMode: true,
              ...docOptions.preprocessing,
            })
          : imageData;

        // Perform standard OCR with document-specific options
        const ocrResult = await OCREngine.recognizeDocument(
          processedImage, 
          selectedDocumentType, 
          options.language,
          {
            tableDetection: docOptions.tableDetection,
            handwritingMode: docOptions.specialHandwritingMode || false,
            confidenceThreshold: docOptions.confidenceThreshold,
            extractFields: docOptions.extractionFields
          }
        );

        if (!ocrResult || !ocrResult.text || ocrResult.text.trim().length === 0) {
          console.log('OCR Result:', ocrResult);
          throw new Error(`OCR failed: ${ocrResult.text ? 'Empty text with ' + ocrResult.confidence + '% confidence' : 'No text extracted'}`);
        }

        // Smart Analytics Processing if enabled
        let extraction = null;
        if (useSmartAnalytics) {
          const analyticsResult = await processWithSmartAnalytics(
            ocrResult.text,
            selectedDocumentType,
            file.name
          );
          
          if (analyticsResult && analyticsResult.success) {
            extraction = analyticsResult.extraction;
          }
        }

        // Handle translation if enabled
        if (selectedDocumentType === 'translation' && options.autoTranslate && ocrResult.text) {
          setTranslationProgress(50);
          const sourceLang = HybridTranslationService.ocrToTranslationLang(options.language);
          const translatedText = await HybridTranslationService.translateText(
            ocrResult.text,
            options.targetLanguage,
            sourceLang
          );
          ocrResult.translatedText = translatedText;
          ocrResult.originalText = ocrResult.text;
          ocrResult.text = `${ocrResult.text}\n\n--- TRANSLATION (${options.targetLanguage}) ---\n\n${translatedText}`;
          setTranslationProgress(100);
        }

        const result = {
          fileName: file.name,
          documentType: selectedDocumentType,
          ...ocrResult,
          extraction,
          timestamp: new Date().toISOString(),
          editable: true,
          fileType: file.type,
          smartProcessed: useSmartAnalytics && extraction !== null,
          analyticsEnabled: useSmartAnalytics,
          docSpecificOptions: docOptions,
          recognized: true
        };

        processedResults.push(result);
        successfulCount++;
        
        // Update results with ALL processed files so far
        setResults([...processedResults]);
        setProgress(((i + 1) / files.length) * 100);

      } catch (error) {
        console.error('Processing error:', error);
        const errorResult = {
          fileName: file.name,
          documentType: selectedDocumentType,
          text: '',
          confidence: 0,
          error: error.message,
          recognized: false,
          timestamp: new Date().toISOString(),
          smartProcessed: false,
          extraction: null
        };
        processedResults.push(errorResult);
        failedCount++;
        setResults([...processedResults]);
      }
    }

    setIsProcessing(false);
    setProgress(100);
    setCurrentFile(null);
    setTranslationProgress(0);
    
    if (processedResults.length > 0) {
      // Build detailed success message
      let message = '';
      
      if (successfulCount === processedResults.length) {
        // All successful
        if (processedResults.length === 1) {
          message = `Successfully processed 1 file`;
        } else {
          message = `Successfully processed ${processedResults.length} files`;
        }
      } else if (successfulCount === 0) {
        // All failed
        message = `Failed to process ${processedResults.length} file${processedResults.length !== 1 ? 's' : ''}`;
      } else {
        // Mixed results
        message = `Processed ${successfulCount} of ${processedResults.length} file${processedResults.length !== 1 ? 's' : ''} successfully`;
        if (failedCount > 0) {
          message += ` (${failedCount} failed)`;
        }
      }
      
      // Add smart analytics info if enabled
      if (useSmartAnalytics && successfulCount > 0) {
        const analyticsCount = processedResults.filter(r => r.smartProcessed).length;
        if (analyticsCount > 0) {
          message += ` with smart analytics`;
        }
      }
      
      showSnackbar(message, successfulCount > 0 ? 'success' : 'error');
    }
  };

  const handleMergeAndEditAll = () => {
    if (results.length === 0) {
      showSnackbar('No results to merge', 'warning');
      return;
    }

    // Create merged content with clear separators
    const mergedContent = results.map((result, index) => {
      const separator = '='.repeat(80);
      const fileHeader = `FILE ${index + 1}: ${result.fileName}\nDocument Type: ${result.documentType}\nConfidence: ${result.confidence}%\nTimestamp: ${result.timestamp}\n${separator}\n`;
      
      return fileHeader + (result.text || 'No text extracted') + '\n\n';
    }).join('\n\n' + '='.repeat(80) + '\n\n');

    // Store the merged result and show choice modal
    setPendingMergedResult({
      fileName: `merged-${results.length}-documents-${Date.now()}`,
      text: mergedContent,
      isMerged: true
    });
    setShowEditorChoice(true);
  };

  const handleDocumentTypeChange = (newDocType) => {
    setSelectedDocumentType(newDocType);
    showDocumentTip(newDocType);
  };

  const handleEditText = (result) => {
    goToTextEditor(result.text, result.documentType);
  };

  const handleEditPDF = (result) => {
    goToPDFEditor(result.text, result.documentType);
  };


  const exportAllResults = () => {
    if (results.length === 0) return;

    const format = options.outputFormat;
    let content, mimeType, extension;

    switch (format) {
      case 'csv':
        content = convertToCSV(results);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
        content = JSON.stringify(results, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'pdf':
        exportToPDF(results);
        return;
      default:
        content = convertToText(results);
        mimeType = 'text/plain';
        extension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr-results-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSnackbar(`Exported ${results.length} result(s) as ${format.toUpperCase()}`, 'success');
  };

  const exportSingleResult = (result, format = 'text') => {
    let content, mimeType, extension;

    switch (format) {
      case 'csv':
        content = convertToCSV([result]);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
        content = JSON.stringify(result, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'pdf':
        exportToPDF([result]);
        return;
      default:
        content = result.text || '';
        mimeType = 'text/plain';
        extension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.fileName.replace(/\.[^/.]+$/, "")}-${format}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSnackbar(`Exported "${result.fileName}" as ${format.toUpperCase()}`, 'success');
  };

const clearAll = () => {
  // Check if there's anything to clear
  const hasFiles = files.length > 0;
  const hasResults = results.length > 0;
  const hasAnalyticsResults = Object.keys(analyticsResults).length > 0;
  const hasAnalyticsInsights = analyticsInsights.length > 0;
  
  // If nothing to clear, show message and return
  if (!hasFiles && !hasResults && !hasAnalyticsResults && !hasAnalyticsInsights) {
    showSnackbar('No files or results to clear', 'info');
    return;
  }
  
  // Clear everything
  setFiles([]);
  setResults([]);
  setProgress(0);
  setAnalyticsResults({});
  setAnalyticsInsights([]);
  resetFileInput();
  
  // Show context-aware message
  let messageParts = [];
  if (hasFiles) messageParts.push(`${files.length} file(s)`);
  if (hasResults) messageParts.push(`${results.length} result(s)`);
  
  const message = messageParts.length > 0 
    ? `Cleared ${messageParts.join(', ')}`
    : 'Cleared all data';
  
  showSnackbar(message, 'success');
};

  const getSupportedLanguages = () => {
    const supportedLangs = OCREngine.getAvailableLanguages ? OCREngine.getAvailableLanguages() : [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'chi_sim', name: 'Chinese Simplified' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'kor', name: 'Korean' }
    ];
    
    // Filter languages based on document type recommendations
    const docOptions = getDocumentSpecificOptions(selectedDocumentType);
    if (docOptions.recommendedLanguages && docOptions.recommendedLanguages.length > 0) {
      return supportedLangs.filter(lang => 
        docOptions.recommendedLanguages.includes(lang.code)
      );
    }
    
    return supportedLangs;
  };

  // Check if current language is recommended for the selected document type
  const isLanguageRecommended = () => {
    const docOptions = getDocumentSpecificOptions(selectedDocumentType);
    return docOptions.recommendedLanguages.includes(options.language);
  };
  return (
    <Box sx={{ 
      color: 'text.primary',
      backgroundColor: 'background.default',
      minHeight: '100vh',
      p: 2
    }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
        Advanced OCR - Multi-Purpose Scanner
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        Professional document processing with smart analytics
      </Typography>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

     {/* Editor Launch Buttons */}
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      {/* Launch Text Editor - Now navigates to full page */}
      <Button
        variant="outlined"
        startIcon={<Edit />}
        onClick={() => window.location.href = '/ocr/text-editor'}
        sx={{
          borderColor: '#2196F3',
          color: '#2196F3',
          '&:hover': {
            backgroundColor: '#2196F3',
            color: 'white'
          }
        }}
      >
        Launch Text Editor
      </Button>

      {/* Launch PDF Editor - Now navigates to full page */}
      <Button
        variant="outlined"
        startIcon={<PictureAsPdf />}
        onClick={() => window.location.href = '/ocr/pdf-editor'}
        sx={{
          borderColor: '#f44336',
          color: '#f44336',
          '&:hover': {
            backgroundColor: '#f44336',
            color: 'white'
          }
        }}
      >
        Launch PDF Editor
      </Button>
  
      {/* Merge buttons */}
      {results.length > 1 && (
        <Button 
          size="small" 
          startIcon={<Edit />}
          onClick={handleMergeAndEditAll}
          variant="contained"
          color="secondary"
        >
          Merge & Edit All
        </Button>
      )}
    </Box>

      {/* Smart Analytics Toggle */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: 'background.paper',
        color: 'text.primary'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
              Smart Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Extract dates, amounts, contacts and generate insights from your documents
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={useSmartAnalytics}
                onChange={(e) => setUseSmartAnalytics(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography sx={{ color: 'text.primary' }}>Enable Smart Analytics</Typography>}
          />
        </Box>

        {useSmartAnalytics && (
          <Alert severity="info" sx={{ 
            mt: 2,
            backgroundColor: 'info.main',
            color: 'info.contrastText'
          }}>
            <Typography variant="body2">
              Smart analytics will automatically extract dates, monetary amounts, email addresses, 
              phone numbers, and organize the text for easy copying. View results in the Analytics Dashboard.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Document Type Selection */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: 'background.paper',
        color: 'text.primary'
      }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
          Select Document Type
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(DOCUMENT_TYPES).map(([key, doc]) => (
            <Grid item xs={6} sm={4} md={3} key={key}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedDocumentType === key ? 2 : 1,
                  borderColor: selectedDocumentType === key ? doc.color : 'divider',
                  transition: 'all 0.2s',
                  backgroundColor: 'background.paper',
                  '&:hover': { 
                    transform: 'translateY(-2px)', 
                    boxShadow: 2,
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => handleDocumentTypeChange(key)}
              >
                <CardContent sx={{ 
                  textAlign: 'center', 
                  p: 2
                }}>
                  <Box sx={{ color: doc.color, mb: 1 }}>
                    {doc.icon}
                  </Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.primary' }}>
                    {doc.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {doc.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Document-Specific Recommendations */}
      <Paper sx={{ 
        p: 2, 
        mb: 3,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderLeft: `4px solid ${DOCUMENT_TYPES[selectedDocumentType]?.color || '#2196F3'}`
      }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
          <Info sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          {DOCUMENT_TYPES[selectedDocumentType]?.name} Recommendations:
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>✅</span>
              Best languages: {currentDocOptions.recommendedLanguages.join(', ')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>✅</span>
              Table detection: {currentDocOptions.tableDetection ? 'Enabled' : 'Disabled'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>✅</span>
              Confidence threshold: {(currentDocOptions.confidenceThreshold * 100)}%
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>✅</span>
              {currentDocOptions.extractionFields.length} fields to extract
            </Typography>
          </Grid>
        </Grid>
        {currentDocOptions.processingTips && currentDocOptions.processingTips.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {currentDocOptions.processingTips.map((tip, index) => (
              <Typography key={index} variant="caption" sx={{ 
                color: 'text.secondary', 
                display: 'block', 
                mt: 0.5,
                fontStyle: 'italic'
              }}>
                • {tip}
              </Typography>
            ))}
          </Box>
        )}
        {selectedDocumentType === 'handwriting' && currentDocOptions.specialHandwritingMode && (
          <Alert severity="warning" sx={{ mt: 1, fontSize: '0.875rem' }}>
            <Typography variant="body2">
              Handwriting mode activated. For best results, ensure text is clear and well-spaced.
            </Typography>
          </Alert>
        )}
        {!isLanguageRecommended() && (
          <Alert severity="info" sx={{ mt: 1, fontSize: '0.875rem' }}>
            <Typography variant="body2">
              Selected language may not be optimal for this document type. Recommended: {currentDocOptions.recommendedLanguages.join(', ')}
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Processing Options */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: 'background.paper',
        color: 'text.primary'
      }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
          Processing Options
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'text.primary' }}>OCR Language</InputLabel>
              <Select
                value={options.language}
                label="OCR Language"
                onChange={(e) => setOptions(prev => ({ ...prev, language: e.target.value }))}
                sx={{ color: 'text.primary' }}
              >
                {getSupportedLanguages().map(lang => (
                  <MenuItem 
                    key={lang.code} 
                    value={lang.code} 
                    sx={{ 
                      color: currentDocOptions.recommendedLanguages.includes(lang.code) ? 'primary.main' : 'text.primary',
                      fontWeight: currentDocOptions.recommendedLanguages.includes(lang.code) ? 'bold' : 'normal'
                    }}
                  >
                    {lang.name}
                    {currentDocOptions.recommendedLanguages.includes(lang.code) && ' ✓'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedDocumentType === 'translation' && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'text.primary' }}>Target Language</InputLabel>
                <Select
                  value={options.targetLanguage}
                  label="Target Language"
                  onChange={(e) => setOptions(prev => ({ ...prev, targetLanguage: e.target.value }))}
                  sx={{ color: 'text.primary' }}
                >
                  {HybridTranslationService.getSupportedLanguages().map(lang => (
                    <MenuItem key={lang.code} value={lang.code} sx={{ color: 'text.primary' }}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'text.primary' }}>Output Format</InputLabel>
              <Select
                value={options.outputFormat}
                label="Output Format"
                onChange={(e) => setOptions(prev => ({ ...prev, outputFormat: e.target.value }))}
                sx={{ color: 'text.primary' }}
              >
                <MenuItem value="text" sx={{ color: 'text.primary' }}>Text</MenuItem>
                <MenuItem value="csv" sx={{ color: 'text.primary' }}>CSV</MenuItem>
                <MenuItem value="json" sx={{ color: 'text.primary' }}>JSON</MenuItem>
                <MenuItem value="pdf" sx={{ color: 'text.primary' }}>PDF</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={options.tableDetection}
                  onChange={(e) => setOptions(prev => ({ ...prev, tableDetection: e.target.checked }))}
                  disabled={!currentDocOptions.tableDetection}
                />
              }
              label={
                <Box>
                  <Typography sx={{ color: 'text.primary' }}>Table Detection</Typography>
                  {!currentDocOptions.tableDetection && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Disabled for {selectedDocumentType}
                    </Typography>
                  )}
                </Box>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={options.enhanceImages}
                  onChange={(e) => setOptions(prev => ({ ...prev, enhanceImages: e.target.checked }))}
                />
              }
              label={<Typography sx={{ color: 'text.primary' }}>Auto-Enhance</Typography>}
            />
          </Grid>

          {selectedDocumentType === 'translation' && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.autoTranslate}
                    onChange={(e) => setOptions(prev => ({ ...prev, autoTranslate: e.target.checked }))}
                  />
                }
                label={<Typography sx={{ color: 'text.primary' }}>Auto-Translate</Typography>}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* File Upload Section */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: 'background.paper',
        color: 'text.primary'
      }}>
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'background.paper',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
            Upload Documents
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select multiple JPG, PNG, or PDF files for batch processing
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
            Current mode: {DOCUMENT_TYPES[selectedDocumentType]?.name}
            {useSmartAnalytics && ' + Smart Analytics'}
          </Typography>
        </Box>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {files.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
                Selected Files ({files.length})
              </Typography>
              <Button size="small" onClick={clearAll} startIcon={<Delete />}>
                Clear All
              </Button>
            </Box>
            <List dense>
              {files.map((file, index) => (
                <ListItem 
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => removeFile(index)} size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={<Typography sx={{ color: 'text.primary' }}>{file.name}</Typography>}
                    secondary={
                      <Typography sx={{ color: 'text.secondary' }}>
                        {`${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type.split('/')[1].toUpperCase()}`}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>

      {/* Processing Controls */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={processFiles}
          disabled={isProcessing || files.length === 0 || analyticsProcessing}
          startIcon={<AutoFixHigh />}
          size="large"
          sx={{ minWidth: 200 }}
        >
          Process {files.length} Files
          {useSmartAnalytics && ' with Analytics'}
        </Button>
        <Button
          variant="outlined"
          onClick={clearAll}
          disabled={isProcessing}
          startIcon={<Delete />}
        >
          Clear All
        </Button>
      </Box>

      {/* Processing Progress */}
      {(isProcessing || analyticsProcessing || translationProgress > 0) && (
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          backgroundColor: 'background.paper',
          color: 'text.primary'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
            Processing Files...
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ flex: 1, color: 'text.primary' }}>
              {currentFile || 'Processing...'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />

          {analyticsProcessing && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Analytics sx={{ fontSize: 16, mr: 1, color: 'text.primary' }} />
                <Typography variant="body2" sx={{ flex: 1, color: 'text.primary' }}>
                  Smart Analytics Processing
                </Typography>
              </Box>
              <LinearProgress 
                sx={{ height: 6, borderRadius: 3 }}
                color="secondary"
              />
            </Box>
          )}

          {selectedDocumentType === 'translation' && translationProgress > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ color: 'text.primary' }}>
                Translation Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={translationProgress} 
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <Paper sx={{ 
          p: 3,
          backgroundColor: 'background.paper',
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              Processing Results ({results.length} files)
              {useSmartAnalytics && (
                <Chip 
                  label="Smart Analytics" 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={exportAllResults} variant="outlined" startIcon={<Download />}>
                Export All
              </Button>
              {useSmartAnalytics && (
                <Button onClick={() => navigateToAnalytics()} variant="contained" startIcon={<Analytics />}>
                  Analytics Dashboard
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            {results.map((result, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ backgroundColor: 'background.paper' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {result.recognized ? (
                        <CheckCircle color="success" sx={{ mr: 1 }} />
                      ) : (
                        <ErrorIcon color="error" sx={{ mr: 1 }} />
                      )}
                      <Typography variant="subtitle1" sx={{ flex: 1, color: 'text.primary' }}>
                        {result.fileName}
                      </Typography>
                      
                      {result.smartProcessed && (
                        <Tooltip title="Smart Analytics Processed - View Insights">
                          <Chip 
                            label="Analytics Ready" 
                            color="primary" 
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        </Tooltip>
                      )}
                      <Chip 
                        label={DOCUMENT_TYPES[result.documentType]?.name || result.documentType}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      
                      <Chip 
                        label={`${Math.round(result.confidence)}%`}
                        color={result.confidence > 80 ? 'success' : result.confidence > 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>

                    {/* Smart Analytics Status */}
                    {result.smartProcessed && result.extraction && (
                      <Alert 
                        severity="success"
                        sx={{ 
                          mb: 2,
                          backgroundColor: 'success.main',
                          color: 'success.contrastText'
                        }}
                        action={
                          <Button 
                            color="inherit" 
                            size="small"
                            onClick={() => navigateToAnalytics()}
                            startIcon={<Analytics />}
                          >
                            View Analytics
                          </Button>
                        }
                      >
                        <Typography variant="subtitle2">
                          ✅ Smart Analytics Complete
                        </Typography>
                        <Typography variant="body2">
                          Extracted {result.extraction.extracted.dates.length} dates, 
                          {result.extraction.extracted.money.length} amounts, 
                          and organized text for easy copying.
                        </Typography>
                      </Alert>
                    )}

                    {/* Display smart extraction results */}
                    {result.smartProcessed && result.extraction && (
                      <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: 1,
                        border: '1px solid #e0e0e0'
                      }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ 
                          color: '#1976d2', 
                          fontWeight: 600, 
                          mb: 2,
                          fontSize: '1.1rem'
                        }}>
                          📝 Enhanced Text View
                        </Typography>
                        <SmartResults extraction={result.extraction} />
                      </Box>
                    )}

                    {/* Original OCR Text */}
                    {result.text && (
                      <Box sx={{ mb: 2, mt: result.smartProcessed ? 2 : 0 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.primary' }}>
                          Original OCR Text:
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: '#f5f5f5',
                          color: '#1976d2',
                          borderRadius: 1,
                          maxHeight: '200px', 
                          overflow: 'auto',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          border: '1px solid #e0e0e0'
                        }}>
                          {result.text.length > 500 ? result.text.substring(0, 500) + '...' : result.text}
                        </Box>
                      </Box>
                    )}

                    {/* Translation Results */}
                    {result.translatedText && (
                      <Alert severity="info" sx={{ 
                        mb: 2,
                        backgroundColor: 'info.main',
                        color: 'info.contrastText'
                      }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Translation Available
                        </Typography>
                        <Typography variant="body2">
                          {result.translatedText.length > 200 
                            ? result.translatedText.substring(0, 200) + '...' 
                            : result.translatedText}
                        </Typography>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      {results.length > 1 && (
                        <Button 
                          size="small" 
                          startIcon={<Edit />}
                          onClick={handleMergeAndEditAll}
                          variant="contained"
                          color="secondary"
                        >
                          Merge & Edit All
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleEditText(result)}
                      >
                        Edit Text
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<PictureAsPdf />}
                        onClick={() => handleEditPDF(result)}
                      >
                        Edit PDF
                      </Button>
                      {result.smartProcessed && (
                        <Button 
                          size="small" 
                          startIcon={<Analytics />}
                          onClick={() => navigateToAnalytics()}
                          variant="outlined"
                          color="secondary"
                        >
                          View Analytics Dashboard
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        startIcon={<Download />}
                        onClick={() => exportSingleResult(result, 'text')}
                      >
                        Export Text
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<Download />}
                        onClick={() => exportSingleResult(result, 'json')}
                      >
                        Export JSON
                      </Button>
                    </Box>

                    {result.error && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Error: {result.error}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
      
      {showEditorChoice && (
        <Dialog
          open={showEditorChoice}
          onClose={() => {
            setShowEditorChoice(false);
            setPendingMergedResult(null);
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Choose Editor</DialogTitle>
          <DialogContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
              How would you like to edit the {results.length} merged documents?
            </Typography>
            
            <Grid container spacing={3}>
              {/* Text Editor Option */}
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid #2196F3',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      backgroundColor: '#f0f7ff'
                    }
                  }}
                  onClick={() => {
                    if (pendingMergedResult?.text) {
                      goToTextEditor(pendingMergedResult.text, 'merged');
                    }
                    setShowEditorChoice(false);
                    setPendingMergedResult(null);
                  }}
                >
                  <Edit sx={{ fontSize: 48, color: '#2196F3', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 600, mb: 1 }}>
                    Text Editor
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Edit as plain text with formatting options
                  </Typography>
                  <Chip 
                    label="Recommended for text editing" 
                    size="small" 
                    color="primary"
                    sx={{ mt: 2 }}
                  />
                </Card>
              </Grid>
            
              {/* PDF Editor Option */}
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid #f44336',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      backgroundColor: '#fff0f0'
                    }
                  }}
                  onClick={() => {
                    if (pendingMergedResult?.text) {
                      goToPDFEditor(pendingMergedResult.text, 'merged');
                    }
                    setShowEditorChoice(false);
                    setPendingMergedResult(null);
                  }}
                >
                  <PictureAsPdf sx={{ fontSize: 48, color: '#f44336', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 600, mb: 1 }}>
                    PDF Editor
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Design and layout with visual elements
                  </Typography>
                  <Chip 
                    label="For design & layout" 
                    size="small" 
                    color="error"
                    sx={{ mt: 2 }}
                  />
                </Card>
              </Grid>
            </Grid>
          
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Both editors support merged documents. Changes will be saved back to individual files.
              </Typography>
            </Alert>
          </DialogContent>
        
          <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
            <Button 
              onClick={() => {
                setShowEditorChoice(false);
                setPendingMergedResult(null);
              }}
              variant="outlined"
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// Helper functions for export
const convertToCSV = (results) => {
  const headers = ['File Name', 'Document Type', 'Text', 'Confidence', 'Status', 'Timestamp', 'Smart Processed'];
  const rows = results.map(result => [
    `"${result.fileName}"`,
    `"${result.documentType}"`,
    `"${result.text.replace(/"/g, '""')}"`,
    result.confidence,
    result.recognized ? 'Success' : 'Failed',
    `"${result.timestamp}"`,
    result.smartProcessed ? 'Yes' : 'No'
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
};

const convertToText = (results) => {
  return results.map(result => 
    `File: ${result.fileName}\nType: ${result.documentType}\nConfidence: ${result.confidence}%\nSmart Processed: ${result.smartProcessed ? 'Yes' : 'No'}\n\n${result.text}\n\n${'='.repeat(50)}\n`
  ).join('\n');
};

const exportToPDF = (results) => {
  console.log('Exporting to PDF:', results);
  alert('PDF export functionality would be implemented here with jsPDF integration');
};

export default AdvancedOCR;