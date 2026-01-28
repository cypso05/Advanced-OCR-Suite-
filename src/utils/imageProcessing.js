// utils/imageProcessing.js - UPDATED IMAGE PROCESSING

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Simple loader that returns the already imported pdfjsLib
export const loadPDFJS = async () => {
  return pdfjsLib;
};

// Check if PDF.js is available
export const isPDFJSAvailable = () => {
  return !!pdfjsLib;
};

// Enhanced file validation for multiple files
export const validateFiles = (files) => {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validPDFTypes = ['application/pdf'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  const errors = [];

  files.forEach(file => {
    if (!validImageTypes.includes(file.type) && !validPDFTypes.includes(file.type)) {
      errors.push(`Invalid file type for "${file.name}". Please upload JPEG, PNG, WebP, or PDF files.`);
    }
    
    if (file.size > maxSize) {
      errors.push(`File "${file.name}" is too large. Maximum size is 50MB.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Single file validation (backward compatibility)
export const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPEG, PNG, or PDF files.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 50MB.');
  }
  
  return true;
};

// Helper function to read file as ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// Helper function to read file as Data URL
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    // Validate file type first - only accept image files
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error(`Unsupported file type for image processing: ${file.type}. Please use JPEG, PNG, or WebP.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read image file. The file may be corrupted.'));
    reader.onabort = () => reject(new Error('File reading was aborted.'));
    reader.readAsDataURL(file);
  });
};

// Enhanced PDF to Image conversion with better error handling
export const convertPDFToImage = async (pdfFile, pageNumber = 1) => {
  try {
    // Validate it's actually a PDF
    if (pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('File is not a PDF');
    }

    console.log('Starting PDF conversion for:', pdfFile.name);
    
    // Load PDF.js if not already loaded
    const pdfjs = await loadPDFJS();
    
    const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
    const pdf = await pdfjs.getDocument({ 
      data: arrayBuffer,
      verbosity: 0
    }).promise;
    
    const totalPages = pdf.numPages;
    console.log(`PDF has ${totalPages} pages`);
    
    const imageDataUrls = [];

    // Convert pages to images
    const pagesToConvert = pageNumber === 'all' 
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : [parseInt(pageNumber)];

    for (const pageNum of pagesToConvert) {
      console.log(`Converting page ${pageNum}`);
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      console.log(`Page dimensions: ${viewport.width} x ${viewport.height}`);
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Set white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log(`Page ${pageNum} converted successfully, data URL length: ${dataUrl.length}`);
      
      imageDataUrls.push({
        dataUrl: dataUrl,
        pageNumber: pageNum,
        width: canvas.width,
        height: canvas.height,
        totalPages: totalPages
      });
    }

    console.log('PDF conversion completed successfully');
    return imageDataUrls;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(`Failed to convert PDF: ${error.message}`);
  }
};

// Enhanced image preprocessing with better handling
export const preprocessImage = (imageData, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!imageData) {
      reject(new Error('No image data provided'));
      return;
    }

    console.log('preprocessImage called with:', typeof imageData, imageData.substring(0, 100));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();

    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
        
        // For images, use original dimensions or reasonable scaling
        const maxDimension = 2000;
        let targetWidth = img.width;
        let targetHeight = img.height;

        // Only scale down if image is too large
        if (img.width > maxDimension || img.height > maxDimension) {
          const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
          targetWidth = Math.floor(img.width * scale);
          targetHeight = Math.floor(img.height * scale);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

        // Draw image first with proper smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Lighter processing for regular images - only apply if explicitly requested
        if (options.autoEnhance !== false) applyAutoEnhancement(ctx, canvas.width, canvas.height);
        if (options.enhanceContrast) enhanceContrast(ctx, canvas.width, canvas.height);
        if (options.grayscale) convertToGrayscale(ctx, canvas.width, canvas.height);
        
        // Skip heavy processing for regular images unless specified
        if (options.documentMode) {
          enhanceDocument(ctx, canvas.width, canvas.height);
          if (options.removeNoise) removeNoise(ctx, canvas.width, canvas.height);
        }
        
        if (options.sharpness > 0) applySharpness(ctx, canvas.width, canvas.height, options.sharpness);
        if (options.brightness !== 0) adjustBrightness(ctx, canvas.width, canvas.height, options.brightness);

        // Output format - use PNG for better quality
        const format = (options.format || 'png').toLowerCase();
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = options.quality ?? (format === 'png' ? 1 : 0.95);

        const processedImageData = canvas.toDataURL(mimeType, quality);
        console.log('Image processed successfully, output length:', processedImageData.length);
        resolve(processedImageData);
      } catch (error) {
        console.error('Image processing error:', error);
        reject(new Error(`Image processing failed: ${error.message}`));
      }
    };

    img.onerror = (e) => {
      console.error('Image load error:', e);
      console.error('Image source that failed:', imageData.substring(0, 200));
      reject(new Error('Failed to load image. The file may be corrupted or in an unsupported format.'));
    };
    
    // Handle image data safely
    if (typeof imageData === 'string') {
      if (imageData.startsWith('blob:') || imageData.startsWith('data:')) {
        img.src = imageData;
      } else {
        reject(new Error(`Invalid image data format`));
      }
    } else {
      reject(new Error(`Unexpected imageData type: ${typeof imageData}`));
    }
  });
};

