 // src/app/features/ocr/utils/pdfExportUtils.js - FINAL WORKING VERSION
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Simple notification function
const showNotification = (message, type = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
};

// Canvas height management constants
const STANDARD_A4_HEIGHT = 1123; // px for A4 portrait
const STANDARD_A4_WIDTH = 794;   // px for A4 portrait

/**
 * Get A4 dimensions for different quality settings
 * @param {number} scale - Scale factor
 * @returns {Object} Dimensions for screen, print, and standard
 */
export const getA4Dimensions = (scale = 1) => {
  const dpi = 96; // Screen DPI
  const printDpi = 300; // Print DPI
  
  return {
    screen: {
      width: Math.round(794 * scale),
      height: Math.round(1123 * scale)
    },
    print: {
      width: Math.round(794 * (printDpi / dpi) * scale),
      height: Math.round(1123 * (printDpi / dpi) * scale)
    },
    standard: {
      width: 794,
      height: 1123
    }
  };
};

/**
 * Render a single element to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} element - Element data
 * @returns {Promise|null} - Promise for image loading, null for other elements
 */
const renderElementToContext = (ctx, element) => {
  if (!element) return null;
  
  try {
    switch (element.type) {
      case 'text': {
        ctx.save();
        ctx.font = `${element.fontWeight || 'normal'} ${element.fontStyle || 'normal'} ${element.fontSize || 12}px ${element.fontFamily || 'Arial'}`;
        ctx.fillStyle = element.fill || '#000000';
        ctx.textAlign = element.textAlign || 'left';
        ctx.textBaseline = 'top';
        
        const lines = element.text ? element.text.split('\n') : [''];
        const lineHeight = (element.fontSize || 12) * 1.2;
        
        lines.forEach((line, index) => {
          ctx.fillText(
            line,
            element.x || 0,
            (element.y || 0) + (index * lineHeight),
            element.width || 1000 // Default width
          );
        });
        ctx.restore();
        break;
      }
        
      case 'rectangle': {
        ctx.save();
        ctx.fillStyle = element.fill || '#ffffff';
        ctx.strokeStyle = element.stroke || '#000000';
        ctx.lineWidth = element.strokeWidth || 1;
        
        if (element.fill && element.fill !== 'transparent') {
          ctx.fillRect(
            element.x || 0,
            element.y || 0,
            element.width || 100,
            element.height || 100
          );
        }
        
        if (element.stroke && element.stroke !== 'transparent') {
          ctx.strokeRect(
            element.x || 0,
            element.y || 0,
            element.width || 100,
            element.height || 100
          );
        }
        ctx.restore();
        break;
      }
        
      case 'image': {
        if (element.src || element.image) {
          return new Promise((resolve, reject) => {
            const img = element.image || new Image();
            
            // If we already have a loaded image, use it
            if (img.complete && img.naturalWidth > 0) {
              // Draw at high quality
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              
              // Use original dimensions for PDF, scaled for display
              const displayWidth = element.width || img.naturalWidth;
              const displayHeight = element.height || img.naturalHeight;
              
              ctx.drawImage(
                img,
                element.x || 0,
                element.y || 0,
                displayWidth,
                displayHeight
              );
              resolve();
            } else if (element.src) {
              // Load image
              img.crossOrigin = 'Anonymous';
              img.onload = () => {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                const displayWidth = element.width || img.naturalWidth;
                const displayHeight = element.height || img.naturalHeight;
                
                ctx.drawImage(
                  img,
                  element.x || 0,
                  element.y || 0,
                  displayWidth,
                  displayHeight
                );
                resolve();
              };
              img.onerror = reject;
              img.src = element.src;
            } else {
              reject(new Error('No valid image source'));
            }
          });
        }
        break;
      }
        
      case 'circle': {
        ctx.save();
        ctx.fillStyle = element.fill || '#ffffff';
        ctx.strokeStyle = element.stroke || '#000000';
        ctx.lineWidth = element.strokeWidth || 1;
        
        ctx.beginPath();
        ctx.arc(
          (element.x || 0) + (element.radius || 50),
          (element.y || 0) + (element.radius || 50),
          element.radius || 50,
          0,
          Math.PI * 2
        );
        
        if (element.fill && element.fill !== 'transparent') {
          ctx.fill();
        }
        
        if (element.stroke && element.stroke !== 'transparent') {
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
        
      case 'line': {
        if (element.points && Array.isArray(element.points)) {
          ctx.save();
          ctx.strokeStyle = element.stroke || '#000000';
          ctx.lineWidth = element.strokeWidth || 2;
          ctx.lineCap = element.lineCap || 'round';
          ctx.lineJoin = element.lineJoin || 'round';
          
          ctx.beginPath();
          ctx.moveTo(
            (element.x || 0) + (element.points[0] || 0),
            (element.y || 0) + (element.points[1] || 0)
          );
          
          for (let i = 2; i < element.points.length; i += 2) {
            ctx.lineTo(
              (element.x || 0) + element.points[i],
              (element.y || 0) + element.points[i + 1]
            );
          }
          
          ctx.stroke();
          ctx.restore();
        }
        break;
      }
        
      default:
        console.warn(`Unsupported element type: ${element.type}`);
    }
  } catch (error) {
    console.error('Error rendering element:', error);
  }
  
  return null;
};

/**
 * Render a single page to canvas with enhanced text preservation and contrast adjustment
 * @param {Object} pageData - Page data with elements
 * @param {Object} canvasSize - Canvas size for the page
 * @param {number} pixelRatio - Pixel ratio for quality
 * @param {Object} textProperties - Text enhancement properties
 * @returns {HTMLCanvasElement} - Rendered canvas
 */
export const renderPageToCanvas = (pageData, canvasSize, pixelRatio = 2, textProperties = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas with high DPI
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize.width * pixelRatio;
      canvas.height = canvasSize.height * pixelRatio;
      const ctx = canvas.getContext('2d');
      
      // Set ultra-high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Scale for high DPI
      ctx.scale(pixelRatio, pixelRatio);
      
      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Array to track image loading promises
      const imagePromises = [];
      
      // Enhanced text rendering with contrast adjustment
      const renderEnhancedText = (ctx, element, properties) => {
        ctx.save();
        
        // Calculate contrast-enhanced color
        let fillColor = element.fill || properties.color || '#000000';
        if (properties.contrast && properties.contrast !== 1) {
          fillColor = adjustColorContrast(fillColor, properties.contrast);
        }
        
        // Apply text enhancement
        const fontSize = (element.fontSize || 12) * (properties.fontScale || 1);
        const fontFamily = element.fontFamily || properties.fontFamily || 'Arial, sans-serif';
        const fontWeight = element.fontWeight || properties.fontWeight || 'normal';
        const fontStyle = element.fontStyle || properties.fontStyle || 'normal';
        
        // Build font string
        ctx.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fillColor;
        ctx.textAlign = element.textAlign || properties.align || 'left';
        ctx.textBaseline = 'top';
        
        // Apply anti-aliasing and clarity settings
        ctx.textRendering = 'geometricPrecision';
        
        // Enhance OCR text with adjustable shadow for clarity
        if (element.source === 'ocr' || element.metadata?.ocrConfidence) {
          const shadowIntensity = properties.shadowIntensity || 0.15;
          ctx.shadowColor = `rgba(0, 0, 0, ${shadowIntensity})`;
          ctx.shadowBlur = properties.shadowBlur || 0.8;
          ctx.shadowOffsetX = properties.shadowOffsetX || 0.5;
          ctx.shadowOffsetY = properties.shadowOffsetY || 0.5;
        }
        
        // Add outline/stroke for low-contrast text
        if (properties.addOutline && (element.metadata?.ocrConfidence || 0) < 0.6) {
          ctx.strokeStyle = properties.outlineColor || '#ffffff';
          ctx.lineWidth = properties.outlineWidth || 2;
          ctx.lineJoin = 'round';
        }
        
        const lines = element.text ? element.text.split('\n') : [''];
        const lineHeight = fontSize * (properties.lineSpacing || 1.5);
        
        lines.forEach((line, index) => {
          const x = element.x || 0;
          const y = (element.y || 0) + (index * lineHeight);
          
          // For low-confidence OCR text, render with background
          if (element.metadata?.ocrConfidence && element.metadata.ocrConfidence < 0.7) {
            const metrics = ctx.measureText(line);
            ctx.save();
            ctx.fillStyle = properties.highlightColor || 'rgba(255, 255, 200, 0.3)';
            ctx.fillRect(x, y, metrics.width, lineHeight);
            ctx.restore();
          }
          
          // Draw outline if enabled
          if (properties.addOutline && (element.metadata?.ocrConfidence || 0) < 0.6) {
            ctx.strokeText(line, x, y, element.width || 1000);
          }
          
          // Render text
          ctx.fillText(line, x, y, element.width || 1000);
        });
        
        ctx.restore();
      };
      
      // Helper function to adjust color contrast
      function adjustColorContrast(color, contrast) {
        if (color.startsWith('#')) {
          // Parse hex color
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          // Adjust contrast
          const adjustedR = Math.min(255, Math.max(0, ((r - 127.5) * contrast) + 127.5));
          const adjustedG = Math.min(255, Math.max(0, ((g - 127.5) * contrast) + 127.5));
          const adjustedB = Math.min(255, Math.max(0, ((b - 127.5) * contrast) + 127.5));
          
          return `#${Math.round(adjustedR).toString(16).padStart(2, '0')}${Math.round(adjustedG).toString(16).padStart(2, '0')}${Math.round(adjustedB).toString(16).padStart(2, '0')}`;
        }
        return color;
      }
      
      // Render elements with enhancement
      if (pageData.elements && Array.isArray(pageData.elements)) {
        pageData.elements.forEach(element => {
          try {
            if (element.type === 'text') {
              renderEnhancedText(ctx, element, textProperties);
            } else {
              const imagePromise = renderElementToContext(ctx, element);
              if (imagePromise) {
                imagePromises.push(imagePromise);
              }
            }
          } catch (err) {
            console.warn('Error rendering element:', err);
          }
        });
      }
      
      // Wait for all images to load
      if (imagePromises.length > 0) {
        Promise.all(imagePromises)
          .then(() => resolve(canvas))
          .catch(reject);
      } else {
        resolve(canvas);
      }
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Export elements to PDF with high-quality image rendering
 * @param {Array} elements - Design elements
 * @param {Object} canvasSize - Canvas dimensions
 * @param {Object} textProperties - Text enhancement properties
 * @param {Object} metadata - Document metadata
 * @returns {Promise<Object>} - Export result
 */
export const exportToHighQualityPDF = async (elements, canvasSize, textProperties = {}, metadata = {}) => {
  try {
    console.log('🎨 Creating high-quality PDF with text properties:', textProperties);
    
    // Create PDF with A4 dimensions
    const pdfWidth = STANDARD_A4_WIDTH;
    const pdfHeight = STANDARD_A4_HEIGHT;
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight],
      compress: true
    });
    
    // Separate images from other elements
    const imageElements = elements.filter(el => el.type === 'image');
    const textElements = elements.filter(el => el.type === 'text');
    const otherElements = elements.filter(el => el.type !== 'image' && el.type !== 'text');
    
    // Process images first with high quality
    for (const element of imageElements) {
      try {
        if (element.src || element.image) {
          // Get high-quality image data
          const imageDataURL = await getBestQualityImage(element);
          
          // Scale image to fit PDF page
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = imageDataURL;
          });
          
          const scaled = scaleImageForPDF(img, { width: pdfWidth, height: pdfHeight }, {
            x: element.x || 0,
            y: element.y || 0,
            canvasWidth: canvasSize.width,
            canvasHeight: canvasSize.height
          });
          
          // Add image to PDF
          pdf.addImage(
            imageDataURL,
            'PNG',
            scaled.x,
            scaled.y,
            scaled.width,
            scaled.height,
            undefined,
            'MEDIUM'
          );
          
          console.log('📊 Image scaled for PDF:', {
            original: `${img.naturalWidth}x${img.naturalHeight}`,
            scaled: `${scaled.width}x${scaled.height}`,
            scaleFactor: scaled.scaleFactor,
            position: `(${scaled.x}, ${scaled.y})`
          });
        }
      } catch (imgError) {
        console.warn('Failed to process image for PDF:', imgError);
      }
    }
    
    // Enhanced text rendering function with textProperties
    const renderEnhancedText = (ctx, element, properties) => {
      ctx.save();
      
      // Apply text properties for clarity
      const fontSize = (element.fontSize || 12) * (properties.fontScale || 1);
      const fontFamily = element.fontFamily || properties.fontFamily || 'Arial, sans-serif';
      const fontWeight = element.fontWeight || properties.fontWeight || 'normal';
      const fontStyle = element.fontStyle || properties.fontStyle || 'normal';
      
      // Build font string with text properties
      ctx.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = element.fill || properties.color || '#000000';
      ctx.textAlign = element.textAlign || properties.align || 'left';
      ctx.textBaseline = 'top';
      
      // Apply anti-aliasing and clarity settings
      ctx.textRendering = 'geometricPrecision';
      
      // Apply text shadow if specified
      if (properties.shadowIntensity) {
        ctx.shadowColor = `rgba(0, 0, 0, ${properties.shadowIntensity})`;
        ctx.shadowBlur = properties.shadowBlur || 0.8;
        ctx.shadowOffsetX = properties.shadowOffsetX || 0.5;
        ctx.shadowOffsetY = properties.shadowOffsetY || 0.5;
      }
      
      // Apply outline if specified for OCR text
      if (properties.addOutline && (element.metadata?.ocrConfidence || 0) < 0.6) {
        ctx.strokeStyle = properties.outlineColor || '#ffffff';
        ctx.lineWidth = properties.outlineWidth || 2;
        ctx.lineJoin = 'round';
      }
      
      const lines = element.text ? element.text.split('\n') : [''];
      const lineHeight = fontSize * (properties.lineSpacing || 1.5);
      
      lines.forEach((line, index) => {
        const x = element.x || 0;
        const y = (element.y || 0) + (index * lineHeight);
        
        // Apply highlight for low-confidence OCR text
        if (properties.highlightLowConfidence && element.metadata?.ocrConfidence && element.metadata.ocrConfidence < 0.7) {
          const metrics = ctx.measureText(line);
          ctx.save();
          ctx.fillStyle = properties.highlightColor || 'rgba(255, 255, 200, 0.3)';
          ctx.fillRect(x, y, metrics.width, lineHeight);
          ctx.restore();
        }
        
        // Draw outline if enabled
        if (properties.addOutline && (element.metadata?.ocrConfidence || 0) < 0.6) {
          ctx.strokeText(line, x, y, element.width || 1000);
        }
        
        // Render text with enhanced clarity
        ctx.fillText(line, x, y, element.width || 1000);
      });
      
      ctx.restore();
    };
    
    // Create a temporary canvas for text and other elements
    if (textElements.length > 0 || otherElements.length > 0) {
      const tempCanvas = document.createElement('canvas');
      const pixelRatio = 2; // High DPI
      tempCanvas.width = canvasSize.width * pixelRatio;
      tempCanvas.height = canvasSize.height * pixelRatio;
      const ctx = tempCanvas.getContext('2d');
      
      // Set high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(pixelRatio, pixelRatio);
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Array to track image loading promises
      const imagePromises = [];
      
      // Render text elements with enhanced text properties
      for (const element of textElements) {
        try {
          if (textProperties.enhanceClarity) {
            renderEnhancedText(ctx, element, textProperties);
          } else {
            // Standard text rendering
            const promise = renderElementToContext(ctx, element);
            if (promise) imagePromises.push(promise);
          }
        } catch (textError) {
          console.warn('Error rendering text element:', textError);
        }
      }
      
      // Render other elements
      for (const element of otherElements) {
        const promise = renderElementToContext(ctx, element);
        if (promise) imagePromises.push(promise);
      }
      
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
      }
      
      // Add to PDF
      const dataURL = tempCanvas.toDataURL('image/png');
      pdf.addImage(
        dataURL,
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        'MEDIUM'
      );
    }
    
    // Add metadata
    if (metadata.documentType) {
      pdf.setProperties({
        title: metadata.documentType,
        subject: 'High-quality PDF export from PDF Design Studio',
        author: 'PDF Design Studio',
        keywords: 'pdf, design, export, high-quality'
      });
    }
    
    // Save PDF
    const filename = `high-quality-design-${Date.now()}.pdf`;
    pdf.save(filename);
    
    return {
      success: true,
      filename: filename,
      pagesExported: 1,
      imagesOptimized: imageElements.length,
      textElementsEnhanced: textElements.length,
      format: 'pdf',
      quality: 'high',
      imageScaling: 'optimized',
      textPropertiesApplied: Object.keys(textProperties).length > 0
    };
    
  } catch (error) {
    console.error('❌ High-quality PDF export error:', error);
    throw new Error(`Failed to export high-quality PDF: ${error.message}`);
  }
};

