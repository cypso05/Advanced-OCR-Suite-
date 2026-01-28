// DocumentScanner.jsx - PRODUCTION READY WITH COMPLETE CAMERA SUPPORT & ENHANCED STATE MANAGEMENT
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Slider, IconButton, Chip, LinearProgress, Alert,
  Tabs, Tab, AppBar, Toolbar, Fab, Snackbar, Fade, CircularProgress, 
} from '@mui/material';
import {
  CameraAlt, CloudUpload, Edit, Download, Share,
  Filter, Close, Check,
  FlashOn, FlashOff, ZoomOutMap, NavigateBefore, NavigateNext,
  Camera, Stop, Image, DocumentScanner as DocumentScannerIcon
} from '@mui/icons-material';
import { 
  preprocessImage, downloadImage, exportToPDF, editImage, 
  convertPDFToImage, calculateImageQuality, 
  getImageStats, createScanPresets, validateFile 
} from '../utils/imageProcessing';

// TabPanel component
const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`scanner-tabpanel-${index}`}
    aria-labelledby={`scanner-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
  </div>
);

const DocumentScanner = () => {
  const fileInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDocumentType, setSelectedDocumentType] = useState('document');
  const [currentImage, setCurrentImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Enhanced state management for edited pages
  const [editedPages, setEditedPages] = useState({});
  const [exportPageCount, setExportPageCount] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  
  const [imageQuality, setImageQuality] = useState(null);
  const [imageStats, setImageStats] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Multi-page state
  const [allPages, setAllPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isMultiPage, setIsMultiPage] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

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

  const documentTypes = useMemo(() => [
    { 
      id: 'document', 
      name: 'Document', 
      icon: '📄', 
      description: 'Scan documents, letters, and forms',
      preset: { ...createScanPresets.document, autoEnhance: true }
    },
    { 
      id: 'receipt', 
      name: 'Receipt', 
      icon: '🧾', 
      description: 'Extract totals, dates, and items from receipts',
      preset: { ...createScanPresets.receipt, autoEnhance: true }
    },
    { 
      id: 'business_card', 
      name: 'Business Card', 
      icon: '📇', 
      description: 'Capture contact information automatically',
      preset: { ...createScanPresets.business_card, autoEnhance: true }
    },
    { 
      id: 'id_card', 
      name: 'ID Card', 
      icon: '🆔', 
      description: 'Scan ID cards and official documents',
      preset: { ...createScanPresets.id_card, autoEnhance: true }
    },
    { 
      id: 'photo', 
      name: 'Photo', 
      icon: '🖼️', 
      description: 'Optimize photos and images',
      preset: { ...createScanPresets.photo, autoEnhance: false }
    }
  ], []);

  // Image edits state
  const [imageEdits, setImageEdits] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    gamma: 1,
    exposure: 0
  });

  // Enhanced page navigation functions with edited pages support
  const goToNextPage = useCallback(() => {
    if (currentPageIndex < allPages.length - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      
      // Use edited version if available, otherwise use original
      const nextImage = editedPages[nextIndex] || allPages[nextIndex].dataUrl;
      setCurrentImage(nextImage);
      setOriginalImage(allPages[nextIndex].dataUrl);
      setPreviewImage(nextImage);
      
      // Recalculate quality for new page
      calculateImageQuality(nextImage).then(setImageQuality).catch(console.warn);
      getImageStats(nextImage).then(setImageStats).catch(console.warn);
    }
  }, [allPages, currentPageIndex, editedPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      
      // Use edited version if available, otherwise use original
      const prevImage = editedPages[prevIndex] || allPages[prevIndex].dataUrl;
      setCurrentImage(prevImage);
      setOriginalImage(allPages[prevIndex].dataUrl);
      setPreviewImage(prevImage);
      
      // Recalculate quality for new page
      calculateImageQuality(prevImage).then(setImageQuality).catch(console.warn);
      getImageStats(prevImage).then(setImageStats).catch(console.warn);
    }
  }, [allPages, currentPageIndex, editedPages]);

  // Smart page merging function
// FIXED PAGE MERGING FUNCTIONS
const mergePagesForExport = useCallback(async (pages, targetPageCount) => {
  if (targetPageCount >= pages.length) {
    return pages;
  }

  try {
    console.log(`🔄 Merging ${pages.length} pages into ${targetPageCount} pages`);
    const mergedPages = [];
    const pagesPerMergedPage = Math.ceil(pages.length / targetPageCount);
    
    for (let i = 0; i < targetPageCount; i++) {
      const startIndex = i * pagesPerMergedPage;
      const endIndex = Math.min(startIndex + pagesPerMergedPage, pages.length);
      const pagesToMerge = pages.slice(startIndex, endIndex);
      
      if (pagesToMerge.length === 1) {
        mergedPages.push(pagesToMerge[0]);
      } else {
        // ACTUAL IMAGE MERGING - Vertical stacking
        const mergedImage = await mergeImagesVertically(pagesToMerge);
        mergedPages.push({
          ...pagesToMerge[0],
          dataUrl: mergedImage,
          isMerged: true,
          originalPages: pagesToMerge.length,
          mergedIndex: i
        });
      }
    }
    
    console.log(`✅ Successfully created ${mergedPages.length} merged pages`);
    return mergedPages;
  } catch (error) {
    console.error('Page merging error:', error);
    throw new Error('Failed to merge pages. Please try exporting with original page count.');
  }
}, []);

// FIXED IMAGE MERGING FUNCTION - Uses window.Image
// IMPROVED IMAGE MERGING FUNCTION - BETTER QUALITY & LEGIBILITY
const mergeImagesVertically = async (pages) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined') {
        reject(new Error('Image merging only available in browser environment'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load all images first
      const images = [];
      let loadedCount = 0;
      let totalHeight = 0;
      let maxWidth = 0;
      
      // Calculate optimal dimensions first
      pages.forEach((page, index) => {
        const img = new window.Image();
        img.onload = () => {
          loadedCount++;
          
          // Use original width for better legibility, but cap at reasonable maximum
          const optimalWidth = Math.min(img.width, 1200); // Cap at 1200px for legibility
          maxWidth = Math.max(maxWidth, optimalWidth);
          
          // Calculate proportional height
          const scaleFactor = optimalWidth / img.width;
          const proportionalHeight = img.height * scaleFactor;
          totalHeight += proportionalHeight;
          
          if (loadedCount === pages.length) {
            // Add spacing between pages (20px)
            totalHeight += (pages.length - 1) * 20;
            
            // Set canvas dimensions
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            
            // Fill background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw images with proper scaling
            let currentY = 0;
            images.forEach((loadedImg) => { // Removed unused imgIndex parameter
              const imgOptimalWidth = Math.min(loadedImg.width, 1200);
              const imgScaleFactor = imgOptimalWidth / loadedImg.width;
              const imgScaledHeight = loadedImg.height * imgScaleFactor;
              const imgScaledWidth = imgOptimalWidth;
              
              // Center the image horizontally
              const x = (maxWidth - imgScaledWidth) / 2;
              
              // Use high-quality image rendering
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(loadedImg, x, currentY, imgScaledWidth, imgScaledHeight);
              
              currentY += imgScaledHeight + 20; // Add spacing between pages
            });
            
            // Use PNG format for better quality with text
            const mergedDataUrl = canvas.toDataURL('image/png', 1.0);
            console.log(`✅ Created merged image: ${canvas.width}x${canvas.height}px`);
            resolve(mergedDataUrl);
          }
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to load image ${index + 1} for merging`));
        };
        
        img.src = page.dataUrl;
        images.push(img);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

  // Enhanced PDF export with page count selection
  const handleExportPDF = useCallback(async () => {
    if (!currentImage && allPages.length === 0) return;
    
    // Open export dialog for page count selection
    setExportDialogOpen(true);
  }, [currentImage, allPages.length]);

  // Actual PDF export function