// Process multiple files (images and PDFs)
export const processMultipleFiles = async (files, options = {}) => {
  const processedFiles = [];
  const errors = [];

  console.log('processMultipleFiles called with files:', files);

  for (const file of files) {
    try {
      console.log('Processing file:', file.name, 'type:', file.type);
      
      // Check if it's a PDF file
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        console.log('Processing PDF file:', file.name);
        const pdfPages = await convertPDFToImage(file, options.pageNumber || 'all');
        
        if (pdfPages.length === 0) {
          throw new Error('No pages found in PDF');
        }

        // Process each PDF page with minimal processing
        const processedPages = [];
        for (const page of pdfPages) {
          const processedImage = await preprocessImage(page.dataUrl, {
            autoEnhance: true,
            enhanceContrast: true,
            documentMode: true,
            removeNoise: false, // Less noise removal for PDFs
            sharpness: 0.3,
            brightness: 5,
            format: 'jpeg',
            quality: 0.9
          });
          
          processedPages.push({
            ...page,
            dataUrl: processedImage
          });
        }

        processedFiles.push({
          originalFile: file,
          type: 'pdf',
          pages: processedPages,
          name: file.name,
          processed: true
        });
      } 
      // Check if it's an image file
      else if (file.type.startsWith('image/')) {
        console.log('Processing image file:', file.name);
        const imageData = await readFileAsDataURL(file);
        console.log('Image data type:', typeof imageData, 'starts with data:', imageData.startsWith('data:'));
        
        // Lighter processing for regular images
        const processedImage = await preprocessImage(imageData, {
          autoEnhance: true,
          enhanceContrast: true,
          documentMode: false, // Don't apply heavy document processing
          removeNoise: false, // Less noise removal for regular images
          sharpness: 0.2,
          grayscale: false, // Keep color for better OCR
          format: 'png',
          quality: 1.0
        });
        
        processedFiles.push({
          originalFile: file,
          type: 'image',
          dataUrl: processedImage,
          name: file.name,
          processed: true
        });
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      errors.push({
        file: file.name,
        error: error.message
      });
    }
  }

  return { processedFiles, errors };
};