/**
 * Default export quality settings
 */
export const defaultExportOptions = {
  // Image settings
  dpi: 300,
  quality: 'high',
  format: 'png',
  backgroundColor: '#ffffff',
  
  // Text enhancement
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  textColor: '#000000',
  lineSpacing: 1.5,
  
  // OCR enhancement
  enhanceClarity: true,
  contrast: 1.0, // 1.0 = normal, >1.0 = higher contrast
  shadowIntensity: 0.15,
  shadowBlur: 0.8,
  addOutline: false,
  outlineColor: '#ffffff',
  outlineWidth: 2,
  highlightLowConfidence: true,
  highlightColor: 'rgba(255, 255, 200, 0.3)',
  
  // Merging options
  mergeOrientation: 'vertical', // 'vertical' or 'horizontal'
  mergeGap: 20, // px between merged pages
  mergeScaleToFit: true,
  mergeAddBorders: true,
  mergeBorderColor: '#cccccc',
  mergeBorderWidth: 1,
  
  // Page settings
  pageSize: 'A4', // 'A4', 'Letter', 'Custom'
  pageOrientation: 'portrait', // 'portrait' or 'landscape'
  pageMargins: 50, // px
  
  // Preview settings
  previewScale: 0.5,
  previewBackground: '#f5f5f5',
  
  // Advanced
  pixelRatio: 2,
  compression: 0.9,
  preserveOCRMetadata: true,
  embedFonts: true
};

/**
 * Export canvas content as PDF (renders canvas as image)
 * @param {Object} stageRef - React ref to the Konva stage
 * @param {Object} canvasSize - {width, height} of the canvas
 * @param {string} filename - Optional filename
 */
export const exportCanvasToPDF = async (stageRef, canvasSize, filename = null) => {
  try {
    if (!stageRef || !stageRef.current) {
      throw new Error('Canvas stage not found');
    }
    
    // Get canvas content as high-quality image
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 2, // High quality
      mimeType: 'image/png'
    });
    
    // Create PDF with appropriate orientation using the actual canvas size
    const pdf = new jsPDF({
      orientation: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvasSize.width, canvasSize.height]
    });
    
    // Add image to PDF
    pdf.addImage(dataURL, 'PNG', 0, 0, canvasSize.width, canvasSize.height);
    
    // Save PDF
    const finalFilename = filename || `pdf-design-${Date.now()}.pdf`;
    pdf.save(finalFilename);
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

/**
 * Export canvas content as PNG with proper scaling and centering
 * @param {Object} stageRef - React ref to the Konva stage
 * @param {Object} canvasSize - {width, height} of the canvas
 * @param {string} filename - Optional filename
 * @param {string} backgroundColor - Background color
 * @param {string} quality - Quality setting
 */
