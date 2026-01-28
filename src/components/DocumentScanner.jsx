// DocumentScanner.jsx - FINAL VERSION WITH FULL-WIDTH LAYOUT & ENHANCED MERGING
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Slider, IconButton, Chip, LinearProgress, Alert,
  Tabs, Tab, AppBar, Toolbar, Fab, Snackbar, Fade, CircularProgress, 
  Container
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

  // ENHANCED MERGING HELPER FUNCTION - MAXIMIZED CONTENT COVERAGE
 // ENHANCED MERGING HELPER FUNCTION - HIGHER RESOLUTION FOR BETTER TEXT
const createOptimalMergedImage = async (pages, options = {}) => {
  const {
    format = 'png',
    maxSingleWidth = 3300,     // INCREASED from 2800 for better text clarity
    maxMergedWidth = 3300,     // INCREASED from 2800
    spacing = 15,              // INCREASED spacing for better separation
    backgroundColor = '#ffffff',
    preserveAspectRatio = true,
    quality = 1.0,
    horizontalPadding = 20,    // ADDED horizontal padding
    verticalPadding = 10       // INCREASED vertical padding
  } = options;

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
      let pageDimensions = [];

      console.log(`🔄 Starting merge of ${pages.length} pages with ENHANCED resolution for text clarity`);

      // Calculate optimal dimensions for each page first
      pages.forEach((page, index) => {
        const img = new window.Image();
        img.onload = () => {
          loadedCount++;
          
          // ENHANCED: Use higher resolution for text clarity
          const targetWidth = Math.min(maxSingleWidth, maxMergedWidth);
          const scaleFactor = targetWidth / img.width;
          const proportionalHeight = img.height * scaleFactor;
          
          // Store dimensions for this page
          pageDimensions.push({
            width: targetWidth,
            height: proportionalHeight,
            scaleFactor: scaleFactor,
            originalWidth: img.width,
            originalHeight: img.height
          });
          
          // Update overall dimensions
          maxWidth = Math.max(maxWidth, targetWidth);
          totalHeight += proportionalHeight;
          
          if (loadedCount === pages.length) {
            // Add spacing between pages
            totalHeight += (pages.length - 1) * spacing;
            
            // Apply maximum width constraint
            maxWidth = Math.min(maxWidth, maxMergedWidth);
            
            // Add padding to total height
            totalHeight += (pages.length * 2 * verticalPadding);
            
            // Set canvas dimensions with padding
            canvas.width = maxWidth + (2 * horizontalPadding);
            canvas.height = totalHeight;
            
            // Fill background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw images with ULTRA-HIGH quality for text
            let currentY = verticalPadding;
            
            images.forEach((loadedImg, imgIndex) => {
              const dimensions = pageDimensions[imgIndex];
              
              // Use full width with padding
              let finalWidth = maxWidth;
              let finalHeight = dimensions.height;
              
              // Maintain aspect ratio for legibility
              if (preserveAspectRatio) {
                finalHeight = (finalWidth / dimensions.originalWidth) * dimensions.originalHeight;
              }
              
              // Center the image horizontally
              const x = horizontalPadding;
              
              // ULTRA-HIGH-QUALITY rendering for text
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              
              // Save context for high-quality rendering
              ctx.save();
              
              // Draw the image with maximum quality
              ctx.drawImage(loadedImg, x, currentY, finalWidth, finalHeight);
              
              // Restore context
              ctx.restore();
              
              // Add subtle separator for multi-page documents
              if (imgIndex < images.length - 1) {
                ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(horizontalPadding, currentY + finalHeight + spacing/2);
                ctx.lineTo(canvas.width - horizontalPadding, currentY + finalHeight + spacing/2);
                ctx.stroke();
              }
              
              currentY += finalHeight + spacing + verticalPadding;
            });
            
            // Use maximum quality for output
            const mergedDataUrl = format === 'jpeg' 
              ? canvas.toDataURL('image/jpeg', Math.min(quality, 0.98)) // HIGHER QUALITY for JPEG
              : canvas.toDataURL('image/png', quality);
            
            console.log(`✅ Created HIGH-RESOLUTION merged image: ${canvas.width}x${canvas.height}px, Format: ${format}, Quality: ${quality}`);
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
      console.error('Enhanced image merging error:', error);
      reject(error);
    }
  });
};

  // ENHANCED PAGE MERGING WITH BETTER QUALITY CONTROL
 // ENHANCED PAGE MERGING WITH BETTER TEXT QUALITY
const mergePagesForExport = useCallback(async (pages, targetPageCount, options = {}) => {
  if (targetPageCount >= pages.length) {
    return pages;
  }

  try {
    console.log(`🔄 Merging ${pages.length} pages into ${targetPageCount} pages with ENHANCED text quality`);
    
    const mergedPages = [];
    const pagesPerMergedPage = Math.ceil(pages.length / targetPageCount);
    
    for (let i = 0; i < targetPageCount; i++) {
      const startIndex = i * pagesPerMergedPage;
      const endIndex = Math.min(startIndex + pagesPerMergedPage, pages.length);
      const pagesToMerge = pages.slice(startIndex, endIndex);
      
      if (pagesToMerge.length === 1) {
        mergedPages.push({
          ...pagesToMerge[0],
          dataUrl: pagesToMerge[0].dataUrl,
          isMerged: false,
          originalPages: 1
        });
      } else {
        // FIXED: Use enhanced settings for text quality
        const mergedImage = await createOptimalMergedImage(pagesToMerge, {
          format: options.format || 'png',
          maxSingleWidth: 3300,      // INCREASED for better text
          maxMergedWidth: 3300,      // INCREASED for better text
          spacing: 20,               // MORE spacing
          preserveAspectRatio: true,
          horizontalPadding: 20,     // ADDED padding
          verticalPadding: 15,       // INCREASED padding
          quality: 1.0
        });
        mergedPages.push({
          ...pagesToMerge[0],
          dataUrl: mergedImage,
          isMerged: true,
          originalPages: pagesToMerge.length,
          mergedIndex: i,
          dimensions: `Merged ${pagesToMerge.length} pages with enhanced text quality`
        });
      }
    }
    
    console.log(`✅ Successfully created ${mergedPages.length} high-text-quality merged pages`);
    return mergedPages;
  } catch (error) {
    console.error('Enhanced page merging error:', error);
    throw new Error('Failed to merge pages with enhanced text quality.');
  }
}, []);

// ENHANCED QUICK MERGE WITH BETTER TEXT QUALITY
const handleQuickMerge = useCallback(async (format = 'jpeg') => {
  if (!allPages || allPages.length <= 1) {
    showNotification('Need multiple pages to merge', 'warning');
    return;
  }

  try {
    setIsProcessing(true);
    showNotification('Creating high-text-quality merged document...', 'info');
    
    const docTypeName = documentTypes.find(doc => doc.id === selectedDocumentType)?.name || 'document';
    const filename = `${docTypeName}-merged-${Date.now()}`;
    
    const pagesToExport = allPages.map((page, index) => ({
      ...page,
      dataUrl: editedPages[index] || page.dataUrl
    }));
    
    // FIXED: Use enhanced settings for text quality
    const mergedImage = await createOptimalMergedImage(pagesToExport, {
      format: format,
      maxSingleWidth: 3300,      // INCREASED for better text
      maxMergedWidth: 3300,      // INCREASED for better text
      spacing: 25,               // MORE spacing
      preserveAspectRatio: true,
      horizontalPadding: 20,     // ADDED padding
      verticalPadding: 15,       // INCREASED padding
      quality: format === 'jpeg' ? 0.98 : 1.0  // HIGHER quality for JPEG
    });
        
    downloadImage(mergedImage, filename, format);
    showNotification(`Downloaded high-text-quality merged document as ${format.toUpperCase()}`, 'success');
    
  } catch (error) {
    console.error('Quick merge failed:', error);
    showNotification(`Merge failed: ${error.message}`, 'error');
  } finally {
    setIsProcessing(false);
  }
}, [allPages, editedPages, selectedDocumentType, documentTypes, showNotification]);

  // Enhanced PDF export with page count selection
 const handleExportPDF = useCallback(async () => {
  if (!currentImage && allPages.length === 0) return;
  
  // Check if we have PDF pages (from uploaded PDF)
  const isPDFDocument = allPages.some(page => page.isPDFConverted);
  
  if (isPDFDocument) {
    // For PDF documents, we can export directly
    const docTypeName = documentTypes.find(doc => doc.id === selectedDocumentType)?.name || 'document';
    const filename = `${docTypeName}-${Date.now()}.pdf`;
    
    try {
      // Your existing exportToPDF function should handle this
      await exportToPDF(allPages, filename);
      showNotification('PDF exported successfully', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      showNotification(`Export failed: ${error.message}`, 'error');
    }
  } else {
    // For scanned images, open the export dialog
    setExportDialogOpen(true);
  }
}, [currentImage, allPages, selectedDocumentType, documentTypes, showNotification]);

  // ENHANCED PDF EXPORT WITH BETTER MERGED PAGE QUALITY
 // ENHANCED PDF EXPORT WITH BETTER TEXT QUALITY
const performPDFExport = useCallback(async (targetPageCount = null) => {
  if (!allPages || allPages.length === 0) {
    showNotification('No pages available for export', 'error');
    return;
  }

  try {
    setIsProcessing(true);
    showNotification('Creating high-text-quality PDF document...', 'info');
    
    const docTypeName = documentTypes.find(doc => doc.id === selectedDocumentType)?.name || 'document';
    const filename = `${docTypeName}-scan-${Date.now()}.pdf`;
    
    // Get the pages to export (use edited versions if available)
    const pagesToExport = allPages.map((page, index) => ({
      ...page,
      dataUrl: editedPages[index] || page.dataUrl
    }));
    
    console.log(`📑 Preparing ${pagesToExport.length} pages for high-text-quality PDF export`);
    
    let finalPages = pagesToExport;
    
    // Apply enhanced page merging if target page count is specified
    if (targetPageCount && targetPageCount > 0 && targetPageCount !== pagesToExport.length) {
      if (targetPageCount > pagesToExport.length) {
        showNotification('Target page count cannot be greater than original page count', 'warning');
        targetPageCount = pagesToExport.length;
      } else {
        showNotification(`Merging ${pagesToExport.length} pages into ${targetPageCount} high-text-quality pages...`, 'info');
        try {
          finalPages = await mergePagesForExport(pagesToExport, targetPageCount, {
            format: 'png', // Use PNG for maximum text quality in PDF
            quality: 1.0
          });
        } catch (mergeError) {
          console.warn('Enhanced page merging failed, using original pages:', mergeError);
          showNotification('Page merging failed. Exporting original high-quality pages instead.', 'warning');
          finalPages = pagesToExport;
        }
      }
    }
    
    console.log(`📄 Exporting ${finalPages.length} high-text-quality pages to PDF`);
    await exportToPDF(finalPages, filename);
    
    const pageCount = finalPages.length > 1 ? ` with ${finalPages.length} high-text-quality pages` : '';
    showNotification(`High-text-quality PDF exported successfully${pageCount}`, 'success');
    setExportDialogOpen(false);
  } catch (error) {
    console.error('Enhanced PDF export failed:', error);
    showNotification(`Export failed: ${error.message}`, 'error');
  } finally {
    setIsProcessing(false);
  }
}, [allPages, editedPages, selectedDocumentType, documentTypes, showNotification, mergePagesForExport]);

  // ENHANCED DOWNLOAD WITH SUPERIOR MERGED IMAGE QUALITY
// ENHANCED DOWNLOAD WITH SUPERIOR TEXT QUALITY
const handleDownload = useCallback(async (format = 'jpeg', targetPageCount = null) => {
  if (!currentImage && (!allPages || allPages.length === 0)) {
    showNotification('No images available for download', 'error');
    return;
  }
  
  try {
    setIsProcessing(true);
    const docTypeName = documentTypes.find(doc => doc.id === selectedDocumentType)?.name || 'document';
    
    // Single page download
    if (!targetPageCount || allPages.length === 1) {
      const filename = `${docTypeName}-scan-${Date.now()}`;
      const imageToDownload = editedPages[currentPageIndex] || currentImage;
      
      if (!imageToDownload) {
        throw new Error('No image available for download');
      }
      
      downloadImage(imageToDownload, filename, format);
      showNotification(`Downloaded as ${format.toUpperCase()}`, 'success');
      return;
    }
    
    // MULTI-PAGE WITH ENHANCED TEXT QUALITY MERGING
    if (targetPageCount > allPages.length) {
      showNotification('Target page count cannot exceed original page count', 'warning');
      targetPageCount = allPages.length;
    }
    
    showNotification(`Processing ${allPages.length} pages with enhanced text quality...`, 'info');
    
    const pagesToExport = allPages.map((page, index) => ({
      ...page,
      dataUrl: editedPages[index] || page.dataUrl
    }));
    
    let pagesToDownload = pagesToExport;
    
    // Apply enhanced merging if requested
    if (targetPageCount && targetPageCount !== pagesToExport.length) {
      try {
        pagesToDownload = await mergePagesForExport(pagesToExport, targetPageCount, {
          format: format,
          quality: format === 'jpeg' ? 0.98 : 1.0 // HIGHER QUALITY for text
        });
        
        const mergedCount = pagesToDownload.filter(p => p.isMerged).length;
        showNotification(
          `Successfully merged ${pagesToExport.length} pages into ${pagesToDownload.length} high-text-quality pages (${mergedCount} merged)`, 
          'success'
        );
      } catch (mergeError) {
        console.warn('Enhanced page merging failed, using original pages:', mergeError);
        showNotification('Enhanced merging unavailable. Downloading original high-quality pages instead.', 'warning');
        pagesToDownload = pagesToExport;
      }
    }
    
    // Download each page with maximum quality settings
    pagesToDownload.forEach((page, index) => {
      const filename = `${docTypeName}-scan-page-${index + 1}-${Date.now()}`;
      
      // For merged pages, use maximum quality
      const downloadFormat = page.isMerged ? 'png' : format;
      downloadImage(page.dataUrl, filename, downloadFormat);
    });
    
    showNotification(`Downloaded ${pagesToDownload.length} high-text-quality files`, 'success');
    
  } catch (error) {
    console.error('Enhanced download failed:', error);
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
  }, [originalImage, currentPageIndex, editedPages, allPages, imageEdits, showNotification]);

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
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => performPDFExport(allPages.length)}
                disabled={isProcessing}
              >
                Original ({allPages.length} pages)
              </Button>
            </Grid>
            <Grid item xs={6}>
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
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => performPDFExport(Math.ceil(allPages.length / 2))}
                    disabled={isProcessing}
                  >
                    Half Pages ({Math.ceil(allPages.length / 2)})
                  </Button>
                </Grid>
                <Grid item xs={6}>
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
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      p: 0,
      m: 0
    }}>
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

      {/* MAIN CONTAINER WITH FULL WIDTH */}
      <Container maxWidth={false} sx={{ 
        width: '100%', 
        maxWidth: '100%', 
        p: { xs: 1, sm: 2, md: 3 },
        m: 0
      }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 600, 
          mb: 3,
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
        }}>
          Smart Document Scanner
        </Typography>

        {/* Document Type Selection - FULL WIDTH */}
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          width: '100%',
          maxWidth: '100%'
        }}>
          <Typography variant="h6" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            <DocumentScannerIcon />
            Choose Document Type
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ 
            mb: 2,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}>
            Select the type of document for optimized processing and recognition
          </Typography>
          <Grid container spacing={2}>
            {documentTypes.map((docType) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={docType.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedDocumentType === docType.id ? 2 : 1,
                    borderColor: selectedDocumentType === docType.id ? 'primary.main' : 'divider',
                    bgcolor: selectedDocumentType === docType.id ? 'primary.50' : 'background.paper',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                    height: '100%'
                  }}
                  onClick={() => setSelectedDocumentType(docType.id)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                      {docType.icon}
                    </Typography>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                      {docType.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                      {docType.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Main Scanner Interface - FULL WIDTH */}
        <Paper elevation={2} sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%'
        }}>
          <AppBar position="static" color="default" elevation={1}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              centered
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  py: 2,
                  minWidth: 'auto',
                  px: { xs: 1, sm: 3 }
                }
              }}
            >
              <Tab icon={<CameraAlt sx={{ mr: 1 }} />} label="Camera Scan" iconPosition="start" disabled={isProcessing || !hasCamera} />
              <Tab icon={<CloudUpload sx={{ mr: 1 }} />} label="Upload File" iconPosition="start" disabled={isProcessing} />
              <Tab icon={<Edit sx={{ mr: 1 }} />} label="Edit & Process" iconPosition="start" disabled={!currentImage || isProcessing} />
            </Tabs>
          </AppBar>

          <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Camera Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                {!cameraActive ? (
                  <Box sx={{ width: '100%' }}>
                    <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 2, width: '100%' }}>
                      <CameraAlt sx={{ fontSize: { xs: 48, sm: 64 }, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                        Camera Scanner
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 3,
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}>
                        Position your document in the frame and capture a clear image for best results
                      </Typography>
                      
                      {!hasCamera && (
                        <Alert severity="warning" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                          {cameraError || 'Camera not available on this device. Please use file upload instead.'}
                        </Alert>
                      )}
                      
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<Camera />}
                        onClick={initializeCamera}
                        disabled={!hasCamera}
                        sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                      >
                        {hasCamera ? 'Start Camera' : 'Camera Not Available'}
                      </Button>
                    </Paper>
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative', width: '100%' }}>
                    {/* Camera View - FULL WIDTH */}
                    <Paper sx={{ 
                      p: { xs: 1, sm: 2 }, 
                      mb: 2, 
                      position: 'relative', 
                      overflow: 'hidden', 
                      minHeight: 400,
                      width: '100%'
                    }}>
                      <video
                        ref={cameraVideoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: '100%',
                          maxHeight: '70vh',
                          borderRadius: '8px',
                          transform: `scale(${zoomLevel})`,
                          minHeight: 400
                        }}
                      />
                      
                      {/* Camera Overlay */}
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
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: { xs: 1, sm: 2 }, 
                      flexWrap: 'wrap', 
                      alignItems: 'center',
                      width: '100%'
                    }}>
                      <IconButton
                        color={flashOn ? "primary" : "default"}
                        onClick={() => setFlashOn(!flashOn)}
                        title="Toggle Flash"
                        size="large"
                      >
                        {flashOn ? <FlashOn /> : <FlashOff />}
                      </IconButton>
                      
                      <IconButton
                        onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                        disabled={zoomLevel >= 3}
                        title="Zoom In"
                        size="large"
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
                        size="large"
                      >
                        <ZoomOutMap sx={{ transform: 'rotate(180deg)' }} />
                      </IconButton>
                      
                      <IconButton onClick={stopCamera} color="error" title="Stop Camera" size="large">
                        <Stop />
                      </IconButton>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ 
                      mt: 1, 
                      display: 'block',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      Zoom: {zoomLevel}x • Point camera at document and tap capture when ready
                    </Typography>
                  </Box>
                )}
              </Box>
            </TabPanel>

            {/* Upload Tab */}
            <TabPanel value={activeTab} index={1}>
              <Paper sx={{ 
                p: { xs: 2, sm: 4 }, 
                textAlign: 'center',
                width: '100%'
              }}>
                <CloudUpload sx={{ fontSize: { xs: 48, sm: 64 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Upload Document
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 3,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}>
                  Supports: JPG, PNG, PDF files up to 50MB. Select multiple files to create a multi-page document.
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                  Upload images or PDFs. The scanner will optimize quality while preserving content.
                </Alert>
                
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    p: { xs: 2, sm: 4 },
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': { backgroundColor: 'primary.50', borderColor: 'primary.dark' },
                    width: '100%'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Typography variant="body1" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Drag & drop files here
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                    or click to browse
                  </Typography>
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
                  sx={{ mr: 1, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                >
                  Choose File
                </Button>
              </Paper>
            </TabPanel>

            {/* Edit & Process Tab - FULL WIDTH LAYOUT */}
            <TabPanel value={activeTab} index={2}>
              {currentImage && (
                <Box sx={{ width: '100%' }}>
                  {/* MAIN CONTENT AREA - FULL WIDTH */}
                  <Paper sx={{ 
                    p: { xs: 1, sm: 2, md: 3 }, 
                    mb: 2,
                    width: '100%'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                    }}>
                      <Image />
                      Document Preview {isMultiPage && `(Page ${currentPageIndex + 1} of ${allPages.length})`}
                    </Typography>
                    
                    {/* IMAGE CONTAINER - FULL WIDTH */}
                    <Box sx={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      backgroundColor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      mb: 2
                    }}>
                      <Box
                        component="img"
                        src={currentImage}
                        alt="Document preview"
                        sx={{
                          width: 'auto',
                          maxWidth: '100%',
                          height: 'auto',
                          maxHeight: '80vh',
                          objectFit: 'contain',
                          borderRadius: 1
                        }}
                      />
                    </Box>
                    
                    {/* Page Navigation */}
                    {isMultiPage && allPages.length > 1 && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: 2, 
                        mt: 2,
                        flexWrap: 'wrap'
                      }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={goToPrevPage}
                          disabled={currentPageIndex === 0}
                          startIcon={<NavigateBefore />}
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                        >
                          Previous
                        </Button>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                          Page {currentPageIndex + 1} of {allPages.length}
                        </Typography>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={goToNextPage}
                          disabled={currentPageIndex === allPages.length - 1}
                          endIcon={<NavigateNext />}
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                        >
                          Next
                        </Button>
                      </Box>
                    )}
                    
                    {/* Enhanced Quick Action Buttons - FULL WIDTH */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      mt: 2, 
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Edit />} 
                        onClick={openEditDialog}
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                      >
                        Enhance All Pages
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Filter />} 
                        onClick={enhanceImage} 
                        disabled={isProcessing}
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                      >
                        Auto-Enhance All
                      </Button>
                      
                      {/* Enhanced download buttons with quick merge options */}
                      {isMultiPage ? (
                        <>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Download />} 
                            onClick={() => handleExportPDF()}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                          >
                            Export PDF
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Download />} 
                            onClick={() => handleQuickMerge('jpeg')}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                          >
                            Merge All (JPEG)
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Download />} 
                            onClick={() => handleQuickMerge('png')}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                          >
                            Merge All (PNG)
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Download />} 
                            onClick={() => handleDownload('jpeg')}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                          >
                            Save as JPEG
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Download />} 
                            onClick={() => handleDownload('png')}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                          >
                            Save as PNG
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Download />} 
                            onClick={() => handleExportPDF()}
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                          >
                            Save as PDF
                          </Button>
                        </>
                      )}
                    </Box>
                  </Paper>

                  {/* SIDEBAR CONTENT - NOW FULL WIDTH GRID */}
                  <Grid container spacing={2} sx={{ width: '100%' }}>
                    {/* Image Quality Stats */}
                    {imageQuality && imageStats && (
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, width: '100%' }}>
                          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                            Image Quality
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}><Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Overall Quality:</Typography></Grid>
                            <Grid item xs={6}>
                              <Chip 
                                label={`${imageQuality.overall}%`}
                                color={imageQuality.overall > 80 ? 'success' : imageQuality.overall > 60 ? 'warning' : 'error'}
                                size="small"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                              />
                            </Grid>
                            <Grid item xs={6}><Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Resolution:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>{imageStats.resolution}</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>File Size:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>{imageStats.fileSize}</Typography></Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    )}

                    {/* Quick Download Options */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, width: '100%' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                          Export Options
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Button 
                              variant="outlined" 
                              fullWidth 
                              size="small" 
                              onClick={() => handleDownload('jpeg')}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                            >
                              JPEG
                            </Button>
                          </Grid>
                          <Grid item xs={4}>
                            <Button 
                              variant="outlined" 
                              fullWidth 
                              size="small" 
                              onClick={() => handleDownload('png')}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                            >
                              PNG
                            </Button>
                          </Grid>
                          <Grid item xs={4}>
                            <Button 
                              variant="outlined" 
                              fullWidth 
                              size="small" 
                              onClick={handleExportPDF}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}
                            >
                              PDF
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </TabPanel>
          </Box>
        </Paper>

        {/* Processing Progress */}
        {isProcessing && (
          <Paper sx={{ p: 2, mt: 2, width: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              Processing...
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ flex: 1, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                {progress < 50 ? 'Processing image...' : 'Finalizing...'}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>{progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          </Paper>
        )}

        {/* Reset Button */}
        {currentImage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2, width: '100%' }}>
            <Button 
              variant="outlined" 
              onClick={resetScanner} 
              disabled={isProcessing}
              sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
            >
              Start New Scan
            </Button>
          </Box>
        )}
      </Container>

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