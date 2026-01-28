import React, { useState, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, LinearProgress,
  Chip, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Snackbar, Alert, Select, MenuItem, 
  FormControl, InputLabel, Switch, FormControlLabel, Tooltip
} from '@mui/material';
import {
  CloudUpload, Download, ContentCopy, TableChart,
  Close, CameraAlt, NavigateBefore, NavigateNext, Translate, Info
} from '@mui/icons-material';
import OCREngine from '../services/ocrEngine';
import TranslationService from '../services/hybridTranslationService';
import { preprocessImage, convertPDFToImage, validateFile } from '../utils/imageProcessing';
import { tableToCSV, extractStructuredData } from '../utils/tableDetection';
import { jsPDF } from 'jspdf';

const OCRScanner = () => {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [tableViewOpen, setTableViewOpen] = useState(false);
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);

  // Auto-translate state
  const [autoTranslate, setAutoTranslate] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Language states
  const [selectedLanguage, setSelectedLanguage] = useState('eng');
  const [translationLanguage, setTranslationLanguage] = useState('en');
  const [translatedText, setTranslatedText] = useState('');

  // Other states
  const [allProcessedImages, setAllProcessedImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);

  // Show notification function
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // OCR Language options (for text recognition)
  const ocrLanguageOptions = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'chi_sim', name: 'Chinese Simplified' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
    { code: 'ces', name: 'Czech' }
  ];

  // Translation language options
  const translationLanguageOptions = TranslationService.getSupportedLanguages();

  // Translation function for given text
  const translateGivenText = useCallback(async (text) => {
    if (!text) {
      showNotification('No text available for translation', 'warning');
      return '';
    }

    try {
      setIsTranslating(true);
      showNotification('Translating text...', 'info');

      const translated = await TranslationService.translateText(
        text, 
        translationLanguage,
        'auto' // auto-detect source language
      );

      showNotification(`Text translated to ${translationLanguageOptions.find(lang => lang.code === translationLanguage)?.name || translationLanguage}`, 'success');
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      showNotification(`Translation failed: ${error.message}`, 'error');
      return '';
    } finally {
      setIsTranslating(false);
    }
  }, [translationLanguage, showNotification, translationLanguageOptions]);

  // Manual translation function
  const translateText = useCallback(async () => {
    if (!result?.text) {
      showNotification('No text available for translation', 'warning');
      return;
    }

    const translated = await translateGivenText(result.text);
    if (translated) {
      setTranslatedText(translated);
    }
  }, [result, translateGivenText, showNotification]);

  // Copy translated text function
  const copyTranslatedText = useCallback(async () => {
    if (translatedText) {
      try {
        await navigator.clipboard.writeText(translatedText);
        showNotification('Translated text copied to clipboard!', 'success');
      } catch (error) {
        console.log(error);
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = translatedText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Translated text copied to clipboard!', 'success');
      }
    }
  }, [translatedText, showNotification]);

  // Updated OCR processing function with auto-translation
  const processMultipleImagesWithOCR = useCallback(async (images) => {
    if (!images || images.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setTranslatedText(''); // Clear previous translation

    const progressHandler = (message) => {
      console.log('OCR Progress:', message);
      if (message.status === 'recognizing text') {
        setProgress(Math.round(message.progress * 100));
      }
    };

    OCREngine.onProgress(progressHandler);

    try {
      console.log(`🚀 Starting OCR process for ${images.length} pages in ${selectedLanguage}...`);
      
      const allResults = [];
      let combinedText = '';
      let totalConfidence = 0;

      // Set OCR language before processing
      await OCREngine.setLanguage(selectedLanguage);

      for (let i = 0; i < images.length; i++) {
        console.log(`📄 Processing page ${i + 1}/${images.length}`);
        
        setProgress((i / images.length) * 80);
        
        const imageData = images[i].dataUrl;
        const ocrResult = await OCREngine.recognizeText(imageData, {
          preprocess: !images[i].isPDFConverted,
          language: selectedLanguage
        });
        
        const pageResult = {
          ...ocrResult,
          pageNumber: images[i].pageNumber || i + 1,
          totalPages: images.length
        };
        
        allResults.push(pageResult);
        
        if (ocrResult.text) {
          combinedText += `--- Page ${i + 1} ---\n${ocrResult.text}\n\n`;
          totalConfidence += ocrResult.confidence;
        }
        
        setCurrentPage(i);
      }

      const averageConfidence = allResults.length > 0 ? totalConfidence / allResults.length : 0;

      const combinedResult = {
        text: combinedText,
        confidence: averageConfidence,
        pages: allResults,
        recognized: averageConfidence > 0 && combinedText.length > 0,
        totalPages: images.length,
        timestamp: new Date().toISOString(),
        language: selectedLanguage
      };

      setResult(combinedResult);

      // Auto-translate if enabled
      if (combinedResult.text && autoTranslate) {
        const translated = await translateGivenText(combinedResult.text);
        if (translated) {
          setTranslatedText(translated);
        }
      }

      if (combinedResult.text) {
        const structured = extractStructuredData(combinedText);
        setExtractedData(structured);
        
        showNotification(`Successfully extracted text from ${images.length} page(s) with ${Math.round(averageConfidence)}% confidence`, 'success');
      } else {
        showNotification('No text could be extracted from the document', 'warning');
      }

    } catch (error) {
      console.error('Multi-page OCR Processing error:', error);
      showNotification(`OCR processing failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      OCREngine.offProgress(progressHandler);
    }
  }, [selectedLanguage, showNotification, autoTranslate, translateGivenText]);

  const processCapturedImage = useCallback(async (imageData) => {
    try {
      setIsProcessing(true);
      setProgress(30);
      
      // Light processing for camera images
      const processedImage = await preprocessImage(imageData, {
        autoEnhance: true,
        enhanceContrast: true,
        documentMode: true, // Apply document processing for camera scans
        removeNoise: true,
        sharpness: 0.3,
        grayscale: true,
        format: 'png',
        quality: 1.0
      });
      
      setProgress(70);
      
      const processedImages = [{
        dataUrl: processedImage,
        pageNumber: 1,
        isPDFConverted: false
      }];
      
      setAllProcessedImages(processedImages);
      setCurrentPage(0);
      
      // Process with selected language - this will now auto-translate if enabled
      await processMultipleImagesWithOCR(processedImages);
      
    } catch (error) {
      console.error('Camera image processing error:', error);
      showNotification(`Failed to process captured image: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [processMultipleImagesWithOCR, showNotification]);

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        showNotification('Camera not available on this device. Please use file upload instead.', 'warning');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setStream(mediaStream);
      setCameraOpen(true);
    } catch (error) {
      console.error('Camera error:', error);
      setHasCamera(false);
      showNotification('Cannot access camera. Please check permissions or use file upload instead.', 'error');
    }
  }, [showNotification]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!stream) return;
    
    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/png');
    
    // Process the captured image
    processCapturedImage(imageData);
    stopCamera();
  }, [stream, stopCamera, processCapturedImage]);

  // File upload handler to process all PDF pages
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateFile(file);
      setIsProcessing(true);
      setProgress(10);

      let processedImages = [];
      
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file...');
        // Convert ALL pages by passing 'all' as pageNumber
        const pdfPages = await convertPDFToImage(file, 'all');
        if (pdfPages.length === 0) {
          throw new Error('No pages found in PDF');
        }
        
        console.log(`📑 PDF has ${pdfPages.length} pages, processing all...`);
        setProgress(30);
        
        // Process each page
        for (let i = 0; i < pdfPages.length; i++) {
          const page = pdfPages[i];
          console.log(`🔄 Processing page ${i + 1}/${pdfPages.length}`);
          
          // Update progress for each page
          setProgress(30 + (i / pdfPages.length) * 40);
          
          // Use the PDF image directly without additional processing
          processedImages.push({
            dataUrl: page.dataUrl,
            pageNumber: page.pageNumber,
            width: page.width,
            height: page.height,
            isPDFConverted: true
          });
        }
        
        console.log(`✅ Processed ${processedImages.length} PDF pages`);
        
      } else {
        console.log('🖼️ Processing image file...');
        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setProgress(50);
        
        // For regular images, use lighter processing
        const processedImage = await preprocessImage(imageData, {
          autoEnhance: true,
          enhanceContrast: false, // Disable contrast enhancement for regular images
          documentMode: false,    // Disable document mode for regular images
          removeNoise: true,
          sharpness: 0.1,         // Reduce sharpness
          grayscale: false,       // Keep color for regular images
          format: 'png',
          quality: 1.0,
          brightness: 1.0,        // Ensure normal brightness
          preserveOriginal: true  // Add this flag if your preprocessImage supports it
        });
        
        processedImages.push({
          dataUrl: processedImage,
          pageNumber: 1,
          isPDFConverted: false
        });
      }
      
      setProgress(80);
      
      // Store all processed images in state
      setAllProcessedImages(processedImages);
      setCurrentPage(0);
      
      // Process all images with OCR
      await processMultipleImagesWithOCR(processedImages);
      
    } catch (error) {
      console.error('File upload error:', error);
      showNotification(`File processing error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [processMultipleImagesWithOCR, showNotification]);

  const copyToClipboard = useCallback(async () => {
    if (result?.text) {
      try {
        await navigator.clipboard.writeText(result.text);
        showNotification('Text copied to clipboard!', 'success');
      } catch (error) {
        console.log(error);
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = result.text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Text copied to clipboard!', 'success');
      }
    }
  }, [result, showNotification]);

  const downloadText = useCallback(() => {
    if (!result?.text) return;
    
    const blob = new Blob([result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-text-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Text file downloaded successfully!', 'success');
  }, [result, showNotification]);

  // Updated Save as PDF function
  const saveAsPDF = useCallback(async () => {
    if (!result?.text) return;
    
    try {
      setIsProcessing(true);
      
      // Create a new PDF document
      const pdf = new jsPDF();
      
      // Set font and margins
      pdf.setFont('helvetica');
      pdf.setFontSize(10);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 5;
      const maxLineWidth = pageWidth - (margin * 2);
      
      // Split text into lines that fit the page width
      const splitText = (text, maxWidth) => {
        const lines = [];
        const paragraphs = text.split('\n');
        
        paragraphs.forEach(paragraph => {
          if (paragraph.trim() === '') {
            lines.push('');
            return;
          }
          
          const words = paragraph.split(' ');
          let currentLine = '';
          
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = pdf.getTextWidth(testLine);
            
            if (testWidth > maxWidth && currentLine !== '') {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine) {
            lines.push(currentLine);
          }
        });
        
        return lines;
      };
      
      const lines = splitText(result.text, maxLineWidth);
      
      let yPosition = margin;
      
      // Add each line to the PDF
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Add the line
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
        
        // Add extra space for empty lines (page separators)
        if (line.includes('--- Page')) {
          yPosition += lineHeight;
        }
      }
      
      // Save the PDF
      pdf.save(`extracted-text-${Date.now()}.pdf`);
      showNotification('PDF file saved successfully!', 'success');
      
    } catch (error) {
      console.error('PDF creation error:', error);
      showNotification(`Failed to create PDF: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [result, showNotification]);

  const downloadTableCSV = useCallback((table, index) => {
    const csv = tableToCSV(table.data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table-${index + 1}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(`Table ${index + 1} CSV downloaded!`, 'success');
  }, [showNotification]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } };
      handleFileUpload(event);
    }
  }, [handleFileUpload]);

  // Clear all states
  const clearResults = useCallback(() => {
    setResult(null);
    setExtractedData(null);
    setAllProcessedImages([]);
    setCurrentPage(0);
    setTranslatedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showNotification('Results cleared', 'info');
  }, [showNotification]);

  const openTableDialog = useCallback((tableIndex) => {
    setSelectedTableIndex(tableIndex);
    setTableViewOpen(true);
  }, []);

  const closeTableDialog = useCallback(() => {
    setTableViewOpen(false);
  }, []);

  const getSelectedTableCSV = useCallback(() => {
    if (!extractedData?.tables?.[selectedTableIndex]) return '';
    return tableToCSV(extractedData.tables[selectedTableIndex].data);
  }, [extractedData, selectedTableIndex]);

  const downloadSelectedTableCSV = useCallback(() => {
    if (!extractedData?.tables?.[selectedTableIndex]) return;
    downloadTableCSV(extractedData.tables[selectedTableIndex], selectedTableIndex);
  }, [extractedData, selectedTableIndex, downloadTableCSV]);

  return (
    <Box>
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Quick Text Scan
      </Typography>

      {/* Upload Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Upload Document or Image
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports: JPG, PNG, PDF - Drag & drop or click to upload
          </Typography>
        </Box>

        <input
          type="file"
          ref={fileInputRef}
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Language Selection */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>OCR Language (Text Recognition)</InputLabel>
              <Select
                value={selectedLanguage}
                label="OCR Language (Text Recognition)"
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {ocrLanguageOptions.map(lang => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Select the language of the document for better text recognition
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Translation Language</InputLabel>
              <Select
                value={translationLanguage}
                label="Translation Language"
                onChange={(e) => setTranslationLanguage(e.target.value)}
              >
                {translationLanguageOptions.map(lang => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Translate extracted text to this language
            </Typography>
          </Grid>
        </Grid>

        {/* Auto-Translate Toggle */}
        <Box sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-translate after OCR"
          />
          <Tooltip title="Automatically translate extracted text to selected translation language">
            <Info fontSize="small" color="action" />
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={startCamera}
            disabled={!hasCamera}
          >
            {hasCamera ? 'Scan with Camera' : 'Camera Not Available'}
          </Button>
          {result && (
            <Button
              variant="outlined"
              color="error"
              onClick={clearResults}
            >
              Clear Results
            </Button>
          )}
        </Box>
      </Paper>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onClose={stopCamera} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Camera Scan - Point at Document
            </Typography>
            <IconButton onClick={stopCamera}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {stream && (
              <video
                id="camera-preview"
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
                ref={video => {
                  if (video) video.srcObject = stream;
                }}
              />
            )}
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Ensure the document is well-lit and clearly visible in the frame
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopCamera}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={captureImage}
            startIcon={<CameraAlt />}
          >
            Capture Image
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processing Progress */}
      {isProcessing && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Processing Document...
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {progress < 50 ? 'Preprocessing image...' : 'Extracting text...'}
            </Typography>
            <Typography variant="body2">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Paper>
      )}

      {/* Image Preview with Multi-page Support */}
      {allProcessedImages.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Document Preview {allProcessedImages.length > 1 && `(${allProcessedImages.length} pages)`}
            </Typography>
            {allProcessedImages.length > 1 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<NavigateBefore />}
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Typography variant="body2">
                  Page {currentPage + 1} of {allProcessedImages.length}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<NavigateNext />}
                  disabled={currentPage === allProcessedImages.length - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <img 
              src={allProcessedImages[currentPage]?.dataUrl} 
              alt={`Page ${currentPage + 1}`} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }} 
            />
          </Box>
        </Paper>
      )}

      {/* Results Section with Translation */}
      {result && (
        <Grid container spacing={3}>
          {/* Extracted Text */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Extracted Text {result.totalPages > 1 && `(${result.totalPages} pages)`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={`${Math.round(result.confidence)}% confidence`}
                    color={result.confidence > 80 ? 'success' : result.confidence > 60 ? 'warning' : 'error'}
                    size="small"
                  />
                  {result.totalPages > 1 && (
                    <Chip 
                      label={`${result.totalPages} pages`}
                      color="primary"
                      size="small"
                    />
                  )}
                  <Chip 
                    label={ocrLanguageOptions.find(lang => lang.code === result.language)?.name || result.language}
                    color="info"
                    size="small"
                  />
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={8}
                value={result.text || 'No text could be extracted from the document.'}
                InputProps={{ readOnly: true }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }
                }}
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Button
                  startIcon={<ContentCopy />}
                  onClick={copyToClipboard}
                  variant="outlined"
                  size="small"
                  disabled={!result.text}
                >
                  Copy Text
                </Button>
                <Button
                  startIcon={<Download />}
                  onClick={downloadText}
                  variant="outlined"
                  size="small"
                  disabled={!result.text}
                >
                  Download Text
                </Button>
                <Button
                  startIcon={<Download />}
                  onClick={saveAsPDF}
                  variant="outlined"
                  size="small"
                  disabled={!result.text}
                >
                  Save as PDF
                </Button>
                <Button
                  startIcon={<Translate />}
                  onClick={translateText}
                  variant="contained"
                  size="small"
                  disabled={!result.text || isTranslating}
                >
                  {isTranslating ? 'Translating...' : autoTranslate ? 'Re-Translate' : 'Translate'}
                </Button>
              </Box>

              {/* Translated Text Section */}
              {translatedText && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Translate />
                    {autoTranslate ? 'Auto-' : ''}Translated Text ({translationLanguageOptions.find(lang => lang.code === translationLanguage)?.name || translationLanguage})
                    {autoTranslate && (
                      <Chip 
                        label="Auto"
                        color="success"
                        size="small"
                      />
                    )}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    value={translatedText}
                    InputProps={{ readOnly: true }}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }
                    }}
                  />

                  <Button
                    startIcon={<ContentCopy />}
                    onClick={copyTranslatedText}
                    variant="outlined"
                    size="small"
                  >
                    Copy Translated Text
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Structured Data & Tables */}
          <Grid item xs={12} md={6}>
            {extractedData?.tables && extractedData.tables.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TableChart />
                  Detected Tables ({extractedData.tables.length})
                </Typography>
                
                {extractedData.tables.slice(0, 3).map((table, index) => (
                  <Card 
                    key={index} 
                    sx={{ 
                      mb: 2, 
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 2,
                        backgroundColor: 'action.hover'
                      }
                    }} 
                    onClick={() => openTableDialog(index)}
                  >
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Table {index + 1} - {table.rowCount} rows × {table.columnCount} columns
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Confidence: {Math.round(table.confidence * 100)}%
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Download />}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadTableCSV(table, index);
                          }}
                        >
                          Export CSV
                        </Button>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTableDialog(index);
                          }}
                        >
                          View Data
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            )}

            {/* Extracted Information */}
            {extractedData?.structuredData && Object.keys(extractedData.structuredData).length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Extracted Information
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(extractedData.structuredData).map(([key, value]) => (
                    <Grid item xs={12} key={key}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="body2" fontWeight="medium">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* Table View Dialog */}
      <Dialog open={tableViewOpen} onClose={closeTableDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Table {selectedTableIndex + 1} Data
            </Typography>
            <IconButton onClick={closeTableDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ overflow: 'auto', maxHeight: '60vh' }}>
            <TextField
              fullWidth
              multiline
              rows={15}
              value={getSelectedTableCSV()}
              InputProps={{ 
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
              }}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTableDialog}>Close</Button>
          <Button 
            variant="contained"
            onClick={downloadSelectedTableCSV}
            startIcon={<Download />}
          >
            Download CSV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OCRScanner;