export const exportCanvasToPNG = async (stageRef, canvasSize, filename = null, backgroundColor = '#ffffff', quality = 'high') => {
  if (!stageRef || !stageRef.current) {
    throw new Error('Canvas stage not found for PNG export');
  }
  
  const dimensions = getA4Dimensions();
  const targetSize = quality === 'print' ? dimensions.print : dimensions.screen;
  const pixelRatio = quality === 'print' ? 300/96 : 2;
  
  return new Promise((resolve, reject) => {
    try {
      // Get the canvas from Konva stage directly
      const konvaCanvas = stageRef.current.toCanvas({
        pixelRatio: pixelRatio,
        width: canvasSize.width,
        height: canvasSize.height
      });
      
      // Create a temporary canvas for background and scaling
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetSize.width;
      tempCanvas.height = targetSize.height;
      const ctx = tempCanvas.getContext('2d');
      
      // Fill with background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Calculate scale to fit canvas content within target size while maintaining aspect ratio
      const scaleX = targetSize.width / canvasSize.width;
      const scaleY = targetSize.height / canvasSize.height;
      const scale = Math.min(scaleX, scaleY); // Scale uniformly to fit
      
      // Calculate centered position
      const scaledWidth = canvasSize.width * scale;
      const scaledHeight = canvasSize.height * scale;
      const offsetX = (targetSize.width - scaledWidth) / 2;
      const offsetY = (targetSize.height - scaledHeight) / 2;
      
      console.log('🖼️ PNG Export Scaling:', {
        original: `${canvasSize.width}x${canvasSize.height}`,
        target: `${targetSize.width}x${targetSize.height}`,
        scale: scale.toFixed(3),
        scaled: `${Math.round(scaledWidth)}x${Math.round(scaledHeight)}`,
        offset: `(${Math.round(offsetX)}, ${Math.round(offsetY)})`
      });
      
      // Set high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the Konva canvas scaled and centered
      ctx.drawImage(
        konvaCanvas, 
        offsetX, 
        offsetY, 
        scaledWidth, 
        scaledHeight
      );
      
      // Convert to data URL and trigger download
      const dataURL = tempCanvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = filename || `pdf-design-a4-${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      resolve({
        success: true,
        filename: link.download,
        dimensions: {
          original: `${canvasSize.width}x${canvasSize.height}`,
          exported: `${targetSize.width}x${targetSize.height}`,
          content: `${Math.round(scaledWidth)}x${Math.round(scaledHeight)}`,
          scaleFactor: scale,
          centered: true
        }
      });
    } catch (error) {
      console.error('PNG export error:', error);
      reject(new Error(`Failed to export PNG: ${error.message}`));
    }
  });
};

/**
 * Create merged page layout with orientation support
 * @param {Array} pages - Pages to merge
 * @param {number} mergeRatio - Pages per sheet
 * @param {string} orientation - 'vertical' or 'horizontal'
 * @param {Object} canvasSize - Optional target canvas size
 * @returns {Array} - Merged layout data
 */
const createMergedLayout = (pages, mergeRatio, orientation = 'vertical', canvasSize = null) => {
  const mergedSheets = [];
  const sheetsNeeded = Math.ceil(pages.length / mergeRatio);
  
  for (let sheetIndex = 0; sheetIndex < sheetsNeeded; sheetIndex++) {
    const startIdx = sheetIndex * mergeRatio;
    const endIdx = Math.min(startIdx + mergeRatio, pages.length);
    const sheetPages = pages.slice(startIdx, endIdx);
    
    // Determine sheet size based on canvasSize or pages
    let sheetWidth, sheetHeight;
    
    if (canvasSize) {
      // Use provided canvas size
      sheetWidth = canvasSize.width || STANDARD_A4_WIDTH;
      sheetHeight = canvasSize.height || STANDARD_A4_HEIGHT;
    } else {
      // Calculate based on pages
      const maxWidth = Math.max(...sheetPages.map(p => p.width));
      const maxHeight = Math.max(...sheetPages.map(p => p.height));
      
      if (orientation === 'horizontal') {
        // Horizontal layout: pages side by side
        sheetWidth = maxWidth * sheetPages.length + (sheetPages.length - 1) * 20; // 20px gap
        sheetHeight = maxHeight;
      } else {
        // Vertical layout (default): pages stacked
        sheetWidth = maxWidth;
        sheetHeight = maxHeight * sheetPages.length + (sheetPages.length - 1) * 20;
      }
    }
    
    const sheet = {
      width: sheetWidth,
      height: sheetHeight,
      pages: sheetPages,
      orientation: orientation,
      grid: {
        cols: orientation === 'horizontal' ? sheetPages.length : 1,
        rows: orientation === 'horizontal' ? 1 : sheetPages.length,
        cellWidth: sheetWidth / (orientation === 'horizontal' ? sheetPages.length : 1),
        cellHeight: sheetHeight / (orientation === 'horizontal' ? 1 : sheetPages.length)
      }
    };
    
    mergedSheets.push(sheet);
  }
  
  return mergedSheets;
};

/**
 * Save multiple files as ZIP with intelligent naming
 * @param {Array} files - Array of {name, data, sheetIndex?, pageNumber?} objects
 * @param {string} zipName - ZIP filename
 * @returns {Promise<boolean>} - Success status
 */
const savePagesAsZIP = async (files, zipName = 'pages.zip') => {
  try {
    const zip = new JSZip();
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Add each file to zip with organized folder structure
    files.forEach((file, index) => {
      let folderPath = '';
      let fileName = file.name;
      
      // Organize by file type if we can detect it
      if (file.name.includes('sheet-')) {
        folderPath = 'merged-sheets/';
      } else if (file.name.includes('page-')) {
        folderPath = 'pages/';
        // Add zero-padded index for proper sorting: 001, 002, etc.
        const paddedIndex = (index + 1).toString().padStart(3, '0');
        fileName = fileName.replace(/(page-)(\d+)/, `$1${paddedIndex}`);
      }
      
      // Add metadata to filename
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      const extension = fileName.match(/\.[^/.]+$/)?.[0] || '.png';
      const finalName = `${baseName}_${timestamp}${extension}`;
      
      zip.file(`${folderPath}${finalName}`, file.data);
    });
    
    // Add a README file with export information
    const readmeContent = `Export Summary
================
Generated: ${now.toISOString()}
Total Files: ${files.length}
Files:
${files.map((f, i) => `  ${i + 1}. ${f.name} (${Math.round(f.data.size / 1024)} KB)`).join('\n')}

Export Settings:
- Format: ${files[0]?.name.includes('.png') ? 'PNG' : 'Unknown'}
- Pages: ${files.length}
- Compression: Optimal

Notes:
- Files are organized in folders by type
- Timestamps ensure unique filenames
- Use index-sorted names for proper ordering`;
    
    zip.file('README.txt', readmeContent);
    
    // Generate zip file with compression
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Save zip file
    saveAs(zipBlob, zipName);
    
    console.log(`ZIP created: ${zipName} with ${files.length} files`);
    return true;
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw error;
  }
};

/**
 * Export multiple pages as separate PDF pages with quality optimization
 * @param {Array} pages - Array of page data
 * @param {Object} pageOptions - Export options
 * @param {string} filename - Base filename
 * @returns {Promise<Object>} - Export result
 */
export const exportPagesToPDF = async (pages, pageOptions, filename = 'design') => {
  try {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      throw new Error('No pages to export');
    }
    
    const { selectedPages = [], textProperties = {} } = pageOptions;
    const pagesToExport = selectedPages.length > 0 
      ? pages.filter((_, index) => selectedPages.includes(index))
      : pages;
    
    if (pagesToExport.length === 0) {
      throw new Error('No pages selected for export');
    }
    
    // Always use standard A4 dimensions for PDF export
    const PAGE_WIDTH = STANDARD_A4_WIDTH;
    const PAGE_HEIGHT = STANDARD_A4_HEIGHT;
    
    console.log('📄 Exporting PDF with standard A4 dimensions:', {
      pages: pagesToExport.length,
      dimensions: `${PAGE_WIDTH}x${PAGE_HEIGHT}px`,
      textProperties: Object.keys(textProperties).length > 0
    });
    
    // Create PDF with high quality settings
    const pdf = new jsPDF({
      orientation: PAGE_WIDTH > PAGE_HEIGHT ? 'landscape' : 'portrait',
      unit: 'px',
      format: [PAGE_WIDTH, PAGE_HEIGHT],
      compress: true
    });
    
    // Add each page
    for (let i = 0; i < pagesToExport.length; i++) {
      const pageData = pagesToExport[i];
      const originalWidth = pageData.width || PAGE_WIDTH;
      const originalHeight = pageData.height || PAGE_HEIGHT;
      
      // Calculate scale to fit within A4 while maintaining aspect ratio
      const scaleX = PAGE_WIDTH / originalWidth;
      const scaleY = PAGE_HEIGHT / originalHeight;
      const scale = Math.min(scaleX, scaleY); // Uniform scale to fit
      
      console.log(`📐 Scaling page ${i + 1}:`, {
        original: `${Math.round(originalWidth)}x${Math.round(originalHeight)}`,
        target: `${PAGE_WIDTH}x${PAGE_HEIGHT}`,
        scale: scale.toFixed(3),
        scaled: `${Math.round(originalWidth * scale)}x${Math.round(originalHeight * scale)}`,
        fitsPerfectly: scale >= 1 ? 'Yes (no scaling needed)' : 'Yes (scaled down)'
      });
      
      // Scale elements to fit A4
      const scaledElements = pageData.elements?.map(element => {
        const scaledElement = { ...element };
        
        // Scale position
        scaledElement.x = (element.x || 0) * scale;
        scaledElement.y = (element.y || 0) * scale;
        
        // Scale dimensions
        if (scaledElement.width) scaledElement.width *= scale;
        if (scaledElement.height) scaledElement.height *= scale;
        if (scaledElement.radius) scaledElement.radius *= scale;
        
        // Scale line points if present
        if (scaledElement.points && Array.isArray(scaledElement.points)) {
          scaledElement.points = scaledElement.points.map(point => point * scale);
        }
        
        // Special handling for text elements - scale font size
        if (scaledElement.type === 'text' && scaledElement.fontSize) {
          scaledElement.fontSize *= scale;
          
          // Ensure minimum readable font size after scaling
          const MIN_FONT_SIZE = 6;
          if (scaledElement.fontSize < MIN_FONT_SIZE) {
            console.warn(`⚠️ Font size ${scaledElement.fontSize.toFixed(1)}px is too small on page ${i + 1}, adjusting to ${MIN_FONT_SIZE}px`);
            scaledElement.fontSize = MIN_FONT_SIZE;
          }
        }
        
        // For images, calculate optimal scaling
        if (scaledElement.type === 'image') {
          // Images will be handled by scaleImageForPDF later
          // Store original dimensions for reference
          scaledElement._originalWidth = element.width;
          scaledElement._originalHeight = element.height;
          scaledElement._scaleFactor = scale;
        }
        
        return scaledElement;
      }) || [];
      
      // Create scaled page data
      const scaledPageData = {
        ...pageData,
        elements: scaledElements,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        _scaleFactor: scale,
        _originalDimensions: `${originalWidth}x${originalHeight}`
      };
      
      // Create canvas for this page with high DPI and text enhancement
      const canvas = await renderPageToCanvas(
        scaledPageData,
        { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        2, // High DPI
        textProperties // Pass text properties for enhancement
      );
      
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG
      
      // Add page (except first page which is already created)
      if (i > 0) {
        pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      }
      
      // Add scaled content to PDF
      pdf.addImage(
        dataURL,
        'JPEG',
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        undefined,
        'MEDIUM'
      );
      
      // Add page number footer
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i + 1} of ${pagesToExport.length}`,
        PAGE_WIDTH / 2,
        PAGE_HEIGHT - 20,
        { align: 'center' }
      );
      
      // Add scaling info in footer if scaled
      if (scale < 0.95 || scale > 1.05) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Scaled ${scale < 1 ? 'down' : 'up'} to ${Math.round(scale * 100)}%`,
          PAGE_WIDTH - 60,
          PAGE_HEIGHT - 10
        );
      }
      
      // Add quality indicator for OCR content
      const ocrElements = pageData.elements?.filter(e => e.source === 'ocr') || [];
      if (ocrElements.length > 0) {
        const avgConfidence = ocrElements.reduce((sum, el) => 
          sum + (el.metadata?.ocrConfidence || 0), 0) / ocrElements.length;
        
        if (avgConfidence < 0.8) {
          pdf.setFontSize(8);
          pdf.setTextColor(255, 0, 0);
          pdf.text(
            `OCR Confidence: ${Math.round(avgConfidence * 100)}%`,
            20,
            PAGE_HEIGHT - 10
          );
        }
      }
    }
    
    // Save PDF
    const finalFilename = `${filename}-${Date.now()}.pdf`;
    pdf.save(finalFilename);
    
    console.log('✅ PDF export complete:', {
      filename: finalFilename,
      pages: pagesToExport.length,
      dimensions: `${PAGE_WIDTH}x${PAGE_HEIGHT}px`,
      quality: 'high'
    });
    
    return {
      success: true,
      filename: finalFilename,
      pagesExported: pagesToExport.length,
      format: 'pdf',
      quality: 'high',
      dimensions: `${PAGE_WIDTH}x${PAGE_HEIGHT}`,
      textEnhancement: Object.keys(textProperties).length > 0,
      scalingApplied: true
    };
  } catch (error) {
    console.error('Error exporting pages to PDF:', error);
    throw error;
  }
};

/**
 * Export multiple pages as separate PNG files with proper scaling
 * @param {Array} pages - Array of page data
 * @param {Object} pageOptions - Export options
 * @param {string} filename - Base filename
 * @returns {Promise<Object>} - Export result
 */
export const exportPagesToPNG = async (pages, pageOptions, filename = 'design') => {
  try {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      throw new Error('No pages to export');
    }
    
    const { selectedPages = [] } = pageOptions;
    const pagesToExport = selectedPages.length > 0 
      ? pages.filter((_, index) => selectedPages.includes(index))
      : pages;
    
    if (pagesToExport.length === 0) {
      throw new Error('No pages selected for export');
    }
    
    const files = [];
    const TARGET_WIDTH = STANDARD_A4_WIDTH;
    const TARGET_HEIGHT = STANDARD_A4_HEIGHT;
    
    // Export each page
    for (let i = 0; i < pagesToExport.length; i++) {
      const pageData = pagesToExport[i];
      const pageWidth = pageData.width || TARGET_WIDTH;
      const pageHeight = pageData.height || TARGET_HEIGHT;
      
      // Calculate scale to fit within A4 while maintaining aspect ratio
      const scaleX = TARGET_WIDTH / pageWidth;
      const scaleY = TARGET_HEIGHT / pageHeight;
      const scale = Math.min(scaleX, scaleY); // Scale uniformly to fit
      
      // Calculate centered position
      const scaledWidth = pageWidth * scale;
      const scaledHeight = pageHeight * scale;
      const offsetX = (TARGET_WIDTH - scaledWidth) / 2;
      const offsetY = (TARGET_HEIGHT - scaledHeight) / 2;
      
      console.log(`🖼️ PNG Page ${i + 1} Scaling:`, {
        original: `${pageWidth}x${pageHeight}`,
        target: `${TARGET_WIDTH}x${TARGET_HEIGHT}`,
        scale: scale.toFixed(3),
        scaled: `${Math.round(scaledWidth)}x${Math.round(scaledHeight)}`,
        offset: `(${Math.round(offsetX)}, ${Math.round(offsetY)})`
      });
      
      // Scale elements to fit within centered area
      const scaledElements = pageData.elements?.map(element => {
        const scaledElement = { ...element };
        
        // Scale position and adjust for centering
        scaledElement.x = ((element.x || 0) * scale) + offsetX;
        scaledElement.y = ((element.y || 0) * scale) + offsetY;
        
        // Scale dimensions
        if (scaledElement.width) scaledElement.width *= scale;
        if (scaledElement.height) scaledElement.height *= scale;
        if (scaledElement.radius) scaledElement.radius *= scale;
        
        // Scale font size for text elements
        if (scaledElement.type === 'text' && scaledElement.fontSize) {
          scaledElement.fontSize *= scale;
          
          // Ensure minimum readable font size
          const MIN_FONT_SIZE = 8;
          if (scaledElement.fontSize < MIN_FONT_SIZE) {
            scaledElement.fontSize = MIN_FONT_SIZE;
          }
        }
        
        return scaledElement;
      }) || [];
      
      // Create scaled page data
      const scaledPageData = {
        ...pageData,
        elements: scaledElements,
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT
      };
      
      // Render page to canvas
      const canvas = await renderPageToCanvas(
        scaledPageData,
        { width: TARGET_WIDTH, height: TARGET_HEIGHT },
        2
      );
      
      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      // Create file data
      const pageNumber = selectedPages.length > 0 
        ? selectedPages[i] + 1 
        : i + 1;
      
      files.push({
        name: `${filename}-page-${pageNumber}.png`,
        data: blob,
        pageNumber,
        dimensions: {
          original: `${pageWidth}x${pageHeight}`,
          exported: `${TARGET_WIDTH}x${TARGET_HEIGHT}`,
          content: `${Math.round(scaledWidth)}x${Math.round(scaledHeight)}`,
          scaleFactor: scale,
          centered: true
        }
      });
    }
    
    // Save as ZIP if multiple files
    if (files.length > 1) {
      const zipFilename = `${filename}-pages-${Date.now()}.zip`;
      await savePagesAsZIP(files, zipFilename);
      
      return {
        success: true,
        filename: zipFilename,
        pagesExported: pagesToExport.length,
        format: 'png',
        asZip: true,
        centered: true,
        dimensions: `${TARGET_WIDTH}x${TARGET_HEIGHT}`
      };
    } else {
      // Single file, save directly
      saveAs(files[0].data, files[0].name);
      
      return {
        success: true,
        filename: files[0].name,
        pagesExported: 1,
        format: 'png',
        asZip: false,
        centered: true,
        dimensions: `${TARGET_WIDTH}x${TARGET_HEIGHT}`
      };
    }
  } catch (error) {
    console.error('Error exporting pages to PNG:', error);
    throw error;
  }
};

/**
 * Export merged pages to PDF with quality optimization and orientation support
 * @param {Array} pages - Array of page data
 * @param {Object} pageOptions - Export options
 * @param {string} filename - Base filename
 * @param {boolean} previewMode - If true, returns data URL for preview instead of saving
 * @returns {Promise<Object>} - Export result with PDF data URL or saved file info
 */
export const exportMergedPagesToPDF = async (pages, pageOptions, filename = 'design', previewMode = false) => {
  try {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      throw new Error('No pages to export');
    }
    
    const { 
      mergeRatio = 2, 
      selectedPages = [], 
      canvasSize,
      textProperties = {},
      mergeOrientation = 'vertical',
      mergeAddBorders = true,
      mergeBorderColor = '#3498db',
      mergeBorderWidth = 1,
      mergeAddPageNumbers = true,
      mergePageNumberBackground = 'rgba(52, 152, 219, 0.9)',
      mergePageNumberColor = '#ffffff',
      mergeAddSheetInfo = true,
      mergeAddHeaders = true
    } = pageOptions;
    
    const pagesToExport = selectedPages.length > 0 
      ? pages.filter((_, index) => selectedPages.includes(index))
      : pages;
    
    if (pagesToExport.length === 0) {
      throw new Error('No pages selected for export');
    }
    
    // Create merged layout with orientation support
    const mergedSheets = createMergedLayout(pagesToExport, mergeRatio, mergeOrientation, canvasSize);
    
    // Determine PDF dimensions
    const pdfWidth = canvasSize?.width || mergedSheets[0].width;
    const pdfHeight = canvasSize?.height || mergedSheets[0].height;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight],
      compress: true
    });
    
    // Add cover page if not in preview mode
    if (!previewMode && mergeAddHeaders) {
      pdf.setFontSize(24);
      pdf.setTextColor(44, 62, 80);
      pdf.text('MERGED DOCUMENT EXPORT', pdf.internal.pageSize.width / 2, 50, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Total Pages: ${pagesToExport.length}`, 50, 100);
      pdf.text(`Sheets: ${mergedSheets.length}`, 50, 120);
      pdf.text(`Merge Ratio: ${mergeRatio} pages per sheet`, 50, 140);
      pdf.text(`Orientation: ${mergeOrientation}`, 50, 160);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 50, 180);
    }
    
    // Array to store preview images for each sheet
    const previewImages = [];
    
    // Add each merged sheet
    for (let sheetIndex = 0; sheetIndex < mergedSheets.length; sheetIndex++) {
      const sheet = mergedSheets[sheetIndex];
      
      // Calculate optimal scale to fit canvas size
      const scaleFactor = canvasSize ? 
        Math.min(
          (canvasSize.width || sheet.width) / sheet.width,
          (canvasSize.height || sheet.height) / sheet.height,
          1
        ) : 1;
      
      const targetWidth = sheet.width * scaleFactor;
      const targetHeight = sheet.height * scaleFactor;
      
      // Create high-quality canvas for the sheet
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = targetWidth;
      sheetCanvas.height = targetHeight;
      const sheetCtx = sheetCanvas.getContext('2d');
      
      // Set ultra-high-quality rendering
      sheetCtx.imageSmoothingEnabled = true;
      sheetCtx.imageSmoothingQuality = 'high';
      sheetCtx.fillStyle = '#ffffff';
      sheetCtx.fillRect(0, 0, targetWidth, targetHeight);
      
      const { cols, rows, cellWidth, cellHeight } = sheet.grid;
      const scaledGap = 20 * scaleFactor;
      
      // Add sheet header in preview mode or if headers are enabled
      const headerHeight = 40 * scaleFactor;
      if (previewMode || mergeAddSheetInfo) {
        sheetCtx.fillStyle = '#2c3e50';
        sheetCtx.fillRect(0, 0, targetWidth, headerHeight);
        sheetCtx.fillStyle = '#ffffff';
        sheetCtx.font = `bold ${16 * scaleFactor}px Arial`;
        sheetCtx.textAlign = 'center';
        sheetCtx.fillText(`Sheet ${sheetIndex + 1} of ${mergedSheets.length}`, targetWidth / 2, 25 * scaleFactor);
        sheetCtx.font = `${12 * scaleFactor}px Arial`;
        sheetCtx.fillText(`${cols}×${rows} Grid | ${mergeRatio} pages/sheet | ${mergeOrientation}`, targetWidth / 2, 45 * scaleFactor);
        sheetCtx.textAlign = 'left';
      }
      
      // Draw each page in the grid
      for (let i = 0; i < sheet.pages.length; i++) {
        const pageData = sheet.pages[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = col * (cellWidth + scaledGap);
        const y = ((previewMode || mergeAddSheetInfo) ? headerHeight + 20 * scaleFactor : 0) + row * (cellHeight + scaledGap);
        
        // Calculate optimal scaling for this page
        const padding = 10 * scaleFactor;
        const scaleX = (cellWidth - padding) / pageData.width;
        const scaleY = (cellHeight - padding) / pageData.height;
        const scale = Math.min(scaleX, scaleY, 2);
        
        const scaledWidth = pageData.width * scale;
        const scaledHeight = pageData.height * scale;
        const offsetX = (cellWidth - scaledWidth) / 2;
        const offsetY = (cellHeight - scaledHeight) / 2;
        
        // Render page with enhanced text
        const pageCanvas = await renderPageToCanvas(
          pageData,
          { width: pageData.width, height: pageData.height },
          Math.max(scale, 2), // High DPI
          textProperties
        );
        
        // Draw to sheet canvas
        sheetCtx.save();
        sheetCtx.imageSmoothingEnabled = true;
        sheetCtx.imageSmoothingQuality = 'high';
        sheetCtx.drawImage(
          pageCanvas,
          x + offsetX,
          y + offsetY,
          scaledWidth,
          scaledHeight
        );
        sheetCtx.restore();
        
        // Add border (using 'rows' variable to fix ESLint error)
        if (mergeAddBorders !== false) {
          sheetCtx.strokeStyle = mergeBorderColor;
          sheetCtx.lineWidth = mergeBorderWidth * scaleFactor;
          
          // Optionally add thicker border for first/last cells using 'rows'
          if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
            sheetCtx.lineWidth *= 2;
          }
          
          sheetCtx.strokeRect(x, y, cellWidth, cellHeight);
        }
        
        // Add page number
        if (mergeAddPageNumbers !== false) {
          const pageNumber = (sheetIndex * mergeRatio) + i + 1;
          sheetCtx.fillStyle = mergePageNumberBackground;
          sheetCtx.fillRect(x + 5 * scaleFactor, y + 5 * scaleFactor, 50 * scaleFactor, 20 * scaleFactor);
          sheetCtx.fillStyle = mergePageNumberColor;
          sheetCtx.font = `bold ${10 * scaleFactor}px Arial`;
          sheetCtx.fillText(`Pg ${pageNumber}`, x + 10 * scaleFactor, y + 18 * scaleFactor);
        }
      }
      
      // Add sheet footer in preview mode
      if (previewMode) {
        const footerHeight = 20 * scaleFactor;
        sheetCtx.fillStyle = '#34495e';
        sheetCtx.fillRect(0, targetHeight - footerHeight, targetWidth, footerHeight);
        sheetCtx.fillStyle = '#ecf0f1';
        sheetCtx.font = `${9 * scaleFactor}px Arial`;
        sheetCtx.textAlign = 'center';
        sheetCtx.fillText(
          `${filename} | ${new Date().toLocaleDateString()}`,
          targetWidth / 2,
          targetHeight - 6 * scaleFactor
        );
        sheetCtx.textAlign = 'left';
      }
      
      // Convert to data URL
      const sheetDataURL = sheetCanvas.toDataURL('image/jpeg', 0.95);
      
      // Store preview image
      previewImages.push(sheetDataURL);
      
      // Add to PDF if not in preview mode
      if (!previewMode) {
        if (sheetIndex > 0) {
          pdf.addPage([pdfWidth, pdfHeight]);
        }
        
        pdf.addImage(
          sheetDataURL,
          'JPEG',
          0,
          0,
          pdfWidth,
          pdfHeight,
          undefined,
          'MEDIUM'
        );
      }
    }
    
    // Handle preview mode - return data URLs instead of saving
    if (previewMode) {
      return {
        success: true,
        previewMode: true,
        sheets: mergedSheets.length,
        pages: pagesToExport.length,
        previewImages: previewImages,
        sheetCount: mergedSheets.length,
        pageCount: pagesToExport.length,
        mergeRatio,
        mergeOrientation,
        gridLayout: `${mergedSheets[0]?.grid?.cols || 1}x${mergedSheets[0]?.grid?.rows || 1}`,
        format: 'jpg',
        quality: 'high'
      };
    }
    
    // Save PDF (export mode)
    const finalFilename = `${filename}-merged-${mergeOrientation}-${mergeRatio}pp-${Date.now()}.pdf`;
    pdf.save(finalFilename);
    
    return {
      success: true,
      filename: finalFilename,
      sheetsExported: mergedSheets.length,
      pagesExported: pagesToExport.length,
      mergeRatio,
      mergeOrientation,
      gridLayout: `${mergedSheets[0]?.grid?.cols || 1}x${mergedSheets[0]?.grid?.rows || 1}`,
      format: 'pdf',
      quality: 'high',
      hasCoverPage: mergeAddHeaders
    };
  } catch (error) {
    console.error('Error exporting merged pages to PDF:', error);
    throw error;
  }
};