// ENHANCED PDF EXPORT WITH ROBUST ERROR HANDLING
const performPDFExport = useCallback(async (targetPageCount = null) => {
  if (!allPages || allPages.length === 0) {
    showNotification('No pages available for export', 'error');
    return;
  }

  try {
    setIsProcessing(true);
    showNotification('Creating PDF document...', 'info');
    
    const docTypeName = documentTypes.find(doc => doc.id === selectedDocumentType)?.name || 'document';
    const filename = `${docTypeName}-scan-${Date.now()}.pdf`;
    
    // Get the pages to export (use edited versions if available)
    const pagesToExport = allPages.map((page, index) => ({
      ...page,
      dataUrl: editedPages[index] || page.dataUrl
    }));
    
    console.log(`📑 Preparing ${pagesToExport.length} pages for export`);
    
    let finalPages = pagesToExport;
    
    // Apply page merging if target page count is specified and different
    if (targetPageCount && targetPageCount > 0 && targetPageCount !== pagesToExport.length) {
      if (targetPageCount > pagesToExport.length) {
        showNotification('Target page count cannot be greater than original page count', 'warning');
        targetPageCount = pagesToExport.length;
      } else {
        showNotification(`Merging ${pagesToExport.length} pages into ${targetPageCount} pages...`, 'info');
        try {
          finalPages = await mergePagesForExport(pagesToExport, targetPageCount);
        } catch (mergeError) {
          console.warn('Page merging failed, using original pages:', mergeError);
          showNotification('Page merging failed. Exporting original pages instead.', 'warning');
          finalPages = pagesToExport;
        }
      }
    }
    
    console.log(`📄 Exporting ${finalPages.length} pages to PDF`);
    await exportToPDF(finalPages, filename);
    
    const pageCount = finalPages.length > 1 ? ` with ${finalPages.length} pages` : '';
    showNotification(`PDF exported successfully${pageCount}`, 'success');
    setExportDialogOpen(false);
  } catch (error) {
    console.error('PDF export failed:', error);
    showNotification(`Export failed: ${error.message}`, 'error');
  } finally {
    setIsProcessing(false);
  }
}, [allPages, editedPages, selectedDocumentType, documentTypes, showNotification, mergePagesForExport]);