// Image editing functions
export const editImage = (imageData, edits) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply edits
      if (edits.brightness !== undefined) {
        ctx.filter = `brightness(${100 + edits.brightness * 100}%)`;
      }
      if (edits.contrast !== undefined) {
        ctx.filter += ` contrast(${100 + edits.contrast * 100}%)`;
      }
      if (edits.saturation !== undefined) {
        ctx.filter += ` saturate(${100 + edits.saturation * 100}%)`;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Apply sharpness
      if (edits.sharpness > 0) {
        applySharpness(ctx, canvas.width, canvas.height, edits.sharpness);
      }
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageData;
  });
};

// Merge multiple images into a single image
export const mergeImages = async (imageDataUrls, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const format = options.format || 'jpeg';
      const spacing = options.spacing || 20;
      const backgroundColor = options.backgroundColor || '#ffffff';

      // Load all images first
      const images = [];
      let totalHeight = 0;
      let maxWidth = 0;

      const loadImage = (dataUrl) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = dataUrl;
        });
      };

      Promise.all(imageDataUrls.map(dataUrl => loadImage(dataUrl)))
        .then(loadedImages => {
          images.push(...loadedImages);

          // Calculate canvas dimensions
          totalHeight = images.reduce((sum, img) => sum + img.height + spacing, -spacing);
          maxWidth = Math.max(...images.map(img => img.width));

          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = maxWidth;
          canvas.height = totalHeight;

          // Fill background
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw images
          let currentY = 0;
          images.forEach(img => {
            const x = (maxWidth - img.width) / 2; // Center images
            ctx.drawImage(img, x, currentY, img.width, img.height);
            currentY += img.height + spacing;
          });

          // Export
          const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
          const quality = format === 'png' ? 1 : 0.95;
          const mergedDataUrl = canvas.toDataURL(mimeType, quality);

          resolve({
            dataUrl: mergedDataUrl,
            width: canvas.width,
            height: canvas.height,
            format: format
          });
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

/* ──────────────────────── Enhancement Functions ──────────────────────── */

const applyAutoEnhancement = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minBrightness = 255;
  let maxBrightness = 0;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    totalBrightness += brightness;
  }

  const avgBrightness = totalBrightness / (data.length / 4);
  const contrastRange = maxBrightness - minBrightness;

  if (contrastRange < 100) {
    const factor = 150 / contrastRange;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp((data[i] - minBrightness) * factor);
      data[i + 1] = clamp((data[i + 1] - minBrightness) * factor);
      data[i + 2] = clamp((data[i + 2] - minBrightness) * factor);
    }
  }

  if (avgBrightness < 100 || avgBrightness > 180) {
    const adjust = 140 - avgBrightness;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] + adjust);
      data[i + 1] = clamp(data[i + 1] + adjust);
      data[i + 2] = clamp(data[i + 2] + adjust);
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const enhanceDocument = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    // Contrast boost
    const factor = (259 * (1.3 + 255)) / (255 * (259 - 1.3));
    r = clamp(factor * (r - 128) + 128);
    g = clamp(factor * (g - 128) + 128);
    b = clamp(factor * (b - 128) + 128);

    // Background whitening
    const brightness = (r + g + b) / 3;
    if (brightness > 180) {
      const whitening = (brightness - 180) / 75;
      r = clamp(r + (255 - r) * whitening * 0.3);
      g = clamp(g + (255 - g) * whitening * 0.3);
      b = clamp(b + (255 - b) * whitening * 0.3);
    }

    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
};

const enhanceContrast = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minR = 255, minG = 255, minB = 255;
  let maxR = 0, maxG = 0, maxB = 0;

  for (let i = 0; i < data.length; i += 4) {
    minR = Math.min(minR, data[i]);
    minG = Math.min(minG, data[i + 1]);
    minB = Math.min(minB, data[i + 2]);
    maxR = Math.max(maxR, data[i]);
    maxG = Math.max(maxG, data[i + 1]);
    maxB = Math.max(maxB, data[i + 2]);
  }

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp((data[i]     - minR) * 255 / (maxR - minR || 1));
    data[i + 1] = clamp((data[i + 1] - minG) * 255 / (maxG - minG || 1));
    data[i + 2] = clamp((data[i + 2] - minB) * 255 / (maxB - minB || 1));
  }

  ctx.putImageData(imageData, 0, 0);
};