/**
 * Generate preview of merged pages
 * @param {Array} pages - Pages to preview
 * @param {Object} options - Preview options
 * @returns {Promise<HTMLCanvasElement>} - Preview canvas
 */
export const generatePreview = async (pages, options = {}) => {
  try {
    const {
      mergeRatio = 2,
      mergeOrientation = 'vertical',
      canvasSize = { width: 800, height: 600 },
      textProperties = {},
      scale = 0.5
    } = options;
    
    // Create merged layout
    const mergedSheets = createMergedLayout(pages, mergeRatio, mergeOrientation, canvasSize);
    
    if (mergedSheets.length === 0) {
      throw new Error('No sheets to preview');
    }
    
    // Take first sheet for preview
    const sheet = mergedSheets[0];
    
    // Create preview canvas
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = canvasSize.width * scale;
    previewCanvas.height = canvasSize.height * scale;
    const previewCtx = previewCanvas.getContext('2d');
    
    // Fill background
    previewCtx.fillStyle = options.previewBackground || '#f5f5f5';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Draw sheet preview
    const { cols, rows, cellWidth, cellHeight } = sheet.grid;
    
    // Add grid lines if previewing multiple pages
    if (sheet.pages.length > 1) {
      previewCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      previewCtx.lineWidth = 0.5;
      
      // Draw vertical grid lines using cols
      for (let c = 0; c <= cols; c++) {
        const x = c * (cellWidth * scale);
        previewCtx.beginPath();
        previewCtx.moveTo(x, 0);
        previewCtx.lineTo(x, previewCanvas.height);
        previewCtx.stroke();
      }
      
      // Draw horizontal grid lines using rows
      for (let r = 0; r <= rows; r++) {
        const y = r * (cellHeight * scale);
        previewCtx.beginPath();
        previewCtx.moveTo(0, y);
        previewCtx.lineTo(previewCanvas.width, y);
        previewCtx.stroke();
      }
    }
    
    for (let i = 0; i < Math.min(sheet.pages.length, mergeRatio); i++) {
      const pageData = sheet.pages[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const x = col * (cellWidth * scale);
      const y = row * (cellHeight * scale);
      
      // Render page at preview scale
      const pageCanvas = await renderPageToCanvas(
        pageData,
        { width: pageData.width, height: pageData.height },
        scale, // Lower DPI for preview
        textProperties
      );
      
      // Calculate scaled dimensions
      const pageScale = Math.min(
        (cellWidth * scale) / pageData.width,
        (cellHeight * scale) / pageData.height
      );
      
      const scaledWidth = pageData.width * pageScale;
      const scaledHeight = pageData.height * pageScale;
      const offsetX = (cellWidth * scale - scaledWidth) / 2;
      const offsetY = (cellHeight * scale - scaledHeight) / 2;
      
      previewCtx.drawImage(
        pageCanvas,
        x + offsetX,
        y + offsetY,
        scaledWidth,
        scaledHeight
      );
      
      // Draw border with different style for outer cells using rows
      const isOuterCell = row === 0 || row === rows - 1 || col === 0 || col === cols - 1;
      previewCtx.strokeStyle = isOuterCell ? '#3498db' : '#cccccc';
      previewCtx.lineWidth = isOuterCell ? 2 : 1;
      previewCtx.strokeRect(x, y, cellWidth * scale, cellHeight * scale);
      
      // Add page number
      previewCtx.fillStyle = 'rgba(52, 152, 219, 0.9)';
      previewCtx.fillRect(x + 5, y + 5, 35, 16);
      previewCtx.fillStyle = '#ffffff';
      previewCtx.font = 'bold 10px Arial';
      previewCtx.fillText(`Pg ${i + 1}`, x + 8, y + 16);
    }
    
    // Add sheet info text using rows and cols
    previewCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    previewCtx.font = 'bold 12px Arial';
    previewCtx.fillText(
      `${cols}×${rows} Grid | ${mergeRatio}pp | ${mergeOrientation}`,
      10,
      previewCanvas.height - 10
    );
    
    return previewCanvas;
  } catch (error) {
    console.error('Error generating preview:', error);
    throw error;
  }
};

/**
 * Export merged pages to PNG with quality optimization
 * @param {Array} pages - Array of page data
 * @param {Object} pageOptions - Export options
 * @param {string} filename - Base filename
 * @returns {Promise<Object>} - Export result
 */
export const exportMergedPagesToPNG = async (pages, pageOptions, filename = 'design') => {
  try {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      throw new Error('No pages to export');
    }
    
    const { mergeRatio = 2, selectedPages = [], canvasSize } = pageOptions;
    const pagesToExport = selectedPages.length > 0 
      ? pages.filter((_, index) => selectedPages.includes(index))
      : pages;
    
    if (pagesToExport.length === 0) {
      throw new Error('No pages selected for export');
    }
    
    // Create merged layout with quality optimization
    const mergedSheets = createMergedLayout(pagesToExport, mergeRatio, canvasSize);
    const files = [];
    
    // Export each merged sheet
    for (let sheetIndex = 0; sheetIndex < mergedSheets.length; sheetIndex++) {
      const sheet = mergedSheets[sheetIndex];
      
      // Calculate scaling factor based on canvasSize for quality optimization
      const scaleFactor = canvasSize ? 
        Math.min(
          (canvasSize.width || sheet.width) / sheet.width,
          (canvasSize.height || sheet.height) / sheet.height,
          2 // Max 2x scaling for quality
        ) : 1.5; // Default 1.5x scaling for better quality
      
      const targetWidth = Math.round(sheet.width * scaleFactor);
      const targetHeight = Math.round(sheet.height * scaleFactor);
      
      // Create canvas for the sheet with high resolution
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = targetWidth;
      sheetCanvas.height = targetHeight;
      const sheetCtx = sheetCanvas.getContext('2d');
      
      // Set high-quality rendering
      sheetCtx.imageSmoothingEnabled = true;
      sheetCtx.imageSmoothingQuality = 'high';
      
      // White background
      sheetCtx.fillStyle = '#ffffff';
      sheetCtx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Render each page in the grid
      const { cols, rows, cellWidth, cellHeight } = sheet.grid;
      
      // Calculate scaled dimensions
      const scaledCellWidth = cellWidth * scaleFactor;
      const scaledCellHeight = cellHeight * scaleFactor;
      const scaledGap = 20 * scaleFactor;
      
      // Draw grid lines and background for empty cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * (scaledCellWidth + scaledGap);
          const y = r * (scaledCellHeight + scaledGap);
          
          // Draw subtle grid background for empty cells
          if (r * cols + c >= sheet.pages.length) {
            sheetCtx.fillStyle = '#f5f5f5';
            sheetCtx.fillRect(x, y, scaledCellWidth, scaledCellHeight);
            sheetCtx.fillStyle = '#e0e0e0';
            sheetCtx.font = `italic ${14 * scaleFactor}px Arial`;
            sheetCtx.textAlign = 'center';
            sheetCtx.textBaseline = 'middle';
            sheetCtx.fillText('Empty', x + scaledCellWidth / 2, y + scaledCellHeight / 2);
            sheetCtx.textAlign = 'left';
            sheetCtx.textBaseline = 'top';
          }
        }
      }
      
      for (let i = 0; i < sheet.pages.length; i++) {
        const pageData = sheet.pages[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = col * (scaledCellWidth + scaledGap);
        const y = row * (scaledCellHeight + scaledGap);
        
        // Calculate optimal scaling for page within cell with high DPI
        const cellPadding = 5 * scaleFactor;
        const scaleX = (scaledCellWidth - cellPadding) / pageData.width;
        const scaleY = (scaledCellHeight - cellPadding) / pageData.height;
        const scale = Math.min(scaleX, scaleY, 2); // Allow up to 2x scaling for high quality
        
        const scaledWidth = pageData.width * scale;
        const scaledHeight = pageData.height * scale;
        const offsetX = (scaledCellWidth - scaledWidth) / 2;
        const offsetY = (scaledCellHeight - scaledHeight) / 2;
        
        // Render page with high DPI
        const pageCanvas = await renderPageToCanvas(
          pageData,
          { width: pageData.width, height: pageData.height },
          Math.max(scale, 2) // High DPI for quality
        );
        
        // Draw scaled page to sheet with high-quality rendering
        sheetCtx.save();
        sheetCtx.imageSmoothingEnabled = true;
        sheetCtx.imageSmoothingQuality = 'high';
        sheetCtx.drawImage(
          pageCanvas,
          x + offsetX,
          y + offsetY,
          scaledWidth,
          scaledHeight
        );
        sheetCtx.restore();
        
        // Add border with different colors based on position
        const borderColor = row === 0 && col === 0 ? '#4a90e2' : 
                           row === rows - 1 && col === cols - 1 ? '#e24a4a' : 
                           '#cccccc';
        sheetCtx.strokeStyle = borderColor;
        sheetCtx.lineWidth = 1.5 * scaleFactor;
        sheetCtx.strokeRect(x, y, scaledCellWidth, scaledCellHeight);
        
        // Add page number with background for better visibility
        const pageNumber = (sheetIndex * mergeRatio) + i + 1;
        sheetCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        sheetCtx.fillRect(x + 3 * scaleFactor, y + 3 * scaleFactor, 45 * scaleFactor, 16 * scaleFactor);
        sheetCtx.fillStyle = '#333333';
        sheetCtx.font = `bold ${10 * scaleFactor}px Arial`;
        sheetCtx.fillText(`Page ${pageNumber}`, x + 5 * scaleFactor, y + 15 * scaleFactor);
        
        // Add page dimensions info
        sheetCtx.fillStyle = '#666666';
        sheetCtx.font = `${8 * scaleFactor}px Arial`;
        sheetCtx.fillText(
          `${Math.round(pageData.width)}×${Math.round(pageData.height)}`,
          x + scaledCellWidth - 45 * scaleFactor,
          y + scaledCellHeight - 5 * scaleFactor
        );
      }
      
      // Add sheet header with info
      sheetCtx.fillStyle = '#333333';
      sheetCtx.font = `bold ${14 * scaleFactor}px Arial`;
      sheetCtx.textAlign = 'center';
      sheetCtx.fillText(
        `Sheet ${sheetIndex + 1}/${mergedSheets.length}`,
        targetWidth / 2,
        20 * scaleFactor
      );
      sheetCtx.font = `${10 * scaleFactor}px Arial`;
      sheetCtx.fillText(
        `${mergeRatio} pages per sheet | ${cols}×${rows} grid | Scale: ${scaleFactor.toFixed(2)}x`,
        targetWidth / 2,
        35 * scaleFactor
      );
      sheetCtx.textAlign = 'left';
      
      // Add quality info footer
      sheetCtx.fillStyle = '#2c3e50';
      sheetCtx.font = `${8 * scaleFactor}px Arial`;
      sheetCtx.textAlign = 'right';
      sheetCtx.fillText(
        `Quality: High | ${targetWidth}×${targetHeight}px`,
        targetWidth - 10 * scaleFactor,
        targetHeight - 10 * scaleFactor
      );
      sheetCtx.textAlign = 'left';
      
      // Convert to blob with high quality
      const blob = await new Promise((resolve) => {
        sheetCanvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      files.push({
        name: `${filename}-sheet-${sheetIndex + 1}-${cols}x${rows}-${targetWidth}x${targetHeight}.png`,
        data: blob,
        sheetIndex,
        gridSize: `${cols}x${rows}`,
        pagesInSheet: sheet.pages.length,
        dimensions: { width: targetWidth, height: targetHeight },
        scaleFactor: scaleFactor
      });
    }
    
    // Save as ZIP if multiple files
    if (files.length > 1) {
      const zipFilename = `${filename}-merged-sheets-${Date.now()}.zip`;
      await savePagesAsZIP(files, zipFilename);
      
      return {
        success: true,
        filename: zipFilename,
        sheetsExported: mergedSheets.length,
        pagesExported: pagesToExport.length,
        mergeRatio,
        gridSize: `${mergedSheets[0]?.grid?.cols || 1}x${mergedSheets[0]?.grid?.rows || 1}`,
        format: 'png',
        asZip: true,
        quality: 'high',
        usedCanvasSize: !!canvasSize
      };
    } else {
      // Single file
      saveAs(files[0].data, files[0].name);
      
      return {
        success: true,
        filename: files[0].name,
        sheetsExported: 1,
        pagesExported: pagesToExport.length,
        mergeRatio,
        gridSize: `${mergedSheets[0]?.grid?.cols || 1}x${mergedSheets[0]?.grid?.rows || 1}`,
        format: 'png',
        asZip: false,
        quality: 'high',
        usedCanvasSize: !!canvasSize
      };
    }
  } catch (error) {
    console.error('Error exporting merged pages to PNG:', error);
    throw error;
  }
};

/**
 * Scale image to fit within PDF page dimensions while preserving original quality
 * @param {HTMLImageElement|Object} image - Image element with original dimensions
 * @param {Object} targetPageSize - Target page dimensions {width, height}
 * @param {Object} element - The canvas element data (with x, y, etc.)
 * @returns {Object} - Scaled dimensions and position
 */
export const scaleImageForPDF = (image, targetPageSize, element = null) => {
  // Get original image dimensions
  const originalWidth = image.naturalWidth || image.width || 1;
  const originalHeight = image.naturalHeight || image.height || 1;
  
  // Target page size (with margins)
  const pageWidth = targetPageSize.width || STANDARD_A4_WIDTH;
  const pageHeight = targetPageSize.height || STANDARD_A4_HEIGHT;
  
  // Calculate margins (10% of page size)
  const marginX = pageWidth * 0.1;
  const marginY = pageHeight * 0.1;
  
  // Available space on page
  const availableWidth = pageWidth - (marginX * 2);
  const availableHeight = pageHeight - (marginY * 2);
  
  // Calculate scale to fit within available space
  const widthRatio = availableWidth / originalWidth;
  const heightRatio = availableHeight / originalHeight;
  
  // Use the smaller ratio to fit entire image
  const scale = Math.min(widthRatio, heightRatio, 1); // Don't scale up beyond 100%
  
  // Calculate final dimensions
  const finalWidth = originalWidth * scale;
  const finalHeight = originalHeight * scale;
  
  // Center on page or use element position
  let x, y;
  if (element && element.x !== undefined && element.y !== undefined) {
    // Use element position, scaled proportionally
    const positionScale = Math.min(
      pageWidth / (element.canvasWidth || pageWidth),
      pageHeight / (element.canvasHeight || pageHeight)
    );
    x = element.x * positionScale;
    y = element.y * positionScale;
  } else {
    // Center on page
    x = marginX + (availableWidth - finalWidth) / 2;
    y = marginY + (availableHeight - finalHeight) / 2;
  }
  
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
    originalWidth: originalWidth,
    originalHeight: originalHeight,
    scaleFactor: scale,
    fitsPerfectly: scale === 1
  };
};

