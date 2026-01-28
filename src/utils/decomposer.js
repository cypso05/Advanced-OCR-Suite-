// src/app/features/ocr/utils/decomposer.js

/**
 * Intelligent Document Decomposition Service
 * Uses hybrid approach: OCR + shape detection + vector extraction
 * Converts documents into editable Konva canvas elements
 */

import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { OPS } from 'pdfjs-dist';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class DocumentDecomposer {
  constructor(options = {}) {
    this.options = {
      // OCR settings - FIXED: Use percentage (0-100)
      ocrLanguage: 'eng',
      ocrConfidenceThreshold: 60,  // ✅ Changed from 0.6 to 60
      
      // Shape detection
      detectShapes: true,
      shapeSimplification: 0.01,
      
      // Graphics extraction
      extractGraphics: true,
      extractBackground: true,  // NEW: Separate background from other graphics
      graphicsMinSize: 50,
      
      // Text detection
      textRegionDetection: true,
      extractText: false,  // NEW: Explicit text extraction flag
      
      // Vector extraction (for PDFs)
      extractVectors: true,
      
      // Performance
      maxImageSize: 4096,
      scaleFactor: 1.0,
      processAllPages: true,
      alwaysUseCanvas: false,
      
      // Konva-specific settings
      konvaReady: true, // Format elements for Konva
      includeLayerInfo: true,
      
      ...options
    };
    
    // ✅ ADD THESE BINDINGS:
    // Bind methods to the instance to maintain proper 'this' context
    this.decompose = this.decompose.bind(this);
    this.decomposePDF = this.decomposePDF.bind(this);
    this.decomposeImage = this.decomposeImage.bind(this);
    this.decomposeText = this.decomposeText.bind(this);
    this.decomposeCanvas = this.decomposeCanvas.bind(this);
    this.formatForKonva = this.formatForKonva.bind(this);
    this.getFileType = this.getFileType.bind(this);
    
    // Also bind the main helper methods that are called frequently
    this.extractTextViaOCR = this.extractTextViaOCR.bind(this);
    this.extractNonBackgroundGraphics = this.extractNonBackgroundGraphics.bind(this);
    this.detectShapes = this.detectShapes.bind(this);
    this.detectTextRegions = this.detectTextRegions.bind(this);
    this.extractPDFImages = this.extractPDFImages.bind(this);
    this.extractVectorPaths = this.extractVectorPaths.bind(this);
    
    this.ocrWorker = null;
    this.isInitializingOCR = false;
    this.elementCounter = 0;
  }

  /**
   * Main entry point - decomposes any document into editable elements for Konva
   */
  // Add this method to your DocumentDecomposer class in decomposer.js

/**
 * Main entry point - decomposes any document into editable elements for Konva
 */
async decompose(file, options = {}) {
  const mergedOptions = { ...this.options, ...options };
  const fileType = this.getFileType(file);
  
  console.log(`🚀 Decomposing ${fileType.toUpperCase()} for Konva editing: ${file.name}`, {
    extractText: mergedOptions.extractText,
    ocrConfidence: mergedOptions.ocrConfidenceThreshold,
    extractGraphics: mergedOptions.extractGraphics,
    extractBackground: mergedOptions.extractBackground,
    konvaReady: mergedOptions.konvaReady
  });
  
  try {
    let result;
    switch (fileType) {
      case 'pdf':
        result = await this.decomposePDF(file, mergedOptions);
        break;
        
      case 'image':
        result = await this.decomposeImage(file, mergedOptions);
        break;
        
      case 'text':
        result = await this.decomposeText(file, mergedOptions);
        break;
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Format for Konva if needed
    if (mergedOptions.konvaReady) {
      result = this.formatForKonva(result);
    }
    
    // Log decomposition results
    console.log(`📊 Decomposition complete - Ready for Konva:`, {
      type: result.type,
      totalPages: result.pages.length,
      totalElements: result.pages.reduce((sum, page) => sum + page.elements.length, 0),
      textElements: result.pages.reduce((sum, page) => sum + 
        page.elements.filter(el => el.type === 'text' || el.type === 'textbox').length, 0),
      imageElements: result.pages.reduce((sum, page) => sum + 
        page.elements.filter(el => el.type === 'image').length, 0),
      shapeElements: result.pages.reduce((sum, page) => sum + 
        page.elements.filter(el => el.type === 'rect' || el.type === 'circle' || el.type === 'polygon').length, 0),
      backgroundElements: result.pages.reduce((sum, page) => sum + 
        page.elements.filter(el => el.metadata?.isBackground).length, 0)
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Decomposition failed:', error);
    throw error;
  }
}

// Add this method to DocumentDecomposer class
getFileType(file) {
  console.log('🔍 Determining file type:', {
    name: file.name,
    type: file.type,
    size: file.size
  });
  
  if (file.type) {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('text/')) return 'text';
  }
  
  const fileName = file.name.toLowerCase();
  const ext = fileName.split('.').pop();
  
  console.log('📁 File extension:', ext);
  
  if (['pdf'].includes(ext)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif'].includes(ext)) return 'image';
  if (['txt', 'text', 'md', 'csv', 'html', 'htm'].includes(ext)) return 'text';
  
  console.warn('⚠️ Unknown file type, defaulting to text');
  return 'text';
}

/**
 * Format elements for Konva.js
 */
formatForKonva(result) {
  console.log('🎨 Formatting elements for Konva.js...');
  
  result.pages.forEach((page, pageIndex) => {
    page.elements.forEach((element, elementIndex) => {
      // Ensure all elements have required Konva properties
      if (!element.id) {
        element.id = `element-${pageIndex}-${elementIndex}-${Date.now()}`;
      }
      
      if (element.type === 'text') {
        // Ensure text elements have Konva-compatible properties
        element.fontFamily = element.fontFamily || 'Arial, sans-serif';
        element.fill = element.fill || '#000000';
        element.fontSize = element.fontSize || 16;
        element.align = element.align || 'left';
        element.verticalAlign = element.verticalAlign || 'top';
        element.wrap = element.wrap || 'word';
        element.listening = true; // Make it interactive
      }
      
      if (element.type === 'image') {
        // Ensure image elements have proper dimensions
        element.listening = !element.metadata?.isBackground; // Background not interactive
      }
      
      // Add Konva-specific metadata
      element.metadata = element.metadata || {};
      element.metadata.formattedForKonva = true;
      element.metadata.formattedAt = new Date().toISOString();
    });
    
    // Sort elements by type for better layering
    page.elements.sort((a, b) => {
      // Background images first
      if (a.metadata?.isBackground && !b.metadata?.isBackground) return -1;
      if (!a.metadata?.isBackground && b.metadata?.isBackground) return 1;
      
      // Then shapes
      if (a.type === 'rect' || a.type === 'circle') return -1;
      if (b.type === 'rect' || b.type === 'circle') return 1;
      
      // Then images
      if (a.type === 'image' && b.type !== 'image') return -1;
      if (b.type === 'image' && a.type !== 'image') return 1;
      
      // Then text
      if (a.type === 'text' && b.type !== 'text') return 1;
      if (b.type === 'text' && a.type !== 'text') return -1;
      
      return 0;
    });
  });
  
  result.metadata = result.metadata || {};
  result.metadata.konvaFormatted = true;
  console.log('✅ Elements formatted for Konva');
  
  return result;
}


// Add these helper methods to your DocumentDecomposer class:

/**
 * Load image from file
 */
async loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert image to canvas
 */
imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Resize if too large
  let width = img.width;
  let height = img.height;
  
  if (width > this.options.maxImageSize || height > this.options.maxImageSize) {
    const scale = Math.min(
      this.options.maxImageSize / width,
      this.options.maxImageSize / height
    );
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw with white background for better OCR
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas;
}

/**
 * Scale image to fit canvas while maintaining aspect ratio
 */
scaleImageToFit(img, targetWidth, targetHeight) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Calculate the scale to fit within target dimensions while maintaining aspect ratio
  const scale = Math.min(
    targetWidth / img.width,
    targetHeight / img.height
  );
  
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  
  // Center the scaled image on the canvas
  const offsetX = (targetWidth - scaledWidth) / 2;
  const offsetY = (targetHeight - scaledHeight) / 2;
  
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  
  // Draw scaled image centered on canvas
  ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
  
  return {
    canvas,
    scale,
    originalWidth: img.width,
    originalHeight: img.height,
    scaledWidth,
    scaledHeight,
    offsetX,
    offsetY,
    targetWidth,
    targetHeight
  };
}


/**
 * Calculate bounding box for a line of words
 */
calculateLineBoundingBox(words) {
  if (!words || words.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  words.forEach(word => {
    minX = Math.min(minX, word.bbox.x0);
    minY = Math.min(minY, word.bbox.y0);
    maxX = Math.max(maxX, word.bbox.x1);
    maxY = Math.max(maxY, word.bbox.y1);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Estimate font size from bounding box height
 */
estimateFontSize(height) {
  // Simple heuristic: assume height ~= font size
  return Math.max(8, Math.min(72, height * 0.8));
}

/**
 * Detect text color from canvas region
 */
detectTextColor(canvas, bbox) {
  // Simplified text color detection
  // In production, sample pixels in the bounding box
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(
      Math.max(0, bbox.x + 2),
      Math.max(0, bbox.y + 2),
      Math.min(10, bbox.width - 4),
      Math.min(10, bbox.height - 4)
    );
    
    // Average the color
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i+3] > 128) { // Not transparent
        r += imageData.data[i];
        g += imageData.data[i+1];
        b += imageData.data[i+2];
        count++;
      }
    }
    
    if (count > 0) {
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      
      // Return as hex
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
  } catch (error) {
    console.warn('⚠️ Text color detection failed:', error);
  }
  
  return '#000000'; // Default to black
}

/**
 * Perform OCR on canvas
 */
/**
 * Perform OCR on canvas with proper options handling
 */
async performOCR(canvas, options = {}) {
  if (!this.ocrWorker) {
    console.warn('OCR worker not available');
    return { elements: [] };
  }
  
  try {
    const ocrOptions = {
      rectangle: { 
        top: 0, 
        left: 0, 
        width: canvas.width, 
        height: canvas.height 
      },
      // Apply OCR-specific options
      ...(options.ocrOptions || {})
    };
    
    console.log('🔍 Running OCR with options:', {
      canvasSize: `${canvas.width}x${canvas.height}`,
      options: ocrOptions,
      confidenceThreshold: options.ocrConfidenceThreshold || this.options.ocrConfidenceThreshold
    });
    
    const result = await this.ocrWorker.recognize(canvas, ocrOptions);
    
    // Process OCR results into elements
    const elements = [];
    const confidenceThreshold = options.ocrConfidenceThreshold || this.options.ocrConfidenceThreshold;
    
    if (result.data && result.data.lines) {
      result.data.lines.forEach((line, lineIndex) => {
        if (line.words && line.words.length > 0) {
          // Filter words by confidence threshold
          const validWords = line.words.filter(word => 
            word.confidence >= confidenceThreshold
          );
          
          if (validWords.length > 0) {
            const lineText = validWords.map(w => w.text).join(' ');
            const bbox = this.calculateLineBoundingBox(validWords);
            const fontSize = this.estimateFontSize(bbox.height);
            
            elements.push({
              id: `ocr-line-${options.pageNumber || 1}-${lineIndex}-${Date.now()}`,
              type: 'text',
              text: lineText,
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height,
              fontSize: fontSize,
              fontFamily: options.fontFamily || 'Arial, sans-serif',
              fill: this.detectTextColor(canvas, bbox) || options.textColor || '#000000',
              editable: options.editable !== false,
              draggable: options.draggable !== false,
              resizable: options.resizable !== false,
              page: options.pageNumber || 1,
              metadata: {
                source: 'ocr',
                confidence: line.confidence || validWords.reduce((sum, w) => sum + w.confidence, 0) / validWords.length,
                wordCount: validWords.length,
                lineIndex: lineIndex,
                ocrTimestamp: new Date().toISOString()
              }
            });
          }
        }
      });
    }
    
    console.log(`✅ OCR completed: ${elements.length} text elements extracted`);
    
    return {
      elements: elements,
      data: result.data,
      stats: {
        totalLines: result.data.lines?.length || 0,
        totalWords: result.data.words?.length || 0,
        extractedElements: elements.length,
        confidence: result.data.confidence || 0
      }
    };
    
  } catch (error) {
    console.error('❌ OCR failed:', error);
    return { 
      elements: [],
      data: null,
      error: error.message
    };
  }
}

/**
 * Extract text elements from PDF
 */
extractPDFTextElements(textContent, page, viewport) {
  const elements = [];
  
  textContent.items.forEach((item, index) => {
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4] || 0;
    const y = viewport.height - (transform[5] || 0);
    const fontSize = Math.abs(transform[3]) || 12;
    
    elements.push({
      id: `pdf-text-${page.pageNumber}-${index}-${Date.now()}`,
      type: 'text',
      text: item.str,
      x: x,
      y: y,
      width: item.width || fontSize * item.str.length * 0.5,
      height: fontSize,
      fontSize: fontSize,
      fontFamily: item.fontName || 'sans-serif',
      fill: '#000000',
      editable: true,
      draggable: true,
      resizable: true,
      page: page.pageNumber,
      metadata: {
        source: 'pdf_native',
        hasFont: !!item.fontName,
        transform: item.transform,
        isPDFText: true
      }
    });
  });
  
  return elements;
}

/**
 * Image decomposition - SIMPLIFIED VERSION
 * Treats images like scanned PDFs: just extract as background + optional OCR
 */
async decomposeImage(file, options = {}) {
  console.log('🖼️ SIMPLIFIED: Decomposing image file (PDF-like approach)...');
  
  // 1. Load image and create canvas - KEEP IT SIMPLE
  const img = await this.loadImage(file);
  
  // Use reasonable target dimensions (like PDF would)
  const TARGET_WIDTH = 794;  // A4 width at 96 DPI
  const TARGET_HEIGHT = 1123; // A4 height at 96 DPI
  
  // 2. Simple scaling to fit
  const { canvas, scale, scaledWidth, scaledHeight } = 
    this.scaleImageToFit(img, TARGET_WIDTH, TARGET_HEIGHT);
  
  console.log(`✅ Image scaled to: ${scaledWidth}x${scaledHeight} (scale: ${scale.toFixed(2)})`);
  
  // 3. Create ONE background element (like scanned PDF)
  const backgroundUrl = canvas.toDataURL('image/jpeg', 0.85);
  
  const backgroundElement = {
    id: `image-background-1-${Date.now()}`,
    type: 'image',
    src: backgroundUrl,
    x: 0,
    y: 0,
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    editable: false,
    draggable: false,
    resizable: false,
    selectable: false,
    page: 1,
    metadata: {
      source: 'image_background',
      isBackground: true,
      originalDimensions: { width: img.width, height: img.height },
      scaledDimensions: { width: scaledWidth, height: scaledHeight },
      wasScaled: scale !== 1,
      processingMethod: 'simple_background_extraction'
    }
  };
  
  const elements = [backgroundElement];
  
  // 4. OPTIONAL: Only run OCR if explicitly requested
  let textElements = [];
  if (options.extractText === true && this.ocrWorker) {
    console.log('🔍 Running OPTIONAL OCR on image...');
    try {
      const ocrResult = await this.performOCR(canvas, {
        ...options,
        pageNumber: 1
      });
      textElements = ocrResult.elements || [];
      console.log(`✅ OCR extracted ${textElements.length} text elements`);
    } catch (ocrError) {
      console.warn('⚠️ OCR failed, continuing without text:', ocrError);
    }
  } else {
    console.log('ℹ️ Skipping OCR (not requested or worker not available)');
  }
  
  // Add text elements on top
  elements.push(...textElements);
  
  console.log(`✅ Simplified image decomposition: ${elements.length} total elements`);
  
  const pageResult = {
    pageNumber: 1,
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    viewport: { 
      width: TARGET_WIDTH, 
      height: TARGET_HEIGHT, 
      scale: scale,
      originalWidth: img.width,
      originalHeight: img.height
    },
    elements: elements,
    metadata: {
      fileType: file.type,
      hasText: textElements.length > 0,
      wasProcessed: true,
      decompositionMethod: 'simple_image_extraction'
    }
  };
  
  return {
    type: 'image',
    name: file.name,
    pages: [pageResult],
    totalPages: 1,
    metadata: {
      processingMethod: 'simple_image_decomposition',
      isImage: true,
      ocrUsed: textElements.length > 0,
      decomposedForEditing: true,
      originalSize: `${img.width}x${img.height}`,
      targetSize: `${TARGET_WIDTH}x${TARGET_HEIGHT}`,
      timestamp: new Date().toISOString()
    }
  };
}

  /**
   * PDF Decomposition with vector extraction
   */
async decomposePDF(file, options = {}) {
  const result = {
    type: 'pdf',
    name: file.name,
    pages: [],
    totalPages: 0,
    metadata: {
      processingMethod: 'pdf_native',
      isScannedPDF: false
    }
  };

  try {
    // Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    result.totalPages = pdf.numPages;
    result.metadata.pdfInfo = {
      numPages: pdf.numPages,
      isEncrypted: pdf.isEncrypted || false
    };

    // Process pages
    const pagesToProcess = options.processAllPages 
      ? Array.from({ length: pdf.numPages }, (_, i) => i + 1)
      : [options.pageNumber || 1];

    for (const pageNum of pagesToProcess) {
      console.log(`\n📑 Processing page ${pageNum}/${pdf.numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: options.scale || 2 });
      
      console.log(`Page ${pageNum} viewport: ${viewport.width.toFixed(2)}x${viewport.height.toFixed(2)}`);
      
      // Try to extract native text first
      console.log('Extracting text from page ' + pageNum + '...');
      let textElements = [];
      let isScannedPDF = false;
      
      try {
        const textContent = await page.getTextContent();
        console.log(`Raw text items found: ${textContent.items.length}`);
        
        if (textContent.items.length > 0) {
          textElements = this.extractPDFTextElements(textContent, page, viewport);
          console.log(`Text elements created: ${textElements.length}`);
        } else {
          console.log('No text items found in PDF. This might be a scanned PDF (image-based).');
          isScannedPDF = true;
          result.metadata.isScannedPDF = true;
        }
      } catch (textError) {
        console.warn(`⚠️ Text extraction failed for page ${pageNum}:`, textError);
        isScannedPDF = true;
        result.metadata.isScannedPDF = true;
      }

      // Extract images from PDF
      let imageElements = [];
      if (options.extractGraphics !== false) {
        console.log('Extracting images from page ' + pageNum + '...');
        imageElements = await this.extractPDFImages(page, viewport);
        console.log(`Images found: ${imageElements.length}`);
      }

      // If it's a scanned PDF and we have no elements, try canvas rendering
      let pageElements = [...textElements, ...imageElements];
      
      if (pageElements.length === 0 && isScannedPDF) {
        console.log(`⚠️ No elements extracted from page ${pageNum}. Using canvas rendering for scanned PDF...`);
        
        // Render page to canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to image element
        const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
        const pageElement = {
          id: `scanned-page-${pageNum}-${Date.now()}`,
          type: 'image',
          src: imageUrl,
          x: 50, // Margins
          y: 50,
          width: canvas.width - 100,
          height: canvas.height - 100,
          editable: false,
          draggable: false,
          resizable: false,
          page: pageNum,
          metadata: {
            source: 'scanned_pdf',
            isBackground: true,
            renderingMethod: 'canvas_fallback',
            originalWidth: canvas.width,
            originalHeight: canvas.height
          }
        };
        
        pageElements.push(pageElement);
        
        // Optionally run OCR on the canvas
        if (options.enableOCR !== false && this.ocrWorker) {
          try {
            const ocrResult = await this.performOCR(canvas, options);
            pageElements.push(...ocrResult.elements);
          } catch (ocrError) {
            console.warn(`⚠️ OCR failed for page ${pageNum}:`, ocrError);
          }
        }
      }

      // Add page to result
      result.pages.push({
        pageNumber: pageNum,
        width: viewport.width,
        height: viewport.height,
        elements: pageElements,
        metadata: {
          isScannedPDF: isScannedPDF,
          textElements: textElements.length,
          imageElements: imageElements.length,
          totalElements: pageElements.length
        }
      });
      
      console.log(`Page ${pageNum} total elements: ${pageElements.length}`);
    }

    console.log(`\n📊 PDF processing complete:`);
    console.log(`Total pages: ${result.pages.length}`);
    console.log(`Total elements extracted: ${result.pages.reduce((sum, page) => sum + page.elements.length, 0)}`);
    console.log(`Page breakdown:`);
    result.pages.forEach(page => {
      console.log(`  Page ${page.pageNumber}: ${page.elements.length} elements`);
    });

    return result;

  } catch (error) {
    console.error('❌ PDF decomposition failed:', error);
    throw error;
  }
}

  /**
   * Decompose PDF via canvas rendering (for scanned PDFs)
   */
  async decomposePDFViaCanvas(page, viewport, options) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // White background for better OCR
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;
    
    // Decompose the rendered canvas
    return await this.decomposeCanvas(canvas, {
      ...options,
      pageNumber: page.pageNumber,
      isPDFCanvas: true,
      originalWidth: viewport.width,
      originalHeight: viewport.height
    });
  }

  /**
   * Core canvas decomposition engine - IMPROVED VERSION
   */
  async decomposeCanvas(canvas, options) {
    const elements = [];
    console.log('🎨 Decomposing canvas for Konva editing...', {
      width: canvas.width,
      height: canvas.height,
      options: {
        extractText: options.extractText,
        extractGraphics: options.extractGraphics,
        extractBackground: options.extractBackground
      }
    });
    
    // 1. Extract background (if enabled) - should be first for proper layering
    if (options.extractBackground !== false) {
      const backgroundElements = await this.extractBackground(canvas, options);
      elements.push(...backgroundElements);
    }
    
    // 2. Extract non-background graphics (logos, images, etc.)
    if (options.extractGraphics) {
      const graphicElements = await this.extractNonBackgroundGraphics(canvas, options);
      elements.push(...graphicElements);
    }
    
    // 3. Extract text via OCR (if enabled)
    if (options.extractText !== false) {
      try {
        const textElements = await this.extractTextViaOCR(canvas, options);
        console.log(`📝 OCR extracted ${textElements.length} text elements`);
        elements.push(...textElements);
      } catch (ocrError) {
        console.warn('⚠️ OCR extraction failed, continuing without text:', ocrError);
      }
    }
    
    // 4. Detect shapes (rectangles, circles, etc.)
    if (options.detectShapes) {
      try {
        const shapeElements = await this.detectShapes(canvas, options);
        elements.push(...shapeElements);
      } catch (shapeError) {
        console.warn('⚠️ Shape detection failed:', shapeError);
      }
    }
    
    // 5. Detect text regions (for better layout)
    if (options.textRegionDetection && options.extractText) {
      try {
        const textRegions = await this.detectTextRegions(canvas, options);
        elements.push(...textRegions);
      } catch (regionError) {
        console.warn('⚠️ Text region detection failed:', regionError);
      }
    }
    
    console.log(`✅ Canvas decomposition: ${elements.length} total elements`);
    return elements;
  }

  /**
   * OCR Text Extraction - ENHANCED VERSION
   */
  async extractTextViaOCR(canvas, options) {
    const elements = [];
    
    if (!this.ocrWorker) {
      console.warn('⚠️ OCR worker not available, skipping text extraction');
      return elements;
    }
    
    try {
      console.log('🔍 Running OCR on canvas...');
      const startTime = Date.now();
      
      const { data } = await this.ocrWorker.recognize(canvas, {
        rectangle: { 
          top: 0, 
          left: 0, 
          width: canvas.width, 
          height: canvas.height 
        }
      });
      
      const endTime = Date.now();
      console.log(`✅ OCR completed in ${endTime - startTime}ms`, {
        confidence: data.confidence,
        words: data.words?.length || 0,
        lines: data.lines?.length || 0
      });
      
      // Process by lines for better paragraph detection
      if (data.lines && data.lines.length > 0) {
        let elementIndex = 0;
        
        for (const line of data.lines) {
          if (line.words && line.words.length > 0) {
            // Group words in the same line
            const lineWords = line.words.filter(word => 
              word.confidence >= this.options.ocrConfidenceThreshold
            );
            
            if (lineWords.length > 0) {
              // Create text element for the line
              const lineText = lineWords.map(w => w.text).join(' ');
              const bbox = this.calculateLineBoundingBox(lineWords);
              const fontSize = this.estimateFontSize(bbox.height);
              
              const elementId = `ocr-text-${options.pageNumber || 1}-${elementIndex++}-${Date.now()}`;
              
              elements.push({
                id: elementId,
                type: 'text', // Konva recognizes 'text' type
                text: lineText,
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
                fontSize: fontSize,
                fontFamily: 'Arial, sans-serif',
                fill: this.detectTextColor(canvas, bbox),
                editable: true,
                draggable: true,
                resizable: true,
                rotation: 0,
                page: options.pageNumber || 1,
                metadata: {
                  source: 'ocr',
                  confidence: line.confidence || lineWords.reduce((sum, w) => sum + w.confidence, 0) / lineWords.length,
                  isDetected: true,
                  originalText: lineText,
                  lineNumber: elementIndex,
                  wordCount: lineWords.length,
                  ocrTimestamp: new Date().toISOString()
                }
              });
            }
          }
        }
        
        console.log(`✅ OCR: ${elements.length} text lines extracted`);
      } 
      // Fallback: Use individual words
      else if (data.words && data.words.length > 0) {
        let validWords = 0;
        data.words.forEach((word, index) => {
          if (word.confidence >= this.options.ocrConfidenceThreshold) {
            const fontSize = this.estimateFontSize(word.bbox.y1 - word.bbox.y0);
            const elementId = `ocr-text-${options.pageNumber || 1}-${index}-${Date.now()}`;
            
            elements.push({
              id: elementId,
              type: 'text',
              text: word.text,
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
              fontSize: fontSize,
              fontFamily: 'Arial, sans-serif',
              fill: this.detectTextColor(canvas, word.bbox),
              editable: true,
              draggable: true,
              resizable: true,
              page: options.pageNumber || 1,
              metadata: {
                source: 'ocr',
                confidence: word.confidence,
                isDetected: true,
                originalText: word.text,
                ocrTimestamp: new Date().toISOString()
              }
            });
            validWords++;
          }
        });
        
        console.log(`✅ OCR: ${validWords}/${data.words.length} words passed confidence threshold`);
      }
      
      // Ultimate fallback: If no words but there's text
      if (elements.length === 0 && data.text && data.text.trim().length > 0) {
        console.log('📝 Creating fallback text element from OCR result');
        const textColor = this.detectTextColor(canvas, {x: 50, y: 50, width: 100, height: 30});
        
        elements.push({
          id: `ocr-text-fallback-${options.pageNumber || 1}-${Date.now()}`,
          type: 'text',
          text: data.text,
          x: 50,
          y: 50,
          width: canvas.width - 100,
          height: 200,
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fill: textColor || '#000000',
          editable: true,
          draggable: true,
          resizable: true,
          page: options.pageNumber || 1,
          metadata: {
            source: 'ocr_fallback',
            confidence: data.confidence || 0,
            isDetected: true,
            originalText: data.text,
            ocrTimestamp: new Date().toISOString()
          }
        });
      }
      
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      throw error;
    }
    
    return elements;
  }

/**
 * Background Extraction - UPDATED FOR SCALING
 */
async extractBackground(canvas, options) {
  const elements = [];
  
  try {
    // Extract the entire canvas as background
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    
    // If scaling was applied, adjust the background position
    const x = options.scalingOffsetX || 0;
    const y = options.scalingOffsetY || 0;
    const width = options.targetCanvasWidth || canvas.width;
    const height = options.targetCanvasHeight || canvas.height;
    
    elements.push({
      id: `background-${options.pageNumber || 1}-${Date.now()}`,
      type: 'image',
      src: dataUrl,
      x: x,
      y: y,
      width: width,
      height: height,
      editable: false,
      draggable: false,
      resizable: false,
      selectable: false,
      page: options.pageNumber || 1,
      metadata: {
        source: 'background_extraction',
        isBackground: true,
        quality: 'medium',
        zIndex: -1000,
        layer: 'background',
        scalingApplied: options.scalingApplied || false,
        scalingOffset: { x, y },
        originalCanvasSize: { width: canvas.width, height: canvas.height }
      }
    });
    
    console.log('🖼️ Background image extracted (with proper scaling)');
    
  } catch (error) {
    console.warn('⚠️ Background extraction failed:', error);
  }
  
  return elements;
}




/**
 * Simple Connected Components (for performance)
 */
findSimpleConnectedComponents(binaryData, width, height) {
  const visited = new Uint8ClampedArray(width * height);
  const blobs = [];
  
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      
      if (binaryData[index] === 255 && !visited[index]) {
        // Found a new blob
        const blob = {
          pixels: [],
          x: width,
          y: height,
          maxX: 0,
          maxY: 0
        };
        
        // Flood fill
        const stack = [[x, y]];
        visited[index] = 1;
        
        while (stack.length > 0) {
          const [cx, cy] = stack.pop();
          
          blob.pixels.push([cx, cy]);
          blob.x = Math.min(blob.x, cx);
          blob.y = Math.min(blob.y, cy);
          blob.maxX = Math.max(blob.maxX, cx);
          blob.maxY = Math.max(blob.maxY, cy);
          
          // Check 4-connected neighbors (faster than 8-connected)
          for (const [dx, dy] of directions) {
            const nx = cx + dx;
            const ny = cy + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIndex = ny * width + nx;
              if (binaryData[nIndex] === 255 && !visited[nIndex]) {
                visited[nIndex] = 1;
                stack.push([nx, ny]);
              }
            }
          }
        }
        
        // Calculate blob dimensions
        blob.width = blob.maxX - blob.x + 1;
        blob.height = blob.maxY - blob.y + 1;
        
        // Add padding
        const PADDING = 2;
        blob.x = Math.max(0, blob.x - PADDING);
        blob.y = Math.max(0, blob.y - PADDING);
        blob.width = Math.min(width - blob.x, blob.width + 2 * PADDING);
        blob.height = Math.min(height - blob.y, blob.height + 2 * PADDING);
        
        blobs.push(blob);
      }
    }
  }
  
  // Sort by size (largest first)
  blobs.sort((a, b) => b.pixels.length - a.pixels.length);
  
  return blobs;
}


/**
 * Find Connected Components (Blob Detection)
 */
findConnectedComponents(edges, width, height) {
  const visited = new Uint8ClampedArray(width * height);
  const blobs = [];
  
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      
      if (edges[index] === 255 && !visited[index]) {
        // Found a new blob
        const blob = {
          pixels: [],
          x: width,
          y: height,
          maxX: 0,
          maxY: 0
        };
        
        // Flood fill
        const stack = [[x, y]];
        visited[index] = 1;
        
        while (stack.length > 0) {
          const [cx, cy] = stack.pop();
          
          blob.pixels.push([cx, cy]);
          blob.x = Math.min(blob.x, cx);
          blob.y = Math.min(blob.y, cy);
          blob.maxX = Math.max(blob.maxX, cx);
          blob.maxY = Math.max(blob.maxY, cy);
          
          // Check 8-connected neighbors
          for (const [dx, dy] of directions) {
            const nx = cx + dx;
            const ny = cy + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIndex = ny * width + nx;
              if (edges[nIndex] === 255 && !visited[nIndex]) {
                visited[nIndex] = 1;
                stack.push([nx, ny]);
              }
            }
          }
        }
        
        // Calculate blob dimensions
        blob.width = blob.maxX - blob.x + 1;
        blob.height = blob.maxY - blob.y + 1;
        
        // Add padding
        const PADDING = 2;
        blob.x = Math.max(0, blob.x - PADDING);
        blob.y = Math.max(0, blob.y - PADDING);
        blob.width = Math.min(width - blob.x, blob.width + 2 * PADDING);
        blob.height = Math.min(height - blob.y, blob.height + 2 * PADDING);
        
        blobs.push(blob);
      }
    }
  }
  
  return blobs;
}

/**
 * Sample Colors from Blob
 */
sampleBlobColors(imageData, blob, width) {
  const colors = [];
  const data = imageData;
  
  // Sample pixels at regular intervals
  const SAMPLE_INTERVAL = Math.max(1, Math.floor(blob.pixels.length / 100));
  
  for (let i = 0; i < blob.pixels.length; i += SAMPLE_INTERVAL) {
    const [x, y] = blob.pixels[i];
    const index = (y * width + x) * 4;
    
    colors.push({
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3]
    });
  }
  
  return colors;
}

/**
 * Calculate Color Variance
 */
calculateColorVariance(colors) {
  if (colors.length < 2) return 0;
  
  // Calculate mean for each channel
  let meanR = 0, meanG = 0, meanB = 0;
  
  colors.forEach(color => {
    meanR += color.r;
    meanG += color.g;
    meanB += color.b;
  });
  
  meanR /= colors.length;
  meanG /= colors.length;
  meanB /= colors.length;
  
  // Calculate variance
  let varianceR = 0, varianceG = 0, varianceB = 0;
  
  colors.forEach(color => {
    varianceR += Math.pow(color.r - meanR, 2);
    varianceG += Math.pow(color.g - meanG, 2);
    varianceB += Math.pow(color.b - meanB, 2);
  });
  
  const totalVariance = (varianceR + varianceG + varianceB) / (3 * colors.length);
  return totalVariance;
}

async detectShapes(canvas, options) {
  const elements = [];
  
  try {
    console.log('🔷 Detecting shapes (with timeout)...');
    
    // Use a timeout to prevent infinite processing
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Shape detection timeout')), 5000);
    });
    
    const detectionPromise = (async () => {
      // ✅ FIXED: Add { willReadFrequently: true } here
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use the imageData that was previously unused
      const shapes = this.detectRectangles(canvas, imageData);
      
      // Also detect circles/ellipses
      const circles = this.detectCircles(canvas, imageData);
      
      // Combine all shapes
      const allShapes = [...shapes, ...circles];
      
      allShapes.forEach((shape, index) => {
        const elementId = `shape-${options.pageNumber || 1}-${index}-${Date.now()}`;
        
        elements.push({
          id: elementId,
          type: shape.type,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          radius: shape.radius,
          fill: shape.fill || 'rgba(255, 255, 255, 0.3)',
          stroke: shape.stroke || '#3498db',
          strokeWidth: 2,
          editable: true,
          draggable: true,
          resizable: shape.type !== 'circle',
          page: options.pageNumber || 1,
          metadata: {
            source: 'shape_detection',
            detectionMethod: shape.detectionMethod,
            isShape: true,
            shapeType: shape.type
          }
        });
      });
      
      console.log(`✅ Detected ${allShapes.length} shapes`);
    })();
    
    await Promise.race([detectionPromise, timeoutPromise]);
    
  } catch (error) {
    console.warn('⚠️ Shape detection failed or timed out:', error.message);
  }
  
  return elements;
}

async extractNonBackgroundGraphics(canvas, options) {
  const elements = [];
  
  try {
    console.log('🔍 Looking for non-background graphics...');
    
    // LIMIT THE CANVAS SIZE FOR PERFORMANCE
    const MAX_PROCESSING_SIZE = 400;
    let processingCanvas = canvas;
    let scale = 1;
    
    // If canvas is too large, scale it down for processing
    if (canvas.width > MAX_PROCESSING_SIZE || canvas.height > MAX_PROCESSING_SIZE) {
      scale = Math.min(
        MAX_PROCESSING_SIZE / canvas.width,
        MAX_PROCESSING_SIZE / canvas.height
      );
      
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.floor(canvas.width * scale);
      scaledCanvas.height = Math.floor(canvas.height * scale);
      // ✅ FIXED: Add { willReadFrequently: true } to scaled canvas too
      const scaledCtx = scaledCanvas.getContext('2d', { willReadFrequently: true });
      
      scaledCtx.drawImage(
        canvas,
        0, 0, canvas.width, canvas.height,
        0, 0, scaledCanvas.width, scaledCanvas.height
      );
      
      processingCanvas = scaledCanvas;
      console.log(`📐 Scaled down for graphics detection: ${canvas.width}x${canvas.height} → ${scaledCanvas.width}x${scaledCanvas.height} (scale: ${scale.toFixed(2)})`);
    }
    
    // ✅ FIXED: Add { willReadFrequently: true } here
    const ctx = processingCanvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, processingCanvas.width, processingCanvas.height);
    const data = imageData.data;
    
    // Configuration - ADJUSTED FOR PERFORMANCE
    const MIN_GRAPHIC_SIZE = Math.max(options.graphicsMinSize || 100, 200); // Larger minimum size
    const SIMPLE_THRESHOLD = true; // Use simpler detection for performance
    
    if (SIMPLE_THRESHOLD) {
      // SIMPLE VERSION: Use threshold-based detection instead of Sobel
      const threshold = 128;
      const binaryData = new Uint8ClampedArray(processingCanvas.width * processingCanvas.height);
      
      // Convert to grayscale and threshold
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        binaryData[i / 4] = gray > threshold ? 255 : 0;
      }
      
      // Find connected components
      const blobs = this.findSimpleConnectedComponents(binaryData, processingCanvas.width, processingCanvas.height);
      
      // Filter and process blobs
      const graphicsBlobs = blobs.filter(blob => {
        const area = blob.pixels.length;
        return area >= MIN_GRAPHIC_SIZE;
      }).slice(0, 10); // LIMIT to first 10 largest graphics for performance
      
      graphicsBlobs.forEach((blob, index) => {
        // Scale coordinates back to original size
        const originalX = Math.floor(blob.x / scale);
        const originalY = Math.floor(blob.y / scale);
        const originalWidth = Math.floor(blob.width / scale);
        const originalHeight = Math.floor(blob.height / scale);
        
        // Only process if it's a reasonable size (not the whole image)
        if (originalWidth < canvas.width * 0.8 && originalHeight < canvas.height * 0.8) {
          const elementId = `graphic-${options.pageNumber || 1}-${index}-${Date.now()}`;
          
          // Create a cropped canvas for this graphic
          const graphicCanvas = document.createElement('canvas');
          graphicCanvas.width = originalWidth;
          graphicCanvas.height = originalHeight;
          // ✅ FIXED: Add { willReadFrequently: true } to graphic canvas too
          const graphicCtx = graphicCanvas.getContext('2d', { willReadFrequently: true });
          
          // Extract the graphic from the original canvas
          graphicCtx.drawImage(
            canvas,
            originalX, originalY, originalWidth, originalHeight,
            0, 0, originalWidth, originalHeight
          );
          
          elements.push({
            id: elementId,
            type: 'image',
            x: originalX,
            y: originalY,
            width: originalWidth,
            height: originalHeight,
            image: graphicCanvas,
            stroke: '#e74c3c',
            strokeWidth: 1,
            editable: true,
            draggable: true,
            resizable: true,
            page: options.pageNumber || 1,
            metadata: {
              source: 'graphics_detection_simple',
              detectionMethod: 'threshold_based',
              isGraphic: true,
              blobArea: blob.pixels.length,
              scaledForProcessing: scale !== 1
            }
          });
        }
      });
      
      console.log(`✅ Simple graphics detection: ${elements.length} graphics found`);
      
    } else {
      // Original complex detection (commented out for performance)
      console.log('⚠️ Using simple detection for performance');
    }
    
  } catch (error) {
    console.warn('⚠️ Graphics extraction failed:', error);
  }
  
  return elements;
}
/**
 * Alternative Graphics Detection by Color Clustering
 */
async detectGraphicsByColorClustering(canvas, options) {
  const elements = [];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Simple color clustering by finding distinct color regions
  const COLOR_DIFF_THRESHOLD = 30;
  const MIN_REGION_SIZE = options.graphicsMinSize || 100;
  
  // Find regions of similar color
  const visited = new Uint8ClampedArray(canvas.width * canvas.height);
  const regions = [];
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = y * canvas.width + x;
      const pixelIndex = index * 4;
      
      if (!visited[index] && data[pixelIndex + 3] > 128) { // Not transparent
        const region = this.floodFillRegion(data, visited, x, y, canvas.width, canvas.height, COLOR_DIFF_THRESHOLD);
        
        if (region.pixels.length >= MIN_REGION_SIZE) {
          regions.push(region);
        }
      }
    }
  }
  
  // Convert regions to graphic elements
  regions.forEach((region, index) => {
    const elementId = `graphic-cluster-${options.pageNumber || 1}-${index}-${Date.now()}`;
    
    elements.push({
      id: elementId,
      type: 'rect',
      x: region.bounds.x,
      y: region.bounds.y,
      width: region.bounds.width,
      height: region.bounds.height,
      fill: region.averageColor,
      stroke: '#9b59b6',
      strokeWidth: 2,
      opacity: 0.7,
      editable: true,
      draggable: true,
      resizable: true,
      page: options.pageNumber || 1,
      metadata: {
        source: 'color_clustering',
        detectionMethod: 'flood_fill',
        pixelCount: region.pixels.length,
        isColorRegion: true
      }
    });
  });
  
  return elements;
}

/**
 * Flood Fill Region for Color Clustering
 */
floodFillRegion(data, visited, startX, startY, width, height, threshold) {
  const startIndex = (startY * width + startX) * 4;
  const startColor = {
    r: data[startIndex],
    g: data[startIndex + 1],
    b: data[startIndex + 2]
  };
  
  const region = {
    pixels: [],
    bounds: { x: width, y: height, maxX: 0, maxY: 0 },
    colorSum: { r: 0, g: 0, b: 0 }
  };
  
  const stack = [[startX, startY]];
  
  const colorDiff = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
    );
  };
  
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const index = y * width + x;
    
    if (visited[index]) continue;
    
    const pixelIndex = index * 4;
    const currentColor = {
      r: data[pixelIndex],
      g: data[pixelIndex + 1],
      b: data[pixelIndex + 2]
    };
    
    if (colorDiff(startColor, currentColor) <= threshold) {
      visited[index] = 1;
      region.pixels.push([x, y]);
      
      // Update bounds
      region.bounds.x = Math.min(region.bounds.x, x);
      region.bounds.y = Math.min(region.bounds.y, y);
      region.bounds.maxX = Math.max(region.bounds.maxX, x);
      region.bounds.maxY = Math.max(region.bounds.maxY, y);
      
      // Update color sum
      region.colorSum.r += currentColor.r;
      region.colorSum.g += currentColor.g;
      region.colorSum.b += currentColor.b;
      
      // Check neighbors
      if (x > 0) stack.push([x - 1, y]);
      if (x < width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < height - 1) stack.push([x, y + 1]);
    }
  }
  
  // Calculate final bounds and average color
  region.bounds.width = region.bounds.maxX - region.bounds.x + 1;
  region.bounds.height = region.bounds.maxY - region.bounds.y + 1;
  
  region.averageColor = `rgb(${
    Math.floor(region.colorSum.r / region.pixels.length)
  }, ${
    Math.floor(region.colorSum.g / region.pixels.length)
  }, ${
    Math.floor(region.colorSum.b / region.pixels.length)
  })`;
  
  return region;
}



/**
 * Rectangle Detection - IMPLEMENTED
 */
detectRectangles(canvas, imageData) {
  const shapes = [];
  const width = canvas.width;
  const height = canvas.height;
  
  // Create a binary image for contour detection
  const binaryCanvas = document.createElement('canvas');
  binaryCanvas.width = width;
  binaryCanvas.height = height;
  const binaryCtx = binaryCanvas.getContext('2d');
  
  // Convert to grayscale and threshold
  const grayData = this.convertToGrayscale(imageData);
  this.applyThreshold(binaryCtx, grayData, width, height, 128);
  
  // Find contours
  const contours = this.findContours(binaryCanvas);
  
  // Filter and approximate rectangles
  contours.forEach(contour => {
    // Simplify contour
    const epsilon = 0.02 * this.contourPerimeter(contour);
    const approx = this.approxPolyDP(contour, epsilon);
    
    // Check if it's a rectangle (4 vertices)
    if (approx.length === 4) {
      // Check if angles are approximately 90 degrees
      const angles = this.calculateAngles(approx);
      const isRectangle = angles.every(angle => Math.abs(angle - 90) < 30);
      
      if (isRectangle) {
        // Get bounding box
        const bounds = this.contourBoundingRect(approx);
        
        // Filter by size
        if (bounds.width > 20 && bounds.height > 20) {
          shapes.push({
            type: 'rect',
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            fill: 'rgba(52, 152, 219, 0.3)',
            stroke: '#2980b9',
            detectionMethod: 'contour_approximation'
          });
        }
      }
    }
  });
  
  return shapes;
}

/**
 * Circle Detection - IMPLEMENTED
 */
detectCircles(canvas, imageData) {
  const circles = [];
  const width = canvas.width;
  const height = canvas.height;
  
  // Convert to grayscale first
  const grayData = this.convertToGrayscale(imageData);
  
  // Create a temporary canvas for edge detection
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw grayscale data to temp canvas
  const tempImageData = tempCtx.createImageData(width, height);
  for (let i = 0; i < grayData.length; i++) {
    tempImageData.data[i * 4] = grayData[i];
    tempImageData.data[i * 4 + 1] = grayData[i];
    tempImageData.data[i * 4 + 2] = grayData[i];
    tempImageData.data[i * 4 + 3] = 255;
  }
  tempCtx.putImageData(tempImageData, 0, 0);
  
  // Edge detection on the grayscale image
  const edges = this.performSobelEdgeDetection(tempCanvas, 50);
  
  // Hough accumulator
  const accumulator = new Array(width * height).fill(0);
  
  // Circle parameters
  const MIN_RADIUS = 10;
  const MAX_RADIUS = Math.min(width, height) / 4;
  
  // For each edge point
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] === 255) {
        // Vote for possible circles
        for (let r = MIN_RADIUS; r <= MAX_RADIUS; r++) {
          for (let theta = 0; theta < 360; theta += 10) {
            const a = Math.floor(x - r * Math.cos(theta * Math.PI / 180));
            const b = Math.floor(y - r * Math.sin(theta * Math.PI / 180));
            
            if (a >= 0 && a < width && b >= 0 && b < height) {
              accumulator[b * width + a]++;
            }
          }
        }
      }
    }
  }
  
  // Find local maxima in accumulator (circles)
  const THRESHOLD = 20;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const votes = accumulator[y * width + x];
      
      if (votes > THRESHOLD) {
        // Check if this is a local maximum
        let isMax = true;
        
        for (let dy = -5; dy <= 5; dy++) {
          for (let dx = -5; dx <= 5; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              if (accumulator[ny * width + nx] > votes) {
                isMax = false;
                break;
              }
            }
          }
          if (!isMax) break;
        }
        
        if (isMax) {
          // Estimate radius based on votes (improved)
          let estimatedRadius = MIN_RADIUS;
          let maxVotesForRadius = 0;
          
          // Find the radius with most votes for this center
          for (let r = MIN_RADIUS; r <= MAX_RADIUS; r++) {
            let radiusVotes = 0;
            for (let theta = 0; theta < 360; theta += 30) {
              const a = Math.floor(x - r * Math.cos(theta * Math.PI / 180));
              const b = Math.floor(y - r * Math.sin(theta * Math.PI / 180));
              
              if (a >= 0 && a < width && b >= 0 && b < height) {
                radiusVotes += accumulator[b * width + a];
              }
            }
            
            if (radiusVotes > maxVotesForRadius) {
              maxVotesForRadius = radiusVotes;
              estimatedRadius = r;
            }
          }
          
          circles.push({
            type: 'circle',
            x: x,
            y: y,
            radius: estimatedRadius,
            fill: 'rgba(231, 76, 60, 0.3)',
            stroke: '#c0392b',
            detectionMethod: 'hough_transform',
            confidence: votes / 100 // Normalized confidence score
          });
          
          // Clear nearby accumulator to avoid duplicate circles
          for (let dy = -20; dy <= 20; dy++) {
            for (let dx = -20; dx <= 20; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                accumulator[ny * width + nx] = 0;
              }
            }
          }
        }
      }
    }
  }
  
  return circles;
}

/**
 * Contour Utilities
 */
convertToGrayscale(imageData) {
  const data = imageData.data;
  const gray = new Uint8ClampedArray(data.length / 4);
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  return gray;
}

applyThreshold(ctx, grayData, width, height, threshold) {
  const binaryData = new Uint8ClampedArray(width * height * 4);
  
  for (let i = 0; i < grayData.length; i++) {
    const value = grayData[i] > threshold ? 255 : 0;
    const idx = i * 4;
    binaryData[idx] = value;
    binaryData[idx + 1] = value;
    binaryData[idx + 2] = value;
    binaryData[idx + 3] = 255;
  }
  
  const imageData = new ImageData(binaryData, width, height);
  ctx.putImageData(imageData, 0, 0);
}

findContours(canvas) {
  // Simplified contour finding algorithm
const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  const visited = new Uint8ClampedArray(width * height);
  const contours = [];
  
  const directions = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      
      if (data[index * 4] === 255 && !visited[index]) { // White pixel
        const contour = [];
        
        // Start tracing
        let startX = x;
        let startY = y;
        let currentX = x;
        let currentY = y;
        let direction = 0;
        
        do {
          contour.push([currentX, currentY]);
          visited[currentY * width + currentX] = 1;
          
          // Look for next border pixel
          let found = false;
          
          for (let i = 0; i < 8; i++) {
            const dirIdx = (direction + 6) % 8; // Start looking from right
            const dx = directions[dirIdx][0];
            const dy = directions[dirIdx][1];
            
            const nextX = currentX + dx;
            const nextY = currentY + dy;
            
            if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
              const nextIndex = nextY * width + nextX;
              
              if (data[nextIndex * 4] === 255) {
                currentX = nextX;
                currentY = nextY;
                direction = dirIdx;
                found = true;
                break;
              }
            }
            
            direction = (direction + 1) % 8;
          }
          
          if (!found) break;
          
        } while (!(currentX === startX && currentY === startY));
        
        if (contour.length > 10) { // Minimum contour length
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
}

contourPerimeter(contour) {
  let perimeter = 0;
  
  for (let i = 0; i < contour.length; i++) {
    const next = (i + 1) % contour.length;
    const dx = contour[next][0] - contour[i][0];
    const dy = contour[next][1] - contour[i][1];
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  return perimeter;
}

approxPolyDP(contour, epsilon) {
  if (contour.length < 3) return contour;
  
  // Find the point with the maximum distance
  let maxDist = 0;
  let maxIndex = 0;
  const start = contour[0];
  const end = contour[contour.length - 1];
  
  for (let i = 1; i < contour.length - 1; i++) {
    const dist = this.pointLineDistance(contour[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDist > epsilon) {
    const left = contour.slice(0, maxIndex + 1);
    const right = contour.slice(maxIndex);
    
    const leftApprox = this.approxPolyDP(left, epsilon);
    const rightApprox = this.approxPolyDP(right, epsilon);
    
    // Combine results, removing duplicate point
    return leftApprox.slice(0, -1).concat(rightApprox);
  } else {
    return [start, end];
  }
}

pointLineDistance(point, lineStart, lineEnd) {
  const numerator = Math.abs(
    (lineEnd[1] - lineStart[1]) * point[0] -
    (lineEnd[0] - lineStart[0]) * point[1] +
    lineEnd[0] * lineStart[1] -
    lineEnd[1] * lineStart[0]
  );
  
  const denominator = Math.sqrt(
    Math.pow(lineEnd[1] - lineStart[1], 2) +
    Math.pow(lineEnd[0] - lineStart[0], 2)
  );
  
  return numerator / denominator;
}

calculateAngles(points) {
  const angles = [];
  
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const current = points[i];
    const next = points[(i + 1) % points.length];
    
    const v1 = [prev[0] - current[0], prev[1] - current[1]];
    const v2 = [next[0] - current[0], next[1] - current[1]];
    
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    
    const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
    angles.push(angle);
  }
  
  return angles;
}

contourBoundingRect(contour) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  contour.forEach(point => {
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Text Region Detection - IMPLEMENTED
 */
async detectTextRegions(canvas, options) {
  const elements = [];
  
  try {
    console.log('📐 Detecting text regions for layout...');
    
    // This method assumes text elements have already been extracted
    // It groups them into logical regions (paragraphs, columns, etc.)
    
    const textElements = options.existingTextElements || [];
    
    if (textElements.length === 0) {
      return elements;
    }
    
    // Group text elements by proximity
    const clusters = this.clusterTextElements(textElements, {
      maxDistance: options.maxTextDistance || 50,
      sameLineThreshold: options.sameLineThreshold || 0.5
    });
    
    // Create region elements for each cluster
    clusters.forEach((cluster, index) => {
      if (cluster.elements.length > 0) {
        // Calculate cluster bounding box
        const bbox = this.calculateClusterBoundingBox(cluster.elements);
        
        const elementId = `text-region-${options.pageNumber || 1}-${index}-${Date.now()}`;
        
        elements.push({
          id: elementId,
          type: 'rect',
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
          fill: 'rgba(46, 204, 113, 0.2)',
          stroke: '#27ae60',
          strokeWidth: 1,
          opacity: 0.5,
          editable: false,
          draggable: false,
          resizable: false,
          page: options.pageNumber || 1,
          metadata: {
            source: 'text_region_detection',
            detectionMethod: 'proximity_clustering',
            isTextRegion: true,
            textElementCount: cluster.elements.length,
            averageFontSize: this.calculateAverageFontSize(cluster.elements),
            textAlignment: this.detectTextAlignment(cluster.elements),
            regionType: this.determineRegionType(cluster.elements, bbox)
          }
        });
      }
    });
    
    console.log(`✅ Detected ${elements.length} text regions`);
    
  } catch (error) {
    console.warn('⚠️ Text region detection failed:', error);
  }
  
  return elements;
}

/**
 * Cluster Text Elements by Proximity
 */
clusterTextElements(textElements, options) {
  const clusters = [];
  const visited = new Set();
  
  textElements.forEach((element, index) => {
    if (!visited.has(index)) {
      const cluster = {
        elements: [element],
        indices: [index]
      };
      
      visited.add(index);
      
      // Find all elements close to this one
      let changed = true;
      while (changed) {
        changed = false;
        
        textElements.forEach((otherElement, otherIndex) => {
          if (!visited.has(otherIndex)) {
            // Check if any element in cluster is close to this element
            const isClose = cluster.elements.some(clusterElement => 
              this.areTextElementsClose(clusterElement, otherElement, options)
            );
            
            if (isClose) {
              cluster.elements.push(otherElement);
              cluster.indices.push(otherIndex);
              visited.add(otherIndex);
              changed = true;
            }
          }
        });
      }
      
      clusters.push(cluster);
    }
  });
  
  return clusters;
}

areTextElementsClose(el1, el2, options) {
  // Calculate distance between element centers
  const center1 = { x: el1.x + el1.width / 2, y: el1.y + el1.height / 2 };
  const center2 = { x: el2.x + el2.width / 2, y: el2.y + el2.height / 2 };
  
  const distance = Math.sqrt(
    Math.pow(center1.x - center2.x, 2) + 
    Math.pow(center1.y - center2.y, 2)
  );
  
  // Check if they're on approximately the same line
  const verticalDistance = Math.abs(center1.y - center2.y);
  const isSameLine = verticalDistance < el1.height * options.sameLineThreshold;
  
  return distance < options.maxDistance || isSameLine;
}

calculateClusterBoundingBox(elements) {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  elements.forEach(element => {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

calculateAverageFontSize(elements) {
  if (elements.length === 0) return 0;
  
  const sum = elements.reduce((total, element) => total + (element.fontSize || 12), 0);
  return Math.round(sum / elements.length);
}

detectTextAlignment(elements) {
  if (elements.length < 2) return 'left';
  
  // Simple heuristic: check x-coordinate distribution
  const leftAlignCount = elements.filter(el => el.x < 100).length;
  const centerAlignCount = elements.filter(el => Math.abs(el.x - 400) < 100).length;
  const rightAlignCount = elements.filter(el => el.x > 700).length;
  
  if (centerAlignCount > leftAlignCount && centerAlignCount > rightAlignCount) {
    return 'center';
  } else if (rightAlignCount > leftAlignCount && rightAlignCount > centerAlignCount) {
    return 'right';
  }
  
  return 'left';
}

determineRegionType(elements, bbox) {
  const aspectRatio = bbox.width / bbox.height;
  const elementCount = elements.length;
  const avgFontSize = this.calculateAverageFontSize(elements);
  
  if (elementCount === 1) {
    return 'single_line';
  } else if (aspectRatio > 2) {
    return 'wide_block';
  } else if (aspectRatio < 0.5) {
    return 'tall_block';
  } else if (avgFontSize > 20) {
    return 'heading';
  } else if (elementCount > 10) {
    return 'paragraph';
  }
  
  return 'text_block';
}

/**
 * PDF Images Extraction - IMPLEMENTED
 */
async extractPDFImages(page, viewport) {
  const elements = [];
  
  try {
    console.log('🖼️ Extracting PDF images...');
    
    // Get page resources
    const resources = await page.getResources();
    
    if (resources) {
      const xobjects = resources.get('XObject');
      
      if (xobjects) {
        const xobjectKeys = xobjects.keys();
        
        for (const key of xobjectKeys) {
          const xobject = xobjects.get(key);
          
          if (xobject && xobject.subtype === 'Image') {
            try {
              // Get image data
              const imgData = await this.getImageDataFromXObject(xobject);
              
              if (imgData) {
                // Create canvas for the image
                const canvas = document.createElement('canvas');
                canvas.width = xobject.width;
                canvas.height = xobject.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                
                // Draw image data to canvas
                const imageData = ctx.createImageData(xobject.width, xobject.height);
                imageData.data.set(imgData);
                ctx.putImageData(imageData, 0, 0);
                
                // Get image transform/position from PDF
                const transform = this.getImageTransform(xobject, viewport);
                
                const elementId = `pdf-image-${page.pageNumber}-${key}-${Date.now()}`;
                
                elements.push({
                  id: elementId,
                  type: 'image',
                  x: transform.x,
                  y: transform.y,
                  width: transform.width,
                  height: transform.height,
                  image: canvas,
                  editable: true,
                  draggable: true,
                  resizable: true,
                  page: page.pageNumber,
                  metadata: {
                    source: 'pdf_image',
                    pdfKey: key,
                    width: xobject.width,
                    height: xobject.height,
                    colorSpace: xobject.colorspace?.name || 'unknown',
                    bitsPerComponent: xobject.bitsPerComponent,
                    filter: xobject.filter?.name || 'none',
                    isPDFImage: true
                  }
                });
              }
            } catch (imgError) {
              console.warn(`⚠️ Failed to extract PDF image ${key}:`, imgError);
            }
          }
        }
      }
    }
    
    console.log(`✅ Extracted ${elements.length} images from PDF`);
    
  } catch (error) {
    console.warn('⚠️ PDF image extraction failed:', error);
  }
  
  return elements;
}

/**
 * Get Image Data from PDF XObject
 */
async getImageDataFromXObject(xobject) {
  // Convert PDF image data to usable format
  try {
    // Get raw image data
    const rawData = await xobject.getImageData();
    
    // Handle different color spaces
    if (xobject.colorspace?.name === 'DeviceRGB') {
      // RGB image
      return this.convertRGBImageData(rawData, xobject);
    } else if (xobject.colorspace?.name === 'DeviceGray') {
      // Grayscale image
      return this.convertGrayImageData(rawData, xobject);
    } else if (xobject.colorspace?.name === 'DeviceCMYK') {
      // CMYK image (convert to RGB)
      return this.convertCMYKImageData(rawData, xobject);
    } else {
      // Default: try to extract as-is
      return rawData;
    }
  } catch (error) {
    console.warn('⚠️ Failed to get image data from XObject:', error);
    return null;
  }
}

convertRGBImageData(rawData, xobject) {
  const pixelCount = xobject.width * xobject.height;
  const output = new Uint8ClampedArray(pixelCount * 4);
  
  if (xobject.bitsPerComponent === 8) {
    for (let i = 0; i < pixelCount; i++) {
      output[i * 4] = rawData[i * 3];         // R
      output[i * 4 + 1] = rawData[i * 3 + 1]; // G
      output[i * 4 + 2] = rawData[i * 3 + 2]; // B
      output[i * 4 + 3] = 255;                // A
    }
  }
  
  return output;
}

convertGrayImageData(rawData, xobject) {
  const pixelCount = xobject.width * xobject.height;
  const output = new Uint8ClampedArray(pixelCount * 4);
  
  if (xobject.bitsPerComponent === 8) {
    for (let i = 0; i < pixelCount; i++) {
      const gray = rawData[i];
      output[i * 4] = gray;     // R
      output[i * 4 + 1] = gray; // G
      output[i * 4 + 2] = gray; // B
      output[i * 4 + 3] = 255;  // A
    }
  }
  
  return output;
}

convertCMYKImageData(rawData, xobject) {
  const pixelCount = xobject.width * xobject.height;
  const output = new Uint8ClampedArray(pixelCount * 4);
  
  if (xobject.bitsPerComponent === 8) {
    for (let i = 0; i < pixelCount; i++) {
      const c = rawData[i * 4] / 255;
      const m = rawData[i * 4 + 1] / 255;
      const y = rawData[i * 4 + 2] / 255;
      const k = rawData[i * 4 + 3] / 255;
      
      // Convert CMYK to RGB
      const r = 255 * (1 - c) * (1 - k);
      const g = 255 * (1 - m) * (1 - k);
      const b = 255 * (1 - y) * (1 - k);
      
      output[i * 4] = Math.round(r);
      output[i * 4 + 1] = Math.round(g);
      output[i * 4 + 2] = Math.round(b);
      output[i * 4 + 3] = 255;
    }
  }
  
  return output;
}

getImageTransform(xobject, viewport) {
  // Extract transformation matrix from PDF
  // This is simplified - actual PDF transforms can be complex
  const defaultSize = {
    x: 50,
    y: 50,
    width: Math.min(xobject.width, 300),
    height: Math.min(xobject.height, 300)
  };
  
  try {
    if (xobject.transform) {
      // Apply PDF transform matrix
      const [a, b, c, d, e, f] = xobject.transform;
      
      // Convert PDF coordinates to viewport coordinates
      const transformed = viewport.transform([
        [a, b, e],
        [c, d, f]
      ]);
      
      return {
        x: transformed[0][2],
        y: transformed[1][2],
        width: Math.abs(transformed[0][0]) * xobject.width,
        height: Math.abs(transformed[1][1]) * xobject.height
      };
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse image transform:', error);
  }
  
  return defaultSize;
}

/**
 * Vector Paths Extraction - IMPLEMENTED
 */
async extractVectorPaths(page, viewport) {
  const elements = [];
  
  try {
    console.log('🔄 Extracting vector paths...');
    
    // Get page operators (drawing commands)
    const operators = await page.getOperatorList();
    
    // Track current path and style
    let currentPath = [];
    let currentStyle = {
      strokeColor: '#000000',
      fillColor: null,
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter'
    };
    
    // Parse operators to extract paths
    for (let i = 0; i < operators.fnArray.length; i++) {
      const op = operators.fnArray[i];
      const args = operators.argsArray[i];
      
      switch (op) {
        case OPS.beginPath:
          currentPath = [];
          break;
          
        case OPS.moveTo:
          if (args.length >= 2) {
            const [x, y] = this.convertPDFCoords(args[0], args[1], viewport);
            currentPath.push({ type: 'moveTo', x, y });
          }
          break;
          
        case OPS.lineTo:
          if (args.length >= 2) {
            const [x, y] = this.convertPDFCoords(args[0], args[1], viewport);
            currentPath.push({ type: 'lineTo', x, y });
          }
          break;
          
        case OPS.curveTo:
          if (args.length >= 6) {
            const [x1, y1, x2, y2, x3, y3] = args;
            const p1 = this.convertPDFCoords(x1, y1, viewport);
            const p2 = this.convertPDFCoords(x2, y2, viewport);
            const p3 = this.convertPDFCoords(x3, y3, viewport);
            currentPath.push({ type: 'curveTo', points: [p1, p2, p3] });
          }
          break;
          
        case OPS.closePath:
          currentPath.push({ type: 'closePath' });
          break;
          
        case OPS.stroke:
          if (currentPath.length > 0) {
            elements.push(this.createPathElement(currentPath, currentStyle, page.pageNumber, 'stroke'));
            currentPath = [];
          }
          break;
          
        case OPS.fill:
          if (currentPath.length > 0) {
            elements.push(this.createPathElement(currentPath, { ...currentStyle, fillColor: currentStyle.strokeColor }, page.pageNumber, 'fill'));
            currentPath = [];
          }
          break;
          
        case OPS.setStrokeColor:
          currentStyle.strokeColor = this.convertPDFColor(args);
          break;
          
        case OPS.setFillColor:
          currentStyle.fillColor = this.convertPDFColor(args);
          break;
          
        case OPS.setLineWidth:
          if (args.length > 0) {
            currentStyle.lineWidth = args[0];
          }
          break;
      }
    }
    
    console.log(`✅ Extracted ${elements.length} vector paths`);
    
  } catch (error) {
    console.warn('⚠️ Vector path extraction failed:', error);
  }
  
  return elements;
}

convertPDFCoords(x, y, viewport) {
  // Convert PDF coordinates to viewport coordinates
  const transformed = viewport.convertToViewportPoint(x, y);
  return [transformed[0], transformed[1]];
}

convertPDFColor(args) {
  // Convert PDF color to CSS color
  if (args.length === 1) {
    // Grayscale
    const gray = Math.round(args[0] * 255);
    return `rgb(${gray}, ${gray}, ${gray})`;
  } else if (args.length === 3) {
    // RGB
    const r = Math.round(args[0] * 255);
    const g = Math.round(args[1] * 255);
    const b = Math.round(args[2] * 255);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (args.length === 4) {
    // CMYK (convert to RGB)
    const [c, m, y, k] = args;
    const r = Math.round(255 * (1 - c) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  return '#000000';
}

createPathElement(pathData, style, pageNumber, operation) {
  // Calculate bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  pathData.forEach(segment => {
    if (segment.type === 'moveTo' || segment.type === 'lineTo') {
      minX = Math.min(minX, segment.x);
      minY = Math.min(minY, segment.y);
      maxX = Math.max(maxX, segment.x);
      maxY = Math.max(maxY, segment.y);
    } else if (segment.type === 'curveTo') {
      segment.points.forEach(point => {
        minX = Math.min(minX, point[0]);
        minY = Math.min(minY, point[1]);
        maxX = Math.max(maxX, point[0]);
        maxY = Math.max(maxY, point[1]);
      });
    }
  });
  
  const elementId = `vector-path-${pageNumber}-${Date.now()}`;
  
  return {
    id: elementId,
    type: 'custom', // Would need custom Konva shape
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    pathData: pathData,
    stroke: operation === 'stroke' ? style.strokeColor : null,
    fill: operation === 'fill' ? style.fillColor : null,
    strokeWidth: style.lineWidth,
    editable: true,
    draggable: true,
    resizable: true,
    page: pageNumber,
    metadata: {
      source: 'vector_path',
      pathLength: pathData.length,
      operation: operation,
      lineCap: style.lineCap,
      lineJoin: style.lineJoin,
      isVectorPath: true
    }
  };
}

/**
 * Text Decomposition - IMPROVED
 */
async decomposeText(file, options) {
  console.log('📄 Decomposing text file...');
  
  const text = await file.text();
  const lines = text.split('\n');
  const elements = [];
  
  // Configuration
  const LINE_HEIGHT = options.lineHeight || 20;
  const LEFT_MARGIN = options.leftMargin || 50;
  const TOP_MARGIN = options.topMargin || 50;
  const MAX_WIDTH = options.maxWidth || 700;
  
  // Process each line
  lines.forEach((line, index) => {
    if (line.trim().length > 0) {
      // Detect line type
      let fontSize = 14;
      let fontWeight = 'normal';
      let fontStyle = 'normal';
      let textDecoration = 'none';
      let fontFamily = 'Arial, sans-serif'; // Initialize fontFamily
      
      // Simple formatting detection
      if (line.match(/^#{1,6}\s/)) {
        // Markdown heading
        const headingLevel = line.match(/^#+/)[0].length;
        fontSize = 24 - (headingLevel * 2);
        fontWeight = 'bold';
      } else if (line.match(/^[-*]\s/)) {
        // List item
        fontSize = 14;
      } else if (line.match(/^\d+\.\s/)) {
        // Numbered list item
        fontSize = 14;
      } else if (line.match(/^>/)) {
        // Blockquote
        fontSize = 14;
        fontStyle = 'italic';
      } else if (line.match(/^`{3}/)) {
        // Code block
        fontSize = 12;
        fontFamily = 'monospace';
      } else if (line.match(/\[.*\]\(.*\)/)) {
        // Link
        fontSize = 14;
        textDecoration = 'underline';
      }
      
      const elementId = `text-line-${index}-${Date.now()}`;
      
      elements.push({
        id: elementId,
        type: 'text',
        text: line.trim(),
        x: LEFT_MARGIN,
        y: TOP_MARGIN + (index * LINE_HEIGHT),
        width: MAX_WIDTH,
        height: LINE_HEIGHT,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
        textDecoration: textDecoration,
        fill: '#000000',
        editable: true,
        draggable: true,
        resizable: true,
        page: 1,
        metadata: {
          source: 'text_file',
          lineNumber: index + 1,
          lineType: this.detectLineType(line),
          charCount: line.length,
          wordCount: line.split(/\s+/).filter(w => w.length > 0).length,
          originalText: line
        }
      });
    }
  });
  
  return {
    type: 'text',
    name: file.name,
    pages: [{
      pageNumber: 1,
      width: 800,
      height: Math.max(600, TOP_MARGIN + (lines.length * LINE_HEIGHT) + 50),
      elements: elements,
      metadata: {
        fileType: file.type,
        lineCount: lines.length,
        totalChars: text.length,
        encoding: 'UTF-8'
      }
    }],
    totalPages: 1,
    metadata: {
      processingMethod: 'text_decomposition',
      formattingDetected: elements.some(el => 
        el.fontWeight === 'bold' || 
        el.fontStyle === 'italic' || 
        el.textDecoration === 'underline'
      ),
      decomposedAt: new Date().toISOString()
    }
  };
}

detectLineType(line) {
  if (line.match(/^#{1,6}\s/)) return 'heading';
  if (line.match(/^[-*]\s/)) return 'list_item';
  if (line.match(/^\d+\.\s/)) return 'numbered_item';
  if (line.match(/^>/)) return 'blockquote';
  if (line.match(/^`{3}/)) return 'code_block';
  if (line.match(/\[.*\]\(.*\)/)) return 'link';
  if (line.trim().length === 0) return 'empty';
  if (line.length > 100) return 'paragraph';
  return 'regular';
}

  /**
   * Cleanup
   */
  async destroy() {
    if (this.ocrWorker) {
      console.log('🧹 Terminating OCR worker...');
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}

// Export singleton instance
export const documentDecomposer = new DocumentDecomposer();