const convertToGrayscale = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
};

const removeNoise = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const temp = new Uint8ClampedArray(imageData.data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const i = (y * width + x) * 4 + c;
        const values = [
          temp[i - width * 4 - 4], temp[i - width * 4], temp[i - width * 4 + 4],
          temp[i - 4],             temp[i],             temp[i + 4],
          temp[i + width * 4 - 4], temp[i + width * 4], temp[i + width * 4 + 4]
        ].sort((a, b) => a - b);
        imageData.data[i] = values[4];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const applySharpness = (ctx, width, height, strength = 1) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const temp = new Uint8ClampedArray(imageData.data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const i = (y * width + x) * 4 + c;
        const val =
          temp[i] * (1 + 4 * strength) -
          temp[i - 4] * strength -
          temp[i + 4] * strength -
          temp[i - width * 4] * strength -
          temp[i + width * 4] * strength;
        imageData.data[i] = clamp(val);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const adjustBrightness = (ctx, width, height, amount) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp(data[i]     + amount);
    data[i + 1] = clamp(data[i + 1] + amount);
    data[i + 2] = clamp(data[i + 2] + amount);
  }

  ctx.putImageData(imageData, 0, 0);
};

const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

/* ──────────────────────── Quality & Stats ──────────────────────── */

export const calculateImageQuality = (imageData) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let min = 255, max = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
          min = Math.min(min, b);
          max = Math.max(max, b);
          total += b;
        }

        const avg = total / (data.length / 4);
        const range = max - min;

        const brightnessScore = Math.max(0, 100 - Math.abs(avg - 140) / 1.4);
        const contrastScore = Math.min(100, range * 100 / 255);

        let edgeStrength = 0, edgeCount = 0;
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const i = (y * canvas.width + x) * 4;
            const prevI = (y * canvas.width + x - 1) * 4;
            const curr = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const prev = (data[prevI] + data[prevI + 1] + data[prevI + 2]) / 3;
            const grad = Math.abs(curr - prev);
            if (grad > 10) { edgeStrength += grad; edgeCount++; }
          }
        }

        const sharpnessScore = edgeCount ? Math.min(100, (edgeStrength / edgeCount) * 2) : 0;

        const overall = Math.round(brightnessScore * 0.3 + contrastScore * 0.4 + sharpnessScore * 0.3);

        resolve({
          overall,
          brightness: Math.round(brightnessScore),
          contrast: Math.round(contrastScore),
          sharpness: Math.round(sharpnessScore),
          resolution: `${img.width} × ${img.height}`
        });
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Failed to load image for quality assessment'));
    img.src = imageData;
  });
};

export const getImageStats = (imageData) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: (img.width / img.height).toFixed(2),
        fileSize: estimateFileSize(imageData),
        megapixels: (img.width * img.height / 1000000).toFixed(1)
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for stats'));
    img.src = imageData;
  });
};