/**
 * Get the best quality image source from an element
 * @param {Object} element - Canvas element with image data
 * @returns {Promise<string>} - Data URL of the image
 */
export const getBestQualityImage = async (element) => {
  return new Promise((resolve, reject) => {
    if (element.image && element.image.src) {
      // If we have an HTMLImageElement, get highest quality
      const img = element.image;
      
      // Create a canvas to extract high-quality version
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get PNG data URL (highest quality)
      const dataURL = canvas.toDataURL('image/png', 1.0);
      resolve(dataURL);
    } else if (element.src) {
      // Load from source URL
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = reject;
      img.src = element.src;
    } else {
      reject(new Error('No image source found'));
    }
  });
};

/**
 * Generate PDF from elements with enhanced text clarity and quality optimization
 * @param {Object} exportPayload - Export data including elements and canvasSize
 * @param {Object} pageOptions - Page options for export
 * @returns {Promise<Object>} - Export result
 */
export const generatePDFFromElements = async (exportPayload, pageOptions = {}) => {
  try {
    const { 
      elements = [], 
      canvasSize = { width: 794, height: 1123 }, 
      pages = [],
      metadata = {},
      textProperties = {}
    } = exportPayload;

    console.log('📄 Generating PDF from elements:', {
      elementCount: elements?.length,
      canvasSize: canvasSize, // FIXED: Changed from exportCanvasSize to canvasSize
      pageCount: pages.length || 0
    });

    // Check if we have any elements to export
    if (elements.length === 0 && pages.length === 0) {
      throw new Error('No content to export');
    }

    // Determine if this is an image-based export
    const isImageBased = elements.length === 0 || 
                        (elements.length === 1 && elements[0]?.type === 'image') ||
                        elements.every(el => el.type === 'image');

    let result;

    if (isImageBased && elements.length > 0 && elements[0]?.src) {
      console.log('🖼️ Creating high-quality PDF from image element(s)');
      
      // Use new high-quality PDF export
      result = await exportToHighQualityPDF(
        elements,
        { width: canvasSize.width, height: canvasSize.height },
        textProperties,
        metadata
      );
      
    } else if (pages.length > 0) {
      console.log('📑 Creating multi-page PDF from pages:', pages.length);
      
      // Use the existing exportPagesToPDF function for multi-page documents
      result = await exportPagesToPDF(
        pages,
        {
          selectedPages: pageOptions.selectedPages || Array.from({ length: pages.length }, (_, i) => i),
          canvasSize: canvasSize,
          textProperties: textProperties // Pass text properties for clarity
        },
        pageOptions.filename || 'design'
      );
      
    } else {
      console.log('🎨 Creating PDF from canvas elements with enhanced text clarity');
      
      // Create a temporary canvas to render elements with high DPI
      const tempCanvas = document.createElement('canvas');
      const pixelRatio = 2; // High DPI for text clarity
      tempCanvas.width = canvasSize.width * pixelRatio;
      tempCanvas.height = canvasSize.height * pixelRatio;
      const ctx = tempCanvas.getContext('2d');
      
      // Set high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Scale for high DPI
      ctx.scale(pixelRatio, pixelRatio);
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Array to track image loading promises
      const imagePromises = [];
      
      // Enhanced text rendering for clarity
      const enhanceTextRendering = (ctx, element) => {
        // Apply text properties for clarity
        const fontSize = (element.fontSize || 12) * (textProperties.fontScale || 1);
        const fontFamily = element.fontFamily || textProperties.fontFamily || 'Arial, sans-serif';
        
        ctx.font = `${element.fontWeight || 'normal'} ${element.fontStyle || 'normal'} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = element.fill || textProperties.color || '#000000';
        ctx.textAlign = element.textAlign || textProperties.align || 'left';
        ctx.textBaseline = 'top';
        
        // Apply text shadow for OCR text to enhance clarity
        if (element.source === 'ocr' || element.metadata?.ocrConfidence) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 1;
          ctx.shadowOffsetX = 0.5;
          ctx.shadowOffsetY = 0.5;
        }
      };
      
      // Render each element with enhanced quality
      for (const element of elements) {
        try {
          if (element.type === 'text' && textProperties.enhanceClarity) {
            // Enhanced text rendering for OCR content
            ctx.save();
            enhanceTextRendering(ctx, element);
            
            const lines = element.text ? element.text.split('\n') : [''];
            const lineHeight = (element.fontSize || 12) * 1.5;
            
            lines.forEach((line, index) => {
              // Draw text with slight offset for sharpness
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillText(
                line,
                (element.x || 0) + 0.5,
                (element.y || 0) + (index * lineHeight) + 0.5,
                element.width || 1000
              );
              
              // Main text
              ctx.fillStyle = element.fill || textProperties.color || '#000000';
              ctx.fillText(
                line,
                element.x || 0,
                (element.y || 0) + (index * lineHeight),
                element.width || 1000
              );
            });
            ctx.restore();
          } else {
            // Standard rendering for other elements
            const imagePromise = renderElementToContext(ctx, element);
            if (imagePromise) {
              imagePromises.push(imagePromise);
            }
          }
        } catch (elementError) {
          console.warn('Error rendering element:', elementError, element);
        }
      }
      
      // Wait for all images to load
      if (imagePromises.length > 0) {
        await Promise.all(imagePromises);
      }
      
      // Convert canvas to data URL
      const dataURL = tempCanvas.toDataURL('image/png');
      
      // Create PDF with proper dimensions
      const pdfWidth = canvasSize.width;
      const pdfHeight = canvasSize.height;
      
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });
      
      // Add image to PDF with quality optimization
      pdf.addImage(
        dataURL,
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        'MEDIUM'
      );
      
      // Add metadata if available
      if (metadata.documentType) {
        pdf.setProperties({
          title: metadata.documentType || 'PDF Design',
          subject: 'Exported from PDF Design Studio',
          author: metadata.author || 'PDF Design Studio',
          keywords: 'pdf, design, export, ocr',
          creator: 'PDF Design Studio'
        });
      }
      
      // Save the PDF
      const filename = pageOptions.filename || 
                      metadata.documentType || 
                      `design-export-${Date.now()}.pdf`;
      
      pdf.save(filename);
      
      result = {
        success: true,
        filename: filename,
        pagesExported: 1,
        isImageBased: false,
        textClarity: textProperties.enhanceClarity ? 'enhanced' : 'standard',
        pixelRatio: pixelRatio
      };
    }

    console.log('✅ PDF generation complete:', result);
    return {
      ...result,
      timestamp: new Date().toISOString(),
      textPropertiesUsed: Object.keys(textProperties).length > 0 ? textProperties : null
    };
    
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Save design data as JSON file
 * @param {Object|string} data - Design data (object or JSON string)
 * @param {string} filename - Optional filename
 */
export const exportToJSON = (data, filename = null) => {
  try {
    const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    const jsonString = JSON.stringify(jsonData, null, 2);
    const jsonBlob = new Blob([jsonString], {
      type: 'application/json'
    });
    
    saveAs(jsonBlob, filename || `pdf-design-${Date.now()}.json`);
    return true;
  } catch (error) {
    console.error('JSON export error:', error);
    throw new Error(`Failed to export JSON: ${error.message}`);
  }
};

/**
 * Generate HTML export with design metadata
 * @param {Object} data - Design data including elements, canvasSize, etc.
 */
const generateHTMLExport = (data) => {
  const designData = typeof data === 'string' ? JSON.parse(data) : data;
  
  // Calculate element statistics for metadata and styling
  const ocrElements = designData.elements?.filter(e => e.source === 'ocr' || e.metadata?.ocrConfidence) || [];
  const textElements = designData.elements?.filter(e => e.type === 'text') || [];
  const imageElements = designData.elements?.filter(e => e.type === 'image') || [];
  const otherElements = designData.elements?.filter(e => e.type !== 'text' && e.type !== 'image') || [];
  
  // Calculate average OCR confidence for stats
  const avgOCRConfidence = ocrElements.length > 0 
    ? ocrElements.reduce((sum, el) => sum + (el.metadata?.ocrConfidence || 0), 0) / ocrElements.length 
    : 0;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Design Export - ${designData.metadata?.documentType || 'Design'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .export-container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .export-header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .export-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .metadata-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border-left: 4px solid #667eea;
        }
        .metadata-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #e9ecef;
            padding-bottom: 8px;
        }
        .metadata-label { font-weight: 500; color: #718096; }
        .metadata-value { font-weight: 600; color: #2c3e50; }
        .elements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .element-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .element-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        .text-preview {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
            font-size: 0.9rem;
            line-height: 1.5;
            max-height: 150px;
            overflow-y: auto;
        }
        .image-preview {
            background: #EDF2F7;
            border: 1px solid #CBD5E0;
            border-radius: 6px;
            padding: 15px;
            margin-top: 10px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="export-container">
        <header class="export-header">
            <h1>📋 PDF Design Export</h1>
            <p class="subtitle">Professional Design Document • Exported on ${new Date().toLocaleDateString()}</p>
        </header>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; padding: 30px; background: #f8f9fa;">
            <div class="metadata-card">
                <h3>📐 Design Specifications</h3>
                <div class="metadata-item">
                    <span class="metadata-label">Canvas Size:</span>
                    <span class="metadata-value">${designData.canvasSize?.width || 794} × ${designData.canvasSize?.height || 1123} px</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Total Elements:</span>
                    <span class="metadata-value">${designData.elements?.length || 0}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">OCR Elements:</span>
                    <span class="metadata-value">${ocrElements.length} (${ocrElements.length > 0 ? Math.round(avgOCRConfidence * 100) : 0}% avg confidence)</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Text Elements:</span>
                    <span class="metadata-value">${textElements.length}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Image Elements:</span>
                    <span class="metadata-value">${imageElements.length}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Other Elements:</span>
                    <span class="metadata-value">${otherElements.length}</span>
                </div>
                ${designData.metadata?.canvasHeight ? `
                <div class="metadata-item">
                    <span class="metadata-label">Canvas Height:</span>
                    <span class="metadata-value">${designData.metadata.canvasHeight} px</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        ${designData.content ? `
        <div style="margin: 30px;">
            <h2 style="color: #2c3e50; margin-bottom: 15px;">📝 Content</h2>
            <div class="text-preview">
                ${designData.content.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}
        
        ${designData.elements && designData.elements.length > 0 ? `
        <section style="padding: 30px;">
            <h2 style="color: #2c3e50; margin-bottom: 25px;">🧩 Design Elements (${designData.elements.length})</h2>
            <div class="elements-grid">
                ${designData.elements.slice(0, 12).map((element, _index) => {
                    // Determine element category for styling
                    const isOCRElement = element.source === 'ocr' || element.metadata?.ocrConfidence;
                    const isTextElement = element.type === 'text';
                    const isImageElement = element.type === 'image';
                    
                    // Calculate reading order if available
                    const readingOrder = element.readingOrder || _index + 1;
                    const ocrConfidence = element.metadata?.ocrConfidence;
                    
                    // Determine styling based on element type
                    const getElementStyle = () => {
                        if (isOCRElement) return 'border-left: 4px solid #4CAF50; background: linear-gradient(to right, #F0FFF4, white);';
                        if (isTextElement) return 'border-left: 4px solid #4299E1; background: linear-gradient(to right, #EBF8FF, white);';
                        if (isImageElement) return 'border-left: 4px solid #ED8936; background: linear-gradient(to right, #FEF5E7, white);';
                        return 'border-left: 4px solid #9F7AEA; background: linear-gradient(to right, #FAF5FF, white);';
                    };
                    
                    const getElementIcon = () => {
                        if (isTextElement) return '📝';
                        if (isImageElement) return '🖼️';
                        if (element.type === 'rectangle') return '⬜';
                        if (element.type === 'circle') return '⭕';
                        if (element.type === 'line') return '📏';
                        return '🔷';
                    };
                    
                    return `
                        <div class="element-card" 
                             data-element-index="${_index}" 
                             data-element-id="${element.id || `element-${_index}`}"
                             data-element-type="${element.type}"
                             style="${getElementStyle()}">
                            
                            <!-- Element Header with Index and Type -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div>
                                    <span style="font-size: 0.8rem; color: #718096; font-weight: 600;">
                                        #${readingOrder} ${getElementIcon()}
                                    </span>
                                    <span style="display: inline-block; padding: 4px 12px; background: ${isOCRElement ? '#4CAF50' : (isTextElement ? '#4299E1' : (isImageElement ? '#ED8936' : '#9F7AEA'))}; color: white; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-left: 10px; text-transform: uppercase;">
                                        ${element.type}${isOCRElement ? ' (OCR)' : ''}
                                    </span>
                                </div>
                                
                                ${ocrConfidence ? `
                                <div style="font-size: 0.7rem; padding: 2px 8px; background: ${ocrConfidence > 0.9 ? '#4CAF50' : ocrConfidence > 0.7 ? '#FFC107' : '#F44336'}; color: white; border-radius: 10px;">
                                    OCR: ${Math.round(ocrConfidence * 100)}%
                                </div>
                                ` : ''}
                            </div>
                            
                            <!-- Element Content -->
                            <div style="margin-top: 15px;">
                                <!-- Position with coordinates -->
                                <div style="margin-bottom: 8px; font-size: 0.9rem;">
                                    <span style="color: #718096; font-weight: 500; display: inline-block; width: 80px;">Position:</span>
                                    <span style="color: #2c3e50; font-weight: 600;">
                                        (${Math.round(element.x || 0)}, ${Math.round(element.y || 0)})
                                    </span>
                                    ${element.rotation ? `
                                    <span style="color: #718096; font-weight: 500; display: inline-block; width: 80px; margin-left: 10px;">Rotation:</span>
                                    <span style="color: #2c3e50; font-weight: 600;">${Math.round(element.rotation)}°</span>
                                    ` : ''}
                                </div>
                                
                                <!-- Size Information -->
                                ${element.width ? `
                                <div style="margin-bottom: 8px; font-size: 0.9rem;">
                                    <span style="color: #718096; font-weight: 500; display: inline-block; width: 80px;">Size:</span>
                                    <span style="color: #2c3e50; font-weight: 600;">
                                        ${Math.round(element.width)} × ${Math.round(element.height || 0)}
                                    </span>
                                </div>
                                ` : ''}
                                
                                <!-- OCR-Specific Metadata -->
                                ${element.metadata?.pageNumber ? `
                                <div style="margin-bottom: 8px; font-size: 0.9rem;">
                                    <span style="color: #718096; font-weight: 500; display: inline-block; width: 80px;">Page:</span>
                                    <span style="color: #2c3e50; font-weight: 600;">${element.metadata.pageNumber}</span>
                                </div>
                                ` : ''}
                                
                                ${element.metadata?.blockType ? `
                                <div style="margin-bottom: 8px; font-size: 0.9rem;">
                                    <span style="color: #718096; font-weight: 500; display: inline-block; width: 80px;">Block Type:</span>
                                    <span style="color: #2c3e50; font-weight: 600; text-transform: capitalize;">
                                        ${element.metadata.blockType}
                                    </span>
                                </div>
                                ` : ''}
                                
                                <!-- Text Content -->
                                ${element.text ? `
                                <div class="text-preview">
                                    <div style="font-size: 0.8rem; color: #718096; margin-bottom: 5px; font-weight: 500;">
                                        Content:
                                    </div>
                                    <div style="font-family: ${element.fontFamily || 'inherit'}; 
                                                font-size: ${element.fontSize ? `${element.fontSize}px` : 'inherit'};
                                                font-weight: ${element.fontWeight || 'normal'};
                                                color: ${element.fill || '#2c3e50'};">
                                        ${element.text.substring(0, 200)}${element.text.length > 200 ? '...' : ''}
                                    </div>
                                    ${element.text.length > 200 ? `
                                    <div style="font-size: 0.8rem; color: #718096; margin-top: 5px;">
                                        ${element.text.length} characters total
                                    </div>
                                    ` : ''}
                                </div>
                                ` : ''}
                                
                                <!-- Image Preview -->
                                ${isImageElement && element.src ? `
                                <div class="image-preview">
                                    <div style="font-size: 0.8rem; color: #718096; margin-bottom: 5px; font-weight: 500;">
                                        Image Preview:
                                    </div>
                                    <div style="text-align: center; padding: 10px; background: white; border-radius: 4px; border: 1px solid #E2E8F0;">
                                        <div style="font-size: 0.8rem; color: #718096; margin-bottom: 5px;">
                                            ${element.src.substring(0, 50)}${element.src.length > 50 ? '...' : ''}
                                        </div>
                                        <div style="font-size: 0.7rem; color: #A0AEC0;">
                                            ${element.width || 0} × ${element.height || 0} px
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                                
                                <!-- Original OCR Text (if different from edited text) -->
                                ${element.metadata?.originalText && element.metadata.originalText !== element.text ? `
                                <div class="text-preview" style="background: #FFF3E0; border-color: #FFB74D; margin-top: 10px;">
                                    <div style="font-size: 0.8rem; color: #E65100; margin-bottom: 5px; font-weight: 500;">
                                        Original OCR Text:
                                    </div>
                                    <div style="color: #5D4037; font-style: italic;">
                                        ${element.metadata.originalText.substring(0, 150)}${element.metadata.originalText.length > 150 ? '...' : ''}
                                    </div>
                                </div>
                                ` : ''}
                                
                                <!-- Navigation/Editing Hints -->
                                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 0.8rem; color: #718096;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>ID: ${element.id || `auto-${_index}`}</span>
                                        <span>Layer: ${element.layer || 'default'}</span>
                                    </div>
                                    ${element.metadata?.lineNumbers ? `
                                    <div style="margin-top: 5px;">
                                        Lines: ${element.metadata.lineNumbers.join(', ')}
                                    </div>
                                    ` : ''}
                                    <div style="margin-top: 5px;">
                                        Type: <strong>${element.type}</strong> | 
                                        ${isOCRElement ? 'OCR Element' : 'Manual Element'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${designData.elements.length > 12 ? `
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <p style="color: #718096;">
                    ... and ${designData.elements.length - 12} more elements
                </p>
                <p style="font-size: 0.9rem; color: #667eea; margin-top: 10px;">
                    Total elements: ${designData.elements.length} | 
                    OCR elements: ${ocrElements.length} (${avgOCRConfidence > 0 ? Math.round(avgOCRConfidence * 100) : 0}% avg) |
                    Text elements: ${textElements.length} |
                    Image elements: ${imageElements.length}
                </p>
            </div>
            ` : ''}
        </section>
        ` : ''}
        
        <footer style="background: #2d3748; color: #cbd5e0; padding: 20px 30px; text-align: center; border-top: 1px solid #4a5568;">
            <p>Exported from PDF Design Studio • Professional Document Creation Tool</p>
            <p>© ${new Date().getFullYear()} PDF Design Studio. All rights reserved.</p>
        </footer>
    </div>
</body>
</html>`;
};

/**
 * Export to HTML file
 * @param {Object|string} data - Design data
 * @param {string} filename - Optional filename
 */
export const exportToHTML = (data, filename = null) => {
  try {
    const htmlContent = generateHTMLExport(data);
    const htmlBlob = new Blob([htmlContent], {
      type: 'text/html'
    });
    
    saveAs(htmlBlob, filename || `pdf-design-${Date.now()}.html`);
    return true;
  } catch (error) {
    console.error('HTML export error:', error);
    throw new Error(`Failed to export HTML: ${error.message}`);
  }
};

/**
 * Helper function to normalize hex colors (convert 3-digit to 6-digit)
 * @param {string} color - Hex color
 * @returns {string} - Normalized 6-digit hex color
 */
const normalizeHexColor = (color) => {
  if (!color) return '000000';
  
  // Remove # if present
  let hex = color.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Ensure it's 6 digits
  return hex.length === 6 ? hex : '000000';
};

/**
 * Export to DOCX
 * @param {Object|string} data - Design data
 * @param {Object} formatting - Formatting options
 * @param {Object} metadata - Document metadata
 */
export const exportToDOCX = async (data, formatting = {}, metadata = {}) => {
  try {
    const designData = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Use dynamic import for docx to reduce bundle size
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    
    // Organize content by position (simulating page layout)
    const elements = designData.elements || [];
    
    // Sort elements by Y position (top to bottom) AND add reading order index
    const sortedElements = [...elements]
      .filter(el => el.type === 'text' && el.text)
      .sort((a, b) => (a.y || 0) - (b.y || 0))
      .map((element, index) => ({
        ...element,
        readingOrder: index + 1, // Add reading order index here
        elementIndex: index
      }));
    
    // Group elements into logical sections based on vertical spacing
    const sectionGap = formatting.sectionGap || 100;
    const sections = [];
    let currentSection = [];
    let lastY = null;
    
    sortedElements.forEach((element) => {
      if (lastY === null || Math.abs(element.y - lastY) < sectionGap) {
        currentSection.push(element);
      } else {
        if (currentSection.length > 0) {
          sections.push([...currentSection]);
        }
        currentSection = [element];
      }
      lastY = element.y;
    });
    
    if (currentSection.length > 0) {
      sections.push(currentSection);
    }
    
    // Create document paragraphs
    const docParagraphs = [];
    
    // Add title if available
    const documentTitle = formatting.title || metadata.title || 'Design Document';
    if (documentTitle) {
      docParagraphs.push(
        new Paragraph({
          text: documentTitle,
          heading: HeadingLevel.TITLE,
          spacing: { after: 200 }
        })
      );
    }
    
    // Add metadata header
    if (formatting.includeMetadata) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date().toLocaleDateString()} | `,
              bold: true,
              size: 20
            }),
            new TextRun({
              text: `Elements: ${elements.length} | `,
              size: 20
            }),
            new TextRun({
              text: `Canvas: ${designData.canvasSize?.width || 794}×${designData.canvasSize?.height || 1123}px`,
              size: 20
            })
          ],
          spacing: { after: 200 }
        })
      );
    }
    
    // Process each section
    sections.forEach((sectionElements, sectionIndex) => {
      // Add section header if formatting.showSectionHeaders is true AND we have multiple sections
      if (formatting.showSectionHeaders && sections.length > 1) {
        docParagraphs.push(
          new Paragraph({
            text: `Section ${sectionIndex + 1}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 }
          })
        );
      }
      
      sectionElements.forEach((element) => {
        // Determine font size
        const elementFontSize = element.fontSize || formatting.fontSize || 12;
        const fontSize = Math.min(elementFontSize * 2, 72);
        
        // Determine heading level based on font size
        let headingLevel = undefined;
        const headingFontSize = formatting.headingFontSize || 18;
        
        if (elementFontSize >= headingFontSize) {
          headingLevel = HeadingLevel.HEADING_1;
        } else if (elementFontSize >= 16 || element.fontWeight === 'bold') {
          headingLevel = HeadingLevel.HEADING_2;
        } else if (elementFontSize >= 14) {
          headingLevel = HeadingLevel.HEADING_3;
        }
        
        // Create text runs
        const textRuns = [];
        
        // Add element index if formatting.showElementIndex is true
        if (formatting.showElementIndex) {
          textRuns.push(
            new TextRun({
              text: `[${element.readingOrder}] `,
              bold: true,
              size: Math.max(fontSize * 0.8, 16),
              color: '666666'
            })
          );
        }
        
        // Determine font properties with fallbacks
        const isBold = element.fontWeight === 'bold' || 
                      (formatting.defaultBold && !element.fontWeight);
        const isItalic = element.fontStyle === 'italic' || 
                        (formatting.defaultItalic && !element.fontStyle);
        
        // Determine font color - normalize hex value
        let fontColor = '000000'; // Default black
        if (element.fill && element.fill !== '#000000') {
          fontColor = normalizeHexColor(element.fill);
        } else if (formatting.fontColor) {
          fontColor = normalizeHexColor(formatting.fontColor);
        }
        
        // Main text run
        textRuns.push(
          new TextRun({
            text: element.text,
            bold: isBold,
            italics: isItalic,
            size: fontSize,
            font: element.fontFamily || formatting.fontFamily || 'Arial',
            color: fontColor,
            ...(formatting.underline ? { underline: {} } : {})
          })
        );
        
        // Create paragraph with proper spacing
        const paragraphSpacing = formatting.paragraphSpacing || 100;
        
        docParagraphs.push(
          new Paragraph({
            children: textRuns,
            heading: headingLevel,
            spacing: { 
              before: paragraphSpacing, 
              after: paragraphSpacing 
            },
            indent: element.x > 0 ? {
              left: element.x / 5,
            } : undefined
          })
        );
      });
      
      // Add section break if not the last section
      if (sectionIndex < sections.length - 1) {
        const sectionBreakSpacing = formatting.sectionBreakSpacing || 200;
        docParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: '', break: 1 })],
            spacing: { after: sectionBreakSpacing }
          })
        );
        
        // Add page break if enabled
        if (formatting.pageBreakBetweenSections) {
          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '', break: 2 })],
              spacing: { after: 0 }
            })
          );
        }
      }
    });
    
    // If no structured elements, use raw content with formatting
    if (docParagraphs.length === 0 && designData.content) {
      const contentLines = designData.content.split('\n');
      const baseFontSize = (formatting.fontSize || 12) * 2;
      const paragraphSpacing = formatting.paragraphSpacing || 100;
      
      contentLines.forEach((line, index) => {
        if (line.trim()) {
          const textRuns = [];
          
          // Add line number if formatting.showLineNumbers is true
          if (formatting.showLineNumbers) {
            textRuns.push(
              new TextRun({
                text: `${index + 1}. `,
                bold: true,
                size: Math.max(baseFontSize * 0.8, 16),
                color: '666666'
              })
            );
          }
          
          // Main text
          textRuns.push(
            new TextRun({
              text: line,
              bold: formatting.defaultBold || false,
              italics: formatting.defaultItalic || false,
              size: baseFontSize,
              font: formatting.fontFamily || 'Arial',
              color: normalizeHexColor(formatting.fontColor || '#666666'),
              ...(formatting.underline ? { underline: {} } : {})
            })
          );
          
          docParagraphs.push(
            new Paragraph({
              children: textRuns,
              spacing: { 
                before: index === 0 ? 0 : paragraphSpacing, 
                after: paragraphSpacing 
              }
            })
          );
        }
      });
    }
    
    // Add footer with indexing information if formatting.includeIndexFooter is true
    if (formatting.includeIndexFooter && sortedElements.length > 0) {
      // Add page break
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '', break: 2 })],
          spacing: { before: 400, after: 0 }
        })
      );
      
      // Footer title
      docParagraphs.push(
        new Paragraph({
          text: 'Element Index',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 }
        })
      );
      
      // Create index entries
      sortedElements.forEach(element => {
        const elementFontSize = element.fontSize || formatting.fontSize || 12;
        const fontSize = Math.min(elementFontSize * 2, 72);
        
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${element.readingOrder}. `,
                bold: true,
                size: fontSize
              }),
              new TextRun({
                text: element.text ? `${element.text.substring(0, 50)}${element.text.length > 50 ? '...' : ''}` : '[Empty element]',
                size: fontSize
              }),
              new TextRun({
                text: ` | Position: (${Math.round(element.x || 0)}, ${Math.round(element.y || 0)})`,
                size: Math.max(fontSize * 0.8, 16),
                color: '666666'
              })
            ],
            spacing: { before: 50, after: 50 }
          })
        );
      });
    }
    
    // Create document with proper formatting options
    const marginTop = formatting.marginTop || 1440;
    const marginBottom = formatting.marginBottom || 1440;
    const marginLeft = formatting.marginLeft || 1440;
    const marginRight = formatting.marginRight || 1440;
    
    const doc = new Document({
      creator: formatting.author || metadata.author || 'PDF Design Studio',
      title: documentTitle,
      description: formatting.description || metadata.description || 'Exported from PDF Design Studio',
      sections: [{
        properties: {
          page: {
            margin: {
              top: marginTop,
              bottom: marginBottom,
              left: marginLeft,
              right: marginRight
            }
          }
        },
        children: docParagraphs
      }]
    });
    
    const blob = await Packer.toBlob(doc);
    const finalFilename = formatting.filename || `design-export-${Date.now()}.docx`;
    saveAs(blob, finalFilename);
    
    return { 
      success: true, 
      filename: finalFilename,
      elementsExported: sortedElements.length,
      sections: sections.length,
      formattingApplied: formatting
    };
  } catch (error) {
    console.error('DOCX export error:', error);
    throw new Error(`Failed to export DOCX: ${error.message}`);
  }
};

/**
 * Wrap text to specified width
 * @param {string} text - Text to wrap
 * @param {number} width - Maximum line width
 * @returns {string} Wrapped text
 */
const wrapText = (text, width) => {
  const lines = text.split('\n');
  const wrappedLines = lines.map(line => {
    if (line.length <= width) return line;
    
    const words = line.split(' ');
    let currentLine = '';
    const result = [];
    
    words.forEach(word => {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) result.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) result.push(currentLine);
    return result.join('\n');
  });
  
  return wrappedLines.join('\n');
};

/**
 * Export to TXT (plain text) with proper indexing and formatting
 * @param {Object|string} data - Design data
 * @param {Object} formatting - Text formatting options
 * @param {Object} metadata - Document metadata
 */
export const exportToTXT = (data, formatting = {}, metadata = {}) => {
  try {
    const designData = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Extract and organize text elements with indexing
    const elements = designData.elements || [];
    
    // Sort elements by position and add reading order
    const sortedElements = [...elements]
      .filter(el => el.type === 'text' && el.text)
      .sort((a, b) => {
        // Primary sort by Y, then by X
        const yDiff = (a.y || 0) - (b.y || 0);
        if (Math.abs(yDiff) > (formatting.lineSpacingThreshold || 20)) {
          return yDiff;
        }
        return (a.x || 0) - (b.x || 0);
      })
      .map((element, index) => ({
        ...element,
        readingOrder: index + 1,
        elementIndex: index
      }));
    
    // Start building text content
    let txtContent = '';
    
    // Add header if formatting.includeHeader is not false
    const includeHeader = formatting.includeHeader !== false;
    if (includeHeader) {
      txtContent += '='.repeat(80) + '\n';
      const headerTitle = formatting.title || metadata.documentType || 'DESIGN DOCUMENT';
      txtContent += `${headerTitle}\n`;
      txtContent += '='.repeat(80) + '\n\n';
      
      // Add metadata
      txtContent += `Generated: ${new Date().toLocaleString()}\n`;
      txtContent += `Document Type: ${metadata.documentType || 'Design'}\n`;
      txtContent += `Canvas Size: ${designData.canvasSize?.width || 0} × ${designData.canvasSize?.height || 0}\n`;
      txtContent += `Total Elements: ${elements.length}\n`;
      txtContent += `Text Elements: ${sortedElements.length}\n`;
      
      // Add OCR info if formatting.includeOCRInfo is true
      if (formatting.includeOCRInfo) {
        const ocrElements = elements.filter(e => e.source === 'ocr' || e.metadata?.ocrConfidence);
        txtContent += `OCR Elements: ${ocrElements.length}\n`;
      }
      
      txtContent += '\n' + '-'.repeat(80) + '\n\n';
    }
    
    // Process elements with formatting
    let currentSection = 1;
    let lastY = null;
    
    sortedElements.forEach((element) => {
      // Check for section breaks
      const sectionBreakThreshold = formatting.sectionBreakThreshold || 100;
      if (lastY !== null && Math.abs(element.y - lastY) > sectionBreakThreshold) {
        if (formatting.showSections) {
          txtContent += '\n' + '─'.repeat(60) + '\n';
          txtContent += `SECTION ${currentSection}\n`;
          txtContent += '─'.repeat(60) + '\n\n';
          currentSection++;
        } else {
          const sectionSpacing = formatting.sectionSpacing || 2;
          txtContent += '\n'.repeat(sectionSpacing);
        }
      }
      
      // Add element index if formatting.showElementNumbers is true
      if (formatting.showElementNumbers) {
        txtContent += `[${element.readingOrder}] `;
      }
      
      // Add indent based on X position if formatting.useIndentation is true
      if (formatting.useIndentation && element.x > 0) {
        const indentSpaces = Math.floor(element.x / 20);
        if (indentSpaces > 0) {
          txtContent += ' '.repeat(indentSpaces);
        }
      }
      
      // Add the text content
      let text = element.text || '';
      
      // Apply text transformations if specified in formatting
      if (formatting.transform === 'uppercase') {
        text = text.toUpperCase();
      } else if (formatting.transform === 'lowercase') {
        text = text.toLowerCase();
      } else if (formatting.transform === 'capitalize') {
        text = text.replace(/\b\w/g, char => char.toUpperCase());
      }
      
      // Add formatting markers if formatting.showFormattingMarkers is true
      if (formatting.showFormattingMarkers) {
        const markers = [];
        if (element.fontWeight === 'bold') markers.push('B');
        if (element.fontStyle === 'italic') markers.push('I');
        if (element.textAlign === 'center') markers.push('C');
        if (element.textAlign === 'right') markers.push('R');
        if (markers.length > 0) {
          text = `[${markers.join('')}] ${text}`;
        }
      }
      
      txtContent += text;
      
      // Add element metadata if formatting.includeElementMetadata is true
      if (formatting.includeElementMetadata) {
        const metadataParts = [];
        
        if (element.fontSize) {
          metadataParts.push(`${element.fontSize}pt`);
        }
        
        if (element.fontFamily && element.fontFamily !== 'Arial') {
          metadataParts.push(element.fontFamily);
        }
        
        if (element.metadata?.ocrConfidence) {
          metadataParts.push(`OCR:${Math.round(element.metadata.ocrConfidence * 100)}%`);
        }
        
        if (metadataParts.length > 0) {
          txtContent += ` {${metadataParts.join(', ')}}`;
        }
      }
      
      txtContent += '\n';
      
      // Add line spacing
      const lineSpacing = formatting.lineSpacing || 1;
      if (lineSpacing > 1) {
        txtContent += '\n'.repeat(lineSpacing - 1);
      }
      
      lastY = element.y;
    });
    
    // If no structured elements, use raw content
    if (sortedElements.length === 0 && designData.content) {
      const content = designData.content;
      
      if (formatting.preserveOriginalFormatting) {
        txtContent += content;
      } else {
        const lines = content.split('\n');
        lines.forEach((line, lineIndex) => {
          if (line.trim() || formatting.includeEmptyLines) {
            // Add line numbers if formatting.showLineNumbers is true
            if (formatting.showLineNumbers) {
              txtContent += `${(lineIndex + 1).toString().padStart(4, ' ')}. `;
            }
            
            // Apply text transformation
            let formattedLine = line;
            if (formatting.transform === 'uppercase') {
              formattedLine = line.toUpperCase();
            } else if (formatting.transform === 'lowercase') {
              formattedLine = line.toLowerCase();
            } else if (formatting.transform === 'capitalize') {
              formattedLine = line.replace(/\b\w/g, char => char.toUpperCase());
            }
            
            txtContent += formattedLine + '\n';
            
            // Add line spacing
            if (formatting.lineSpacing > 1) {
              txtContent += '\n'.repeat(formatting.lineSpacing - 1);
            }
          }
        });
      }
    }
    
    // Add footer if formatting.includeFooter is not false
    const includeFooter = formatting.includeFooter !== false;
    if (includeFooter) {
      txtContent += '\n' + '-'.repeat(80) + '\n';
      txtContent += `END OF DOCUMENT\n`;
      txtContent += `Total characters: ${txtContent.length}\n`;
      txtContent += `Text elements: ${sortedElements.length}\n`;
      txtContent += `Generated by PDF Design Studio\n`;
      txtContent += `Timestamp: ${new Date().toISOString()}\n`;
      txtContent += '='.repeat(80) + '\n';
    }
    
    // Apply text wrapping if formatting.textWidth is specified
    if (formatting.textWidth && formatting.textWidth > 0) {
      txtContent = wrapText(txtContent, formatting.textWidth);
    }
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const finalFilename = formatting.filename || `design-${Date.now()}.txt`;
    saveAs(blob, finalFilename);
    
    return { 
      success: true, 
      filename: finalFilename,
      elementsExported: sortedElements.length,
      formattingApplied: formatting
    };
  } catch (error) {
    console.error('TXT export error:', error);
    throw new Error(`Failed to export TXT: ${error.message}`);
  }
};

/**
 * Check if content height exceeds recommended limits
 * @param {Array} elements - Design elements
 * @param {number} canvasHeight - Current canvas height
 * @returns {Object} - Warnings and recommendations
 */
export const checkContentHeight = (elements, canvasHeight = STANDARD_A4_HEIGHT) => {
  if (!elements || elements.length === 0) {
    return {
      contentHeight: 0,
      exceedsWarningThreshold: false,
      exceedsMergeLimit: false,
      warningMessage: null,
      recommendation: 'No content to check.'
    };
  }
  
  // Calculate content height based on elements
  let maxBottom = 0;
  elements.forEach(element => {
    let elementBottom = element.y || 0;
    
    switch (element.type) {
      case 'text': {
        const lines = element.text ? element.text.split('\n').length : 1;
        const lineHeight = (element.fontSize || 12) * 1.5;
        elementBottom = (element.y || 0) + (lines * lineHeight);
        break;
      }
      case 'rectangle':
      case 'image':
        elementBottom = (element.y || 0) + (element.height || 0);
        break;
      case 'circle':
        elementBottom = (element.y || 0) + ((element.radius || 0) * 2);
        break;
    }
    
    maxBottom = Math.max(maxBottom, elementBottom);
  });
  
  const contentHeight = maxBottom + 50; // Add padding
  const MAX_MERGE_HEIGHT = Math.floor(canvasHeight * 1.5);
  const QUALITY_WARNING_THRESHOLD = Math.floor(canvasHeight * 1.2);
  
  return {
    contentHeight,
    canvasHeight,
    exceedsWarningThreshold: contentHeight > QUALITY_WARNING_THRESHOLD,
    exceedsMergeLimit: contentHeight > MAX_MERGE_HEIGHT,
    warningMessage: contentHeight > QUALITY_WARNING_THRESHOLD
      ? `Content height (${Math.round(contentHeight)}px) exceeds recommended limits for canvas height ${canvasHeight}px. Export quality may be reduced.`
      : null,
    recommendation: contentHeight > MAX_MERGE_HEIGHT
      ? `Consider splitting content across multiple pages or reducing element sizes. Canvas height: ${canvasHeight}px`
      : contentHeight > QUALITY_WARNING_THRESHOLD
      ? `Consider reducing font sizes or element spacing. Canvas height: ${canvasHeight}px`
      : `Content height is within recommended limits for canvas height ${canvasHeight}px.`
  };
};

/**
 * Generate element position mapping for editing reference
 * @param {Array} elements - Design elements
 * @returns {Object} - Position mapping and statistics
 */
export const generateElementPositionMap = (elements) => {
  if (!elements || !elements.length) return { mapping: {}, stats: {} };
  
  const mapping = {};
  const stats = {
    total: elements.length,
    ocrElements: 0,
    textElements: 0,
    imageElements: 0,
    byPage: {},
    byType: {}
  };
  
  elements.forEach((element, index) => {
    // Create unique reference key
    const refKey = `element-${index}`;
    
    mapping[refKey] = {
      index,
      id: element.id || refKey,
      type: element.type,
      position: { x: element.x || 0, y: element.y || 0 },
      size: { width: element.width, height: element.height },
      page: element.metadata?.pageNumber || 1,
      isOCR: !!(element.source === 'ocr' || element.metadata?.ocrConfidence),
      confidence: element.metadata?.ocrConfidence,
      readingOrder: element.readingOrder || index + 1
    };
    
    // Update statistics
    if (mapping[refKey].isOCR) stats.ocrElements++;
    if (element.type === 'text') stats.textElements++;
    if (element.type === 'image') stats.imageElements++;
    
    const page = mapping[refKey].page;
    stats.byPage[page] = (stats.byPage[page] || 0) + 1;
    
    const type = element.type;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });
  
  return { mapping, stats };
};

/**
 * Export editing guide with element references
 * @param {Object} data - Design data
 */
export const exportEditingGuide = (data) => {
  try {
    const designData = typeof data === 'string' ? JSON.parse(data) : data;
    const positionMap = generateElementPositionMap(designData.elements);
    
    const guideContent = `
# Document Editing Guide
## OCR Result Integrity Preservation

## Element Reference Mapping
${Object.entries(positionMap.mapping).map(([key, info]) => `
### ${key} (Element #${info.readingOrder})
- **Type**: ${info.type} ${info.isOCR ? '(OCR Source)' : ''}
- **Position**: (${info.position.x}, ${info.position.y})
- **Page**: ${info.page}
- **Index in Array**: ${info.index}
${info.confidence ? `- **OCR Confidence**: ${Math.round(info.confidence * 100)}%` : ''}

`).join('')}

## Statistics
- **Total Elements**: ${positionMap.stats.total}
- **OCR Elements**: ${positionMap.stats.ocrElements}
- **Text Elements**: ${positionMap.stats.textElements}
- **Image Elements**: ${positionMap.stats.imageElements}

## Editing Guidelines
1. Preserve element indices to maintain reading order
2. OCR elements marked with green borders
3. Original OCR text preserved in metadata
4. Element positions are exact coordinates from source document
`;
    
    const blob = new Blob([guideContent], { type: 'text/markdown' });
    saveAs(blob, `editing-guide-${Date.now()}.md`);
    return positionMap;
  } catch (error) {
    console.error('Editing guide export error:', error);
    throw new Error(`Failed to export editing guide: ${error.message}`);
  }
};

/**
 * Helper function to get proper canvas dimensions
 * @param {Object} canvasSize - Canvas size object
 * @param {Array} elements - Design elements
 * @returns {Object} - Adjusted canvas dimensions
 */
export const getCanvasDimensions = (canvasSize, elements = []) => {
  if (!canvasSize) {
    return { width: STANDARD_A4_WIDTH, height: STANDARD_A4_HEIGHT };
  }
  
  // Check if we need to adjust height based on content
  const heightCheck = checkContentHeight(elements, canvasSize.height);
  
  return {
    width: canvasSize.width || STANDARD_A4_WIDTH,
    height: heightCheck.contentHeight > canvasSize.height ? 
      Math.max(canvasSize.height, heightCheck.contentHeight) : 
      canvasSize.height
  };
};

/**
 * Unified export function for all formats with multi-page support
 * @param {string} format - Export format: 'json', 'pdf', 'png', 'html', 'docx', 'txt', 'editing-guide', 'guide'
 * @param {Object|string} exportData - Complete design data
 * @param {Object} stageRef - React ref to the Konva stage (required for PDF/PNG single page)
 * @param {Object} canvasSize - {width, height} of the canvas
 * @param {Object} formatting - Text formatting options
 * @param {Object} metadata - Document metadata
 * @param {Object} pageOptions - Multi-page export options
 */
export const handlePDFDocumentExport = async (
  format,
  exportData,
  stageRef = null,
  canvasSize = null,
  formatting = {},
  metadata = {},
  pageOptions = {}
) => {
  try {
    console.log('🔄 Starting export:', { format, pageOptions });
    
    // Parse data if needed
    const data = typeof exportData === 'string' ? JSON.parse(exportData) : exportData;
    
    // Get pages
    const pages = pageOptions.pages || data.pages || [];
    const hasMultiplePages = pages.length > 1;
    
    // Determine canvas size
    const exportCanvasSize = canvasSize || data.canvasSize || { 
      width: STANDARD_A4_WIDTH, 
      height: STANDARD_A4_HEIGHT 
    };
    
    // Handle multi-page exports
    if ((format.toLowerCase() === 'pdf' || format.toLowerCase() === 'png') && hasMultiplePages) {
      const {
        exportMode = 'all',
        selectedPages = [],
        mergeRatio = 2,
        filename = 'design'
      } = pageOptions;
      
      let pagesToExport = [];
      
      // Determine which pages to export
      switch (exportMode) {
        case 'all': {
          pagesToExport = Array.from({ length: pages.length }, (_, i) => i);
          break;
        }
        case 'current': {
          const currentIdx = pageOptions.currentPageIndex || 0;
          pagesToExport = [currentIdx];
          break;
        }
        case 'range': {
          const start = Math.max(0, (pageOptions.startPage || 1) - 1);
          const end = Math.min(pages.length - 1, (pageOptions.endPage || pages.length) - 1);
          pagesToExport = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          break;
        }
        case 'select': {
          pagesToExport = selectedPages.length > 0 ? selectedPages : [0];
          break;
        }
        case 'merge': {
          // For merge mode, handle specially
          if (format.toLowerCase() === 'pdf') {
            return await exportMergedPagesToPDF(
              pages,
              { mergeRatio, selectedPages, canvasSize: exportCanvasSize },
              filename
            );
          } else {
            return await exportMergedPagesToPNG(
              pages,
              { mergeRatio, selectedPages, canvasSize: exportCanvasSize },
              filename
            );
          }
        }
        default: {
          pagesToExport = [0];
        }
      }
      
      // Filter pages
      const filteredPages = pages.filter((_, idx) => pagesToExport.includes(idx));
      
      if (filteredPages.length === 0) {
        throw new Error('No valid pages selected for export');
      }
      
      // Call appropriate export function
      if (format.toLowerCase() === 'pdf') {
        return await exportPagesToPDF(
          filteredPages,
          { 
            selectedPages: pagesToExport, 
            canvasSize: exportCanvasSize,
            textProperties: formatting.textProperties || {}
          },
          filename
        );
      } else {
        return await exportPagesToPNG(
          filteredPages,
          { selectedPages: pagesToExport, canvasSize: exportCanvasSize },
          filename
        );
      }
    }
    
    // SINGLE PAGE EXPORTS
    switch (format.toLowerCase()) {
      case 'pdf': {
        if (!stageRef?.current) {
          throw new Error('Canvas stage not found for PDF export');
        }
        
        // Single page high-quality PDF with image optimization
        return await exportToHighQualityPDF(
          data.elements || [],
          exportCanvasSize,
          formatting.textProperties || {},
          metadata
        );
      }
        
      case 'png': {
        if (!stageRef?.current) {
          throw new Error('Canvas stage not found for PNG export');
        }
        
        return await exportCanvasToPNG(
          stageRef,
          exportCanvasSize,
          `design-${Date.now()}.png`
        );
      }
        
      case 'json':
        return await exportToJSON({ ...data, metadata: { ...metadata, canvasSize: exportCanvasSize } });
        
      case 'html':
        return await exportToHTML({ ...data, metadata: { ...metadata, canvasSize: exportCanvasSize } });
        
      case 'docx':
      case 'word':
        return await exportToDOCX(
          { ...data, metadata: { ...metadata, canvasSize: exportCanvasSize } },
          formatting,
          metadata
        );
        
      case 'txt':
      case 'text':
        return await exportToTXT(
          { ...data, metadata: { ...metadata, canvasSize: exportCanvasSize } },
          formatting,
          metadata
        );
        
      case 'editing-guide':
      case 'guide':
        return await exportEditingGuide(data);
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    showNotification(`Failed to export: ${error.message}`, 'error');
    throw error;
  }
};