// ENHANCED DOWNLOAD WITH BACKWARD COMPATIBILITY
// ENHANCED DOWNLOAD WITH BETTER FORMAT FOR MERGED IMAGES
const handleDownload = useCallback(async (format = 'jpeg', targetPageCount = null) => {
  if (!currentImage && (!allPages || allPages.length === 0)) {
    showNotification('No images available for download', 'error');
    return;
  }
  
  try {
    setIsProcessing(true);
    const docTypeName = documentTypes.find(doc => doc.id === selectedDocumentType)?.name || 'document';
    
    // Use PNG format for merged images for better quality
    const finalFormat = (targetPageCount && targetPageCount < allPages.length) ? 'png' : format;
    
    // BACKWARD COMPATIBILITY: Single page download
    if (!targetPageCount || allPages.length === 1) {
      const filename = `${docTypeName}-scan-${Date.now()}`;
      const imageToDownload = editedPages[currentPageIndex] || currentImage;
      
      if (!imageToDownload) {
        throw new Error('No image available for download');
      }
      
      downloadImage(imageToDownload, filename, finalFormat);
      showNotification(`Downloaded as ${finalFormat.toUpperCase()}`, 'success');
      return;
    }
    
    // MULTI-PAGE WITH MERGING
    if (targetPageCount > allPages.length) {
      showNotification('Target page count cannot exceed original page count', 'warning');
      targetPageCount = allPages.length;
    }
    
    showNotification(`Processing ${allPages.length} pages...`, 'info');
    
    const pagesToExport = allPages.map((page, index) => ({
      ...page,
      dataUrl: editedPages[index] || page.dataUrl
    }));
    
    let pagesToDownload = pagesToExport;
    
    // Apply merging if requested and available
    if (targetPageCount && targetPageCount !== pagesToExport.length) {
      try {
        pagesToDownload = await mergePagesForExport(pagesToExport, targetPageCount);
        showNotification(`Successfully merged ${pagesToExport.length} pages into ${pagesToDownload.length} high-quality pages`, 'success');
      } catch (mergeError) {
        console.warn('Page merging failed, downloading original pages:', mergeError);
        showNotification('Page merging unavailable. Downloading original pages instead.', 'warning');
        pagesToDownload = pagesToExport;
      }
    }
    
    // Download each page
    pagesToDownload.forEach((page, index) => {
      const filename = `${docTypeName}-scan-${index + 1}-${Date.now()}`;
      downloadImage(page.dataUrl, filename, finalFormat);
    });
    
    showNotification(`Downloaded ${pagesToDownload.length} ${finalFormat.toUpperCase()} files`, 'success');
    
  } catch (error) {
    console.error('Download failed:', error);
    showNotification(`Download failed: ${error.message}`, 'error');
  } finally {
    setIsProcessing(false);
  }
}, [currentImage, allPages, editedPages, currentPageIndex, selectedDocumentType, documentTypes, showNotification, mergePagesForExport]);

  // Real-time preview with debouncing
  const generateRealTimePreview = useCallback(async (edits) => {
    if (!originalImage) return;
    
    try {
      setIsGeneratingPreview(true);
      
      const safeEdits = {
        brightness: Math.max(-0.15, Math.min(0.15, edits.brightness)),
        contrast: Math.max(-0.15, Math.min(0.15, edits.contrast)),
        saturation: Math.max(-0.2, Math.min(0.2, edits.saturation)),
        sharpness: Math.max(0, Math.min(0.2, edits.sharpness)),
        gamma: Math.max(0.8, Math.min(1.2, edits.gamma)),
        exposure: Math.max(-0.15, Math.min(0.15, edits.exposure))
      };
      
      const preview = await editImage(originalImage, safeEdits);
      setPreviewImage(preview);
    } catch (error) {
      console.error('Real-time preview error:', error);
      setPreviewImage(originalImage);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [originalImage]);

  // Handle edit changes with real-time preview
  const handleEditChange = useCallback((property, value) => {
    const newEdits = { ...imageEdits, [property]: value };
    setImageEdits(newEdits);
    
    setTimeout(() => {
      generateRealTimePreview(newEdits);
    }, 100);
  }, [imageEdits, generateRealTimePreview]);

  // Enhanced applyImageEdits function to save edits per page
// ENHANCED MANUAL ENHANCEMENT - APPLIES TO ALL PAGES
const applyImageEdits = useCallback(async () => {
  if (!originalImage || currentPageIndex === undefined) return;

  setIsProcessing(true);
  showNotification('Applying enhancements to all pages...', 'info');
  
  try {
    const updatedEditedPages = { ...editedPages };
    let processedCount = 0;

    // Apply same edits to all pages
    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i];
      const pageImage = editedPages[i] || page.dataUrl;
      
      try {
        const editedPageImage = await editImage(pageImage, imageEdits);
        updatedEditedPages[i] = editedPageImage;
        processedCount++;
        
        // Update progress
        setProgress((processedCount / allPages.length) * 100);
        
      } catch (error) {
        console.warn(`Failed to apply edits to page ${i + 1}:`, error);
        // Continue with other pages even if one fails
      }
    }

    // Update state with all edited pages
    setEditedPages(updatedEditedPages);
    
    // Update current display
    const currentEditedImage = updatedEditedPages[currentPageIndex];
    if (currentEditedImage) {
      setCurrentImage(currentEditedImage);
      setOriginalImage(currentEditedImage);
      setPreviewImage(currentEditedImage);
      
      try {
        const quality = await calculateImageQuality(currentEditedImage);
        const stats = await getImageStats(currentEditedImage);
        setImageQuality(quality);
        setImageStats(stats);
      } catch (error) {
        console.warn('Quality calculation failed:', error);
      }
    }
    
    setEditDialogOpen(false);
    showNotification(`Enhancements applied to ${processedCount} out of ${allPages.length} pages`, 'success');
  } catch (error) {
    console.error('Image editing error:', error);
    showNotification('Failed to apply enhancements to some pages. Try lighter settings.', 'error');
  } finally {
    setIsProcessing(false);
    setProgress(0);
  }
}, [originalImage, currentPageIndex, editedPages, allPages, imageEdits, showNotification]); // Removed previewImage dependency

  // Process captured image
  const processCapturedImage = useCallback(async (imageData) => {
    try {
      setIsProcessing(true);
      setProgress(30);
      
      const processedImage = await preprocessImage(imageData, {
        autoEnhance: true,
        enhanceContrast: true,
        documentMode: true,
        removeNoise: false,
        sharpness: 0.1,
        grayscale: false,
        format: 'png',
        quality: 0.9,
        brightness: 1.0
      });
      
      setCurrentImage(processedImage);
      setOriginalImage(processedImage);
      setPreviewImage(processedImage);
      setProgress(100);
      
      try {
        const quality = await calculateImageQuality(processedImage);
        const stats = await getImageStats(processedImage);
        setImageQuality(quality);
        setImageStats(stats);
      } catch (error) {
        console.warn('Quality calculation failed:', error);
      }
      
      setTimeout(() => {
        setActiveTab(2);
        showNotification('Image captured successfully. Ready for editing.', 'success');
      }, 500);
      
    } catch (error) {
      console.error('Camera image processing error:', error);
      showNotification(`Failed to process captured image: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [showNotification]);

  // COMPLETE CAMERA FUNCTIONS
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      showNotification('Camera activated successfully', 'success');
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraError(error.message);
      setHasCamera(false);
      
      let errorMessage = 'Unable to access camera. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please check camera permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this device.';
      } else {
        errorMessage += 'Please try file upload instead.';
      }
      
      showNotification(errorMessage, 'error');
    }
  }, [showNotification]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setFlashOn(false);
    setZoomLevel(1);
    showNotification('Camera turned off', 'info');
  }, [cameraStream, showNotification]);

  const captureImage = useCallback(() => {
    if (!cameraVideoRef.current || !cameraCanvasRef.current) return;

    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    processCapturedImage(imageData);
    stopCamera();
  }, [stopCamera, processCapturedImage]);

  // Handle multiple image uploads
  const handleMultipleImages = useCallback(async (files) => {
    try {
      showNotification(`Processing ${files.length} images...`, 'info');
      setIsProcessing(true);
      setProgress(0);
      
      const processedImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        validateFile(file);
        
        setProgress((i / files.length) * 80);
        
        if (file.type === 'application/pdf') {
          const pdfPages = await convertPDFToImage(file, 'all');
          pdfPages.forEach((page) => {
            processedImages.push({
              dataUrl: page.dataUrl,
              pageNumber: processedImages.length + 1,
              originalFilename: file.name,
              isPDFConverted: true,
              isFromBatch: true
            });
          });
        } else {
          const imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const processedImage = await preprocessImage(imageData, {
            autoEnhance: false,
            enhanceContrast: false,
            documentMode: false,
            removeNoise: false,
            sharpness: 0,
            grayscale: false,
            format: 'png',
            quality: 1.0,
            brightness: 1.0
          });
          
          processedImages.push({
            dataUrl: processedImage,
            pageNumber: processedImages.length + 1,
            originalFilename: file.name,
            isPDFConverted: false,
            isFromBatch: true
          });
        }
      }
      
      if (processedImages.length > 0) {
        setIsMultiPage(true);
        setAllPages(processedImages);
        setCurrentImage(processedImages[0].dataUrl);
        setOriginalImage(processedImages[0].dataUrl);
        setPreviewImage(processedImages[0].dataUrl);
        
        try {
          const quality = await calculateImageQuality(processedImages[0].dataUrl);
          const stats = await getImageStats(processedImages[0].dataUrl);
          setImageQuality(quality);
          setImageStats(stats);
        } catch (error) {
          console.warn('Quality calculation failed:', error);
        }
      }
      
      setProgress(100);
      
      setTimeout(() => {
        setActiveTab(2);
        showNotification(`Processed ${processedImages.length} pages. Ready for editing.`, 'success');
      }, 500);
      
    } catch (error) {
      console.error('Multiple image upload error:', error);
      showNotification(`Failed to process images: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [showNotification]);

  // File upload handler with multi-page support
  const handleFileUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      if (files.length > 1) {
        await handleMultipleImages(files);
        return;
      }

      const file = files[0];
      validateFile(file);
      
      let processedImages = [];
      
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file...');
        showNotification('Processing PDF document...', 'info');
        
        const pdfPages = await convertPDFToImage(file, 'all');
        if (pdfPages.length === 0) {
          throw new Error('No pages found in PDF');
        }
        
        console.log(`📑 PDF has ${pdfPages.length} pages, processing all...`);
        setProgress(30);
        
        for (let i = 0; i < pdfPages.length; i++) {
          const page = pdfPages[i];
          setProgress(30 + (i / pdfPages.length) * 40);
          
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
        
        const processedImage = await preprocessImage(imageData, {
          autoEnhance: false,
          enhanceContrast: false,
          documentMode: false,
          removeNoise: false,
          sharpness: 0,
          grayscale: false,
          format: 'png',
          quality: 1.0,
          brightness: 1.0,
          preserveColors: true
        });
        
        processedImages.push({
          dataUrl: processedImage,
          pageNumber: 1,
          isPDFConverted: false
        });
      }
      
      setProgress(80);
      
      if (processedImages.length > 0) {
        if (processedImages.length > 1) {
          setIsMultiPage(true);
          setAllPages(processedImages);
        }
        
        const firstImage = processedImages[0].dataUrl;
        setCurrentImage(firstImage);
        setOriginalImage(firstImage);
        setPreviewImage(firstImage);
        
        try {
          const quality = await calculateImageQuality(firstImage);
          const stats = await getImageStats(firstImage);
          setImageQuality(quality);
          setImageStats(stats);
        } catch (error) {
          console.warn('Quality calculation failed:', error);
        }
      }
      
      setProgress(100);
      
      setTimeout(() => {
        setActiveTab(2);
        const pageCount = processedImages.length > 1 ? ` (${processedImages.length} pages)` : '';
        showNotification(`File processed successfully${pageCount}. Ready for editing.`, 'success');
      }, 500);
      
    } catch (error) {
      console.error('File upload error:', error);
      showNotification(`Upload failed: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [showNotification, handleMultipleImages]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (files.length > 1) {
        handleMultipleImages(files);
      } else {
        const file = files[0];
        const event = { target: { files: [file] } };
        handleFileUpload(event);
      }
    }
  }, [handleFileUpload, handleMultipleImages]);

 // ENHANCED AUTO-ENHANCE - APPLIES TO ALL PAGES
const enhanceImage = useCallback(async () => {
  if (!currentImage && (!allPages || allPages.length === 0)) {
    showNotification('No images available for enhancement', 'error');
    return;
  }

  setIsProcessing(true);
  showNotification('Auto-enhancing all pages...', 'info');
  
  try {
    const docType = documentTypes.find(doc => doc.id === selectedDocumentType);
    const updatedEditedPages = { ...editedPages };
    let processedCount = 0;

    // Process all pages
    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i];
      const originalImageData = editedPages[i] || page.dataUrl;
      
      try {
        const enhancedImage = await preprocessImage(originalImageData, {
          ...docType?.preset,
          sharpness: Math.min(docType?.preset?.sharpness || 0.1, 0.15),
          removeNoise: false,
          autoEnhance: docType?.preset?.autoEnhance !== false,
          enhanceContrast: true,
          brightness: 1.0,
          format: 'png', // Use PNG for better quality
          quality: 1.0
        });
        
        updatedEditedPages[i] = enhancedImage;
        processedCount++;
        
        // Update progress
        setProgress((processedCount / allPages.length) * 100);
        
      } catch (error) {
        console.warn(`Failed to enhance page ${i + 1}:`, error);
        // Continue with other pages even if one fails
      }
    }

    // Update state with all enhanced pages
    setEditedPages(updatedEditedPages);
    
    // Update current display to show enhanced current page
    const currentEnhancedImage = updatedEditedPages[currentPageIndex];
    if (currentEnhancedImage) {
      setCurrentImage(currentEnhancedImage);
      setOriginalImage(currentEnhancedImage);
      setPreviewImage(currentEnhancedImage);
      
      try {
        const quality = await calculateImageQuality(currentEnhancedImage);
        const stats = await getImageStats(currentEnhancedImage);
        setImageQuality(quality);
        setImageStats(stats);
      } catch (error) {
        console.warn('Quality calculation failed:', error);
      }
    }
    
    showNotification(`Auto-enhanced ${processedCount} out of ${allPages.length} pages`, 'success');
  } catch (error) {
    console.error('Image enhancement error:', error);
    showNotification('Auto-enhancement failed for some pages', 'error');
  } finally {
    setIsProcessing(false);
    setProgress(0);
  }
}, [currentImage, allPages, editedPages, currentPageIndex, selectedDocumentType, documentTypes, showNotification]);

  // Reset functions
  const resetScanner = useCallback(() => {
    setCurrentImage(null);
    setOriginalImage(null);
    setPreviewImage(null);
    setImageQuality(null);
    setImageStats(null);
    setAllPages([]);
    setEditedPages({}); // Clear edited pages
    setCurrentPageIndex(0);
    setIsMultiPage(false);
    setExportPageCount(1);
    setActiveTab(0);
    setImageEdits({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      gamma: 1,
      exposure: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showNotification('Scanner reset. Ready for new scan.', 'info');
  }, [showNotification]);

  const resetEdits = useCallback(() => {
    const defaultEdits = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      gamma: 1,
      exposure: 0
    };
    
    setImageEdits(defaultEdits);
    setPreviewImage(originalImage);
    showNotification('Edits reset to default', 'info');
  }, [originalImage, showNotification]);

  const openEditDialog = useCallback(() => {
    if (!currentImage) return;
    setPreviewImage(currentImage);
    setEditDialogOpen(true);
  }, [currentImage]);

 // Export Configuration Dialog Component
// ENHANCED EXPORT DIALOG WITH VALIDATION
const ExportConfigDialog = () => (
  <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
    <DialogTitle>
      Export Configuration
    </DialogTitle>
    
    <DialogContent>
      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom variant="h6">
          Page Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Original document has {allPages.length} pages. Choose how many pages you want in the exported PDF.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body1" sx={{ minWidth: 120 }}>
            Export as:
          </Typography>
          <Slider
            value={exportPageCount}
            onChange={(e, value) => setExportPageCount(value)}
            min={1}
            max={Math.max(allPages.length, 1)}
            step={1}
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
          <Typography variant="body1" sx={{ minWidth: 40, textAlign: 'center' }}>
            {exportPageCount}
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          {exportPageCount < allPages.length ? 
            `Merging ${allPages.length} pages into ${exportPageCount} pages (2 pages per sheet)` :
            `Exporting all ${allPages.length} pages without merging.`
          }
        </Alert>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom variant="h6">
          Quick Export Options
        </Typography>
        <Grid container spacing={1}>
          <Grid size={{ xs: 6 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => performPDFExport(allPages.length)}
              disabled={isProcessing}
            >
              Original ({allPages.length} pages)
            </Button>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => performPDFExport(1)}
              disabled={isProcessing}
            >
              Single Page
            </Button>
          </Grid>
          {allPages.length >= 2 && (
            <>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => performPDFExport(Math.ceil(allPages.length / 2))}
                  disabled={isProcessing}
                >
                  Half Pages ({Math.ceil(allPages.length / 2)})
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => performPDFExport(exportPageCount)}
                  disabled={isProcessing}
                >
                  Custom ({exportPageCount} pages)
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </DialogContent>
    
    <DialogActions>
      <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
      <Button 
        onClick={() => performPDFExport(exportPageCount)} 
        variant="contained" 
        disabled={isProcessing}
      >
        {isProcessing ? 'Exporting...' : 'Export PDF'}
      </Button>
    </DialogActions>
  </Dialog>
);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Check camera availability
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setHasCamera(false);
          return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          setHasCamera(false);
          showNotification('No camera detected on this device', 'warning');
        }
      } catch (error) {
        console.error('Camera detection error:', error);
        setHasCamera(false);
      }
    };

    checkCameraAvailability();
  }, [showNotification]);

  return (
    <Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeNotification} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Smart Document Scanner
      </Typography>

      {/* Document Type Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DocumentScannerIcon />
          Choose Document Type
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the type of document for optimized processing and recognition
        </Typography>
        <Grid container spacing={2}>
          {documentTypes.map((docType) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={docType.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedDocumentType === docType.id ? 2 : 1,
                  borderColor: selectedDocumentType === docType.id ? 'primary.main' : 'divider',
                  bgcolor: selectedDocumentType === docType.id ? 'primary.50' : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => setSelectedDocumentType(docType.id)}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" gutterBottom>{docType.icon}</Typography>
                  <Typography variant="h6" gutterBottom>{docType.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{docType.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Main Scanner Interface */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            centered
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                py: 2,
                minWidth: 'auto',
                px: 3
              }
            }}
          >
            <Tab icon={<CameraAlt sx={{ mr: 1 }} />} label="Camera Scan" iconPosition="start" disabled={isProcessing || !hasCamera} />
            <Tab icon={<CloudUpload sx={{ mr: 1 }} />} label="Upload File" iconPosition="start" disabled={isProcessing} />
            <Tab icon={<Edit sx={{ mr: 1 }} />} label="Edit & Process" iconPosition="start" disabled={!currentImage || isProcessing} />
          </Tabs>
        </AppBar>

        <Box sx={{ p: 3 }}>
          {/* Camera Tab - COMPLETE IMPLEMENTATION */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ textAlign: 'center' }}>
              {!cameraActive ? (
                <Box>
                  <Paper sx={{ p: 4, mb: 2 }}>
                    <CameraAlt sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Camera Scanner
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Position your document in the frame and capture a clear image for best results
                    </Typography>
                    
                    {!hasCamera && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {cameraError || 'Camera not available on this device. Please use file upload instead.'}
                      </Alert>
                    )}
                    
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Camera />}
                      onClick={initializeCamera}
                      disabled={!hasCamera}
                    >
                      {hasCamera ? 'Start Camera' : 'Camera Not Available'}
                    </Button>
                  </Paper>
                </Box>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  {/* Camera View */}
                  <Paper sx={{ p: 2, mb: 2, position: 'relative', overflow: 'hidden', minHeight: 400 }}>
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        maxHeight: '60vh',
                        borderRadius: '8px',
                        transform: `scale(${zoomLevel})`,
                        minHeight: 400
                      }}
                    />
                    
                    {/* Camera Overlay - Document frame */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '70%',
                        border: '2px dashed #fff',
                        borderRadius: 1,
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)'
                      }}
                    />
                    
                    <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
                  </Paper>

                  {/* Camera Controls */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <IconButton
                      color={flashOn ? "primary" : "default"}
                      onClick={() => setFlashOn(!flashOn)}
                      title="Toggle Flash"
                    >
                      {flashOn ? <FlashOn /> : <FlashOff />}
                    </IconButton>
                    
                    <IconButton
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                      disabled={zoomLevel >= 3}
                      title="Zoom In"
                    >
                      <ZoomOutMap />
                    </IconButton>
                    
                    <Fab
                      color="primary"
                      onClick={captureImage}
                      sx={{ mx: 2 }}
                      size="large"
                    >
                      <CameraAlt />
                    </Fab>
                    
                    <IconButton
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
                      disabled={zoomLevel <= 1}
                      title="Zoom Out"
                    >
                      <ZoomOutMap sx={{ transform: 'rotate(180deg)' }} />
                    </IconButton>
                    
                    <IconButton onClick={stopCamera} color="error" title="Stop Camera">
                      <Stop />
                    </IconButton>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Zoom: {zoomLevel}x • Point camera at document and tap capture when ready
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Upload Tab */}
          <TabPanel value={activeTab} index={1}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Upload Document</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Supports: JPG, PNG, PDF files up to 50MB. Select multiple files to create a multi-page document.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Upload images or PDFs. The scanner will optimize quality while preserving content.
              </Alert>
              
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  p: 4,
                  mb: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': { backgroundColor: 'primary.50', borderColor: 'primary.dark' }
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Typography variant="body1" gutterBottom>Drag & drop files here</Typography>
                <Typography variant="body2" color="text.secondary">or click to browse</Typography>
              </Box>

              <input
                type="file"
                ref={fileInputRef}
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <Button
                variant="outlined"
                startIcon={<Image />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mr: 1 }}
              >
                Choose File
              </Button>
            </Paper>
          </TabPanel>

          {/* Edit & Process Tab */}
          <TabPanel value={activeTab} index={2}>
            {currentImage && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                  <Paper sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Image />
                      Document Preview {isMultiPage && `(Page ${currentPageIndex + 1} of ${allPages.length})`}
                    </Typography>
                    <Box
                      component="img"
                      src={currentImage}
                      alt="Document preview"
                      sx={{
                        width: '100%',
                        maxHeight: '70vh',
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                        backgroundColor: 'background.default'
                      }}
                    />
                    
                    {/* Page Navigation */}
                    {isMultiPage && allPages.length > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={goToPrevPage}
                          disabled={currentPageIndex === 0}
                          startIcon={<NavigateBefore />}
                        >
                          Previous
                        </Button>
                        
                        <Typography variant="body2" color="text.secondary">
                          Page {currentPageIndex + 1} of {allPages.length}
                        </Typography>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={goToNextPage}
                          disabled={currentPageIndex === allPages.length - 1}
                          endIcon={<NavigateNext />}
                        >
                          Next
                        </Button>
                      </Box>
                    )}
                    
                    {/* Enhanced Quick Action Buttons */}
                 <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small" startIcon={<Edit />} onClick={openEditDialog}>
                      Enhance All Pages
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<Filter />} onClick={enhanceImage} disabled={isProcessing}>
                      Auto-Enhance All
                    </Button>
                    
                    {/* Enhanced download buttons */}
                    {isMultiPage ? (
                      <>
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExportPDF()}>
                          Export PDF
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleDownload('jpeg', 1)}>
                          Merge as JPEG
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleDownload('png', 1)}>
                          Merge as PNG
                        </Button>
                        {/* Fallback: Individual page downloads */}
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleDownload('jpeg')}>
                          All as JPEG
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleDownload('png')}>
                          All as PNG
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleDownload('jpeg')}>
                          Save as JPEG
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleDownload('png')}>
                          Save as PNG
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExportPDF()}>
                          Save as PDF
                        </Button>
                      </>
                    )}
                  </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                  {/* Image Quality Stats */}
                  {imageQuality && imageStats && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>Image Quality</Typography>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">Overall Quality:</Typography></Grid>
                        <Grid size={{ xs: 6 }}>
                          <Chip 
                            label={`${imageQuality.overall}%`}
                            color={imageQuality.overall > 80 ? 'success' : imageQuality.overall > 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">Resolution:</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">{imageStats.resolution}</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">File Size:</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="body2">{imageStats.fileSize}</Typography></Grid>
                      </Grid>
                    </Paper>
                  )}

                  {/* Quick Download Options */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Export Options</Typography>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 4 }}>
                        <Button variant="outlined" fullWidth size="small" onClick={() => handleDownload('jpeg')}>JPEG</Button>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Button variant="outlined" fullWidth size="small" onClick={() => handleDownload('png')}>PNG</Button>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Button variant="outlined" fullWidth size="small" onClick={handleExportPDF}>PDF</Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </Box>
      </Paper>

      {/* Processing Progress */}
      {isProcessing && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>Processing...</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {progress < 50 ? 'Processing image...' : 'Finalizing...'}
            </Typography>
            <Typography variant="body2">{progress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Paper>
      )}

      {/* Reset Button */}
      {currentImage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
          <Button variant="outlined" onClick={resetScanner} disabled={isProcessing}>
            Start New Scan
          </Button>
        </Box>
      )}

      {/* Image Editing Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Enhance Image Quality</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={resetEdits}>Reset</Button>
              <IconButton onClick={() => setEditDialogOpen(false)}><Close /></IconButton>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">Adjust settings and see changes in real-time</Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                <Fade in={true} timeout={300}>
                  <Box
                    component="img"
                    src={previewImage || currentImage}
                    alt="Live preview"
                    sx={{
                      width: '100%',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </Fade>
                {isGeneratingPreview && (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 1 }}>
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <CircularProgress color="inherit" size={24} />
                      <Typography variant="body2" sx={{ mt: 1 }}>Updating preview...</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
              <Alert severity="info" sx={{ mt: 1 }}>Changes update in real-time. Click "Apply Enhancements" to save.</Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {['brightness', 'contrast', 'sharpness', 'exposure', 'saturation'].map((property) => (
                <Box key={property} sx={{ mb: 3 }}>
                  <Typography gutterBottom sx={{ textTransform: 'capitalize' }}>{property}</Typography>
                  <Slider
                    value={imageEdits[property]}
                    onChange={(e, value) => handleEditChange(property, value)}
                    min={property === 'sharpness' ? 0 : property === 'saturation' ? -0.2 : -0.15}
                    max={property === 'sharpness' ? 0.2 : property === 'saturation' ? 0.2 : 0.15}
                    step={0.05}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => {
                      if (property === 'sharpness') return `${Math.round(value * 500)}%`;
                      const range = property === 'saturation' ? 0.4 : 0.3;
                      const offset = property === 'saturation' ? 0.2 : 0.15;
                      return `${Math.round((value + offset) * (250 / range))}%`;
                    }}
                  />
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={applyImageEdits} variant="contained" startIcon={<Check />} disabled={isProcessing}>
            {isProcessing ? 'Applying...' : 'Apply Enhancements'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Configuration Dialog */}
      <ExportConfigDialog />
    </Box>
  );
};

export default DocumentScanner;