const estimateFileSize = (dataUrl) => {
  if (!dataUrl.startsWith('data:')) return 'Unknown';
  const base64 = dataUrl.split(',')[1];
  const bytes = (base64.length * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ──────────────────────── Export & Download Enhanced ──────────────────────── */

export const exportMergedDocument = async (processedFiles, exportFormat = 'pdf', filename = 'merged_document') => {
  try {
    // Extract all image data URLs from processed files
    const allImageDataUrls = [];
    
    for (const file of processedFiles) {
      if (file.type === 'pdf') {
        // Add all pages from PDF
        file.pages.forEach(page => {
          allImageDataUrls.push(page.dataUrl);
        });
      } else {
        // Add single image
        allImageDataUrls.push(file.dataUrl);
      }
    }

    if (exportFormat === 'pdf') {
      return await exportToPDFFromImages(allImageDataUrls, filename);
    } else {
      // Merge all images into one
      const merged = await mergeImages(allImageDataUrls, { format: exportFormat });
      downloadImage(merged.dataUrl, filename, exportFormat);
      return merged;
    }
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
};

// Enhanced PDF export for multiple images
export const exportToPDFFromImages = async (imageDataUrls, filename = 'scan.pdf') => {
  try {
    // Load jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    return new Promise((resolve, reject) => {
      let imagesLoaded = 0;
      const totalImages = imageDataUrls.length;

      if (totalImages === 0) {
        reject(new Error('No images to export'));
        return;
      }

      for (let i = 0; i < totalImages; i++) {
        const img = new Image();
        
        img.onload = () => {
          try {
            if (i > 0) {
              pdf.addPage();
            }

            // Calculate dimensions to fit page
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;
            
            let width, height;
            if (imgRatio > pageRatio) {
              width = pageWidth;
              height = pageWidth / imgRatio;
            } else {
              height = pageHeight;
              width = pageHeight * imgRatio;
            }

            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            pdf.addImage(imageDataUrls[i], 'JPEG', x, y, width, height);
            
            imagesLoaded++;
            
            // If this is the last image, save the PDF
            if (imagesLoaded === totalImages) {
              pdf.save(filename);
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error(`Failed to load image for page ${i + 1}`));
        img.src = imageDataUrls[i];
      }
    });
  } catch (error) {
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

// Single image PDF export (backward compatibility)
// In imageProcessing.js - FIXED PDF EXPORT
export const exportToPDF = async (images, filename) => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    console.log(`📄 Starting PDF export with ${images.length} images`);
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`Processing image ${i + 1}:`, image.dataUrl?.substring(0, 100));
      
      if (i > 0) {
        doc.addPage();
      }
      
      // Create and wait for image to load properly
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            // Calculate dimensions to fit page
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const width = imgWidth * ratio;
            const height = imgHeight * ratio;
            
            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;
            
            doc.addImage(img, 'JPEG', x, y, width, height);
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          console.error('Image loading failed:', image.dataUrl?.substring(0, 100));
          reject(new Error('Failed to load image for PDF export'));
        };
        
        // Ensure data URL is properly formatted
        if (!image.dataUrl || !image.dataUrl.startsWith('data:image/')) {
          reject(new Error('Invalid image data URL'));
          return;
        }
        
        img.src = image.dataUrl;
      });
    }
    
    doc.save(filename);
    console.log('✅ PDF exported successfully');
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`PDF export failed: ${error.message}`);
  }
};

// Enhanced download with multiple format support
export const downloadImage = (imageData, filename = 'image', format = 'jpeg') => {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  };

  const fmt = format.toLowerCase();
  const mimeType = mimeTypes[fmt] || 'image/jpeg';
  const ext = fmt === 'jpg' ? 'jpg' : fmt;

  // If we already have a data URL with correct mime, use it directly
  if (imageData.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Fallback: load image → canvas → dataURL with proper mime
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const dataUrl = canvas.toDataURL(mimeType, fmt === 'png' ? 1 : 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.src = imageData;
};

/* ──────────────────────── Presets ──────────────────────── */

export const createScanPresets = {
  document: { enhanceContrast: true, documentMode: true, removeNoise: true, sharpness: 0.8, format: 'jpeg', quality: 0.95 },
  receipt:  { enhanceContrast: true, grayscale: true,    removeNoise: true, sharpness: 0.5, format: 'jpeg', quality: 0.9 },
  business_card: { enhanceContrast: true, removeNoise: true, sharpness: 1.0, format: 'png',  quality: 1.0 },
  id_card:  { enhanceContrast: true, documentMode: true, sharpness: 0.7, format: 'jpeg', quality: 0.95 },
  photo:    { autoEnhance: true, removeNoise: false, sharpness: 0.3, format: 'jpeg', quality: 0.98 },
};