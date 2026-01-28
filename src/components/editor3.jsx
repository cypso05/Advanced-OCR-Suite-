 // src/app/features/ocr/components/PDFEditor.jsx - FIXED VERSION
import React, {
  useState,
  useRef,
  useCallback,
  useMemo, // ← ADD THIS
  useEffect,
} from 'react';

import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, IconButton, Tooltip, Chip, FormControl,
  InputLabel, Select, MenuItem, TextField, Slider,
  Switch, FormControlLabel, Divider, Alert, Snackbar,
  Menu, CircularProgress, InputAdornment
} from '@mui/material';

import {
  Add, Save, Download, Upload, PictureAsPdf,
  TextFields, ShapeLine, FormatPaint,
  Undo, Redo, Delete, ZoomIn, ZoomOut,
  AutoFixHigh, TableChart, GridOn, Link,
  QrCode2, Palette, FormatBold, FormatItalic,
  FormatAlignLeft, FormatAlignCenter, FormatAlignRight,
  CloudUpload, CloudDownload, ContentCopy,
  Visibility, VisibilityOff, SmartToy, RestartAlt,
  Close, ExpandMore, Description, Code,
  CloudDownload as CloudDownloadIcon, ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

import { Image as ImageIcon } from '@mui/icons-material';
import {
  Stage, Layer, Text, Rect, Circle, Line,
  Image as KonvaImage, Transformer
} from 'react-konva';

import { useDropzone } from 'react-dropzone';

import {
  handlePDFDocumentExport, 
} from '../utils/pdfExportUtils';

// Add these imports
import { useDocumentEditor } from '../utils/documentEditorHooks';

import SaveDialog from './SaveDialog'; // Adjust path if needed
// In your PDFEditor.jsx - Add useNavigate at the top
import { useEditorNavigation } from './useEditorNavigation'; // ADD THIS

// Add this import with your other imports
import { useKonvaToolManager } from '../upgrade/hooks/useKonvaToolManager'; // Adjust path as needed


// ----------------------------------------------------
// Constants
// ----------------------------------------------------
const STANDARD_A4_HEIGHT = 1123;
const STANDARD_A4_WIDTH = 794;
const MAX_MERGE_HEIGHT = Math.floor(STANDARD_A4_HEIGHT * 1.5);
const MAX_PAGE_HEIGHT = STANDARD_A4_HEIGHT * 2;
const QUALITY_WARNING_THRESHOLD = Math.floor(STANDARD_A4_HEIGHT * 1.2);

// ✅ ADD: Fixed canvas sizes
const FIXED_CANVAS_SIZES = {
  '794x1123': { width: 794, height: 1123, name: 'A4 Portrait' },
  '1123x794': { width: 1123, height: 794, name: 'A4 Landscape' },
  '612x792': { width: 612, height: 792, name: 'Letter Portrait' },
  '792x612': { width: 792, height: 612, name: 'Letter Landscape' },
  '350x200': { width: 350, height: 200, name: 'Business Card' },
  '1024x768': { width: 1024, height: 768, name: 'Presentation' }
};

// ✅ ADD: Default canvas size
const DEFAULT_CANVAS_SIZE = FIXED_CANVAS_SIZES['794x1123'];

// ----------------------------------------------------
// Helper Functions
// ----------------------------------------------------

const splitTextIntoChunks = (text, maxLength) => {
  if (!text) return [];
  const chunks = [];
  let currentChunk = '';
  const sentences = text.split('. ');

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push(currentChunk + '.');
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.slice(0, 3);
};

const calculateContentHeight = (elements) => {
  if (!elements || elements.length === 0) return 0;
  
  let maxBottom = 0;
  elements.forEach(element => {
    let elementBottom = element.y;
    
    switch (element.type) {
      case 'text': {
        const lines = element.text ? element.text.split('\n').length : 1;
        const lineHeight = (element.fontSize || 12) * 1.5;
        elementBottom = element.y + (lines * lineHeight);
        break;
      }
        
      case 'rectangle': {
        elementBottom = element.y + (element.height || 0);
        break;
      }
        
      case 'circle': {
        elementBottom = element.y + (element.radius || 0) * 2;
        break;
      }
        
      case 'image': {
        elementBottom = element.y + (element.height || 0);
        break;
      }
        
      case 'line': {
        const points = element.points || [];
        let maxY = element.y;
        for (let i = 1; i < points.length; i += 2) {
          maxY = Math.max(maxY, element.y + points[i]);
        }
        elementBottom = maxY;
        break;
      }
        
      default: {
        elementBottom = element.y;
        break;
      }
    }
    
    maxBottom = Math.max(maxBottom, elementBottom);
  });
  
  return maxBottom + 50;
};

// ----------------------------------------------------
// Templates
// ----------------------------------------------------
const TEMPLATES = {
  blank: { name: 'Blank Document', category: 'general', elements: [] },
  cv: {
    name: 'Professional CV',
    category: 'resume',
    elements: [
      { type: 'text', x: 100, y: 100, text: 'YOUR NAME', fontSize: 32, fontFamily: 'Arial', fontWeight: 'bold', draggable: true },
      { type: 'text', x: 100, y: 150, text: 'Professional Title', fontSize: 18, fontFamily: 'Arial', fill: '#666', draggable: true },
      { type: 'rect', x: 80, y: 80, width: 634, height: 2, fill: '#1976d2', draggable: true },
      { type: 'text', x: 100, y: 220, text: 'PROFESSIONAL SUMMARY', fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', draggable: true },
      { type: 'text', x: 100, y: 250, text: 'Add your professional summary here...', fontSize: 12, fontFamily: 'Arial', width: 600, draggable: true },
    ]
  },
  businessCard: {
    name: 'Business Card',
    category: 'marketing',
    canvasSize: { width: 350, height: 200 },
    elements: [
      { type: 'rect', x: 0, y: 0, width: 350, height: 200, fill: '#ffffff', stroke: '#ddd', strokeWidth: 1, draggable: true },
      { type: 'text', x: 20, y: 30, text: 'Company Name', fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', draggable: true },
      { type: 'text', x: 20, y: 60, text: 'Your Name', fontSize: 14, fontFamily: 'Arial', draggable: true },
      { type: 'text', x: 20, y: 85, text: 'Job Title', fontSize: 12, fontFamily: 'Arial', fill: '#666', draggable: true },
      { type: 'text', x: 20, y: 120, text: 'email@company.com', fontSize: 10, fontFamily: 'Arial', draggable: true },
      { type: 'text', x: 20, y: 140, text: '+1 (555) 123-4567', fontSize: 10, fontFamily: 'Arial', draggable: true },
    ]
  },
  presentation: {
    name: 'Presentation Slide',
    category: 'business',
    canvasSize: { width: 1024, height: 768 },
    elements: [
      { type: 'rect', x: 0, y: 0, width: 1024, height: 768, fill: '#2c3e50', draggable: true },
      { type: 'text', x: 512, y: 200, text: 'PRESENTATION TITLE', fontSize: 48, fontFamily: 'Arial', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', draggable: true },
      { type: 'text', x: 512, y: 300, text: 'Your Name - Company', fontSize: 24, fontFamily: 'Arial', fill: '#bdc3c7', textAlign: 'center', draggable: true },
      { type: 'rect', x: 100, y: 400, width: 824, height: 3, fill: '#3498db', draggable: true },
      { type: 'text', x: 512, y: 500, text: 'Key Points Will Go Here', fontSize: 28, fontFamily: 'Arial', fill: '#ecf0f1', textAlign: 'center', draggable: true },
    ]
  },
  report: {
    name: 'Business Report',
    category: 'business',
    elements: [
      { type: 'text', x: 100, y: 100, text: 'BUSINESS REPORT', fontSize: 36, fontFamily: 'Georgia', fontWeight: 'bold', draggable: true },
      { type: 'text', x: 100, y: 150, text: 'Quarterly Analysis', fontSize: 18, fontFamily: 'Arial', fill: '#666', draggable: true },
      { type: 'rect', x: 80, y: 180, width: 634, height: 2, fill: '#34495e', draggable: true },
      { type: 'text', x: 100, y: 220, text: 'EXECUTIVE SUMMARY', fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', draggable: true },
      { type: 'text', x: 100, y: 250, text: 'Add your executive summary here...', fontSize: 12, fontFamily: 'Arial', width: 600, draggable: true },
    ]
  }
};



// ----------------------------------------------------
// Main Component
// ----------------------------------------------------
const PDFEditor = ({ open, content, onSave, documentType, aiResults }) => {

  // ------------------ STATE ---------------------------
// In PDFEditor.jsx - Add this with your other useState declarations:

// ------------------ STATE ---------------------------
const { goToPreview, goBackToAdvancedOCR } = useEditorNavigation();
// In your component, add these state variables:
const [selectedTool, ] = useState("select");
const [activeTab, setActiveTab] = useState(0);
const [elements, setElements] = useState([]);
const [selectedId, setSelectedId] = useState(null);
const [canvasSize, setCanvasSize] = useState({ 
  width: DEFAULT_CANVAS_SIZE.width, 
  height: DEFAULT_CANVAS_SIZE.height 
});
const [zoom, setZoom] = useState(1);
const [history, setHistory] = useState([]);
const [historyStep, setHistoryStep] = useState(-1);
const [currentTemplate, setCurrentTemplate] = useState(null);
const [showOCRArea, setShowOCRArea] = useState(true);
const [isDrawing, setIsDrawing] = useState(false);
const [drawingPoints, setDrawingPoints] = useState([]);
const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
const [isExporting, setIsExporting] = useState(false);
const [saveDialogOpen, setSaveDialogOpen] = useState(false);
const [selectedFormat, setSelectedFormat] = useState('json');

// ADD THESE STATE VARIABLES FOR MULTI-PAGE EXPORT
const [exportMode, setExportMode] = useState('all');
const [selectedPages, setSelectedPages] = useState([]);
const [mergeRatio, setMergeRatio] = useState(2);
const [exportStartPage, setExportStartPage] = useState(1);
const [exportEndPage, setExportEndPage] = useState(1);

// ADD THIS NEW STATE FOR EXPORT QUALITY SETTINGS
const [exportQuality, setExportQuality] = useState({
  dpi: 300,
  compression: 0.9,
  enhanceText: true,
  preserveOCR: true,
  highDPI: true,
  imageFormat: 'auto'
});

const [pages, setPages] = useState([]);
const [currentPageIndex, setCurrentPageIndex] = useState(0);
const [documentMetadata, setDocumentMetadata] = useState(null);
const [isCanvasReady, setIsCanvasReady] = useState(false);
const [isEditorFullyReady, setIsEditorFullyReady] = useState(false);

// ✅ MOVE addToHistory function UP here, BEFORE toolManager
  const addToHistory = useCallback((newElements) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push([...newElements]);
      return newHistory;
    });
    setHistoryStep(step => step + 1);
  }, [historyStep]);



// Initialize Konva Tool Manager
const konvaToolManager = useKonvaToolManager({
  initialTool: selectedTool,
  resetPropertiesOnToolChange: true,
  onToolChange: (toolId, properties) => {
    console.log(`Tool changed to: ${toolId}`, properties);
    // You can add additional logic here when tool changes
  }
});

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    elementId: null,
    open: false
  });
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // ✅ MUST CREATE canvasRef BEFORE useDocumentEditor
  const stageRef = useRef();
  const transformerRef = useRef();
  const hasOCRContentRef = useRef(false);
  const fileInputRef = useRef(null);


// In your component
// ✅ ADD: Complete canvas size change handler
const handleCanvasSizeChange = (value) => {
  // Check if it's a standard size
  if (FIXED_CANVAS_SIZES[value]) {
    setCanvasSize(FIXED_CANVAS_SIZES[value]);
    showNotification(`Canvas set to ${FIXED_CANVAS_SIZES[value].name}`, 'success');
  } else {
    // Handle custom size (like 595.28x841.89)
    const [width, height] = value.split('x').map(Number);
    if (!isNaN(width) && !isNaN(height)) {
      setCanvasSize({ width, height });
      showNotification(`Canvas set to custom size: ${width}x${height}`, 'info');
    }
  }
};
// SIMPLIFIED: No canvasRef in options
const editorOptions = useMemo(() => ({
  dpi: 300,
  scale: 2.0,
  extractText: true,
  extractGraphics: true,
  viewport: { 
    width: STANDARD_A4_WIDTH, 
    height: STANDARD_A4_HEIGHT, 
    scale: 1 
  }
}), []); // No dependencies needed

const {
  editor,
  isLoading: isEditorLoading,
  error: editorError,
  processDocument,
  canvasRef, // ✅ GET THE REF FROM THE HOOK
} = useDocumentEditor(editorOptions);

  // Text Properties
// Text Properties - REMOVE the duplicate selectedTool from here
const [textProperties, setTextProperties] = useState({
  fontSize: 16,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fontStyle: 'normal',
  fill: '#000000',
  textAlign: 'left'
});

  // ✅ Helper Functions - MUST come BEFORE useEffect that uses them
  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);



  // ✅ NOW the debug useEffect can use showNotification
  useEffect(() => {
    if (editorError) {
      console.error('Document Editor Error:', editorError);
      showNotification(`Editor Error: ${editorError}`, 'error');
    }
  }, [editorError, showNotification]);

  useEffect(() => {
    console.log('Document Editor State:', {
      editorReady: !!editor,
      isLoading: isEditorLoading,
      hasError: !!editorError,
      processDocumentAvailable: typeof processDocument === 'function'
    });
  }, [editor, isEditorLoading, editorError, processDocument]);

  // Sync tool manager states with component states
useEffect(() => {
  if (konvaToolManager.activeTool !== selectedTool) {
    konvaToolManager.selectTool(selectedTool);
  }
}, [selectedTool, konvaToolManager]);

// Update cursor from tool manager
useEffect(() => {
  if (konvaToolManager.cursor) {
    // Update stage cursor if available
    if (stageRef.current && stageRef.current.container()) {
      stageRef.current.container().style.cursor = konvaToolManager.cursor;
    }
  }
}, [konvaToolManager.cursor]);
  
// Update the exportEndPage initialization when pages changes:
React.useEffect(() => {
  const total = pages.length || 1;
  setExportEndPage(total);
  setExportStartPage(1);
}, [pages.length]);

useEffect(() => {
  // Check immediately if canvas exists
  if (canvasRef.current) {
    console.log('✅ Canvas element is now available:', canvasRef.current);
    setIsCanvasReady(true);
  } else {
    console.log('⏳ Waiting for canvas element...');
    
    // Set up a quick check interval in case canvas appears later
    const checkInterval = setInterval(() => {
      if (canvasRef.current) {
        console.log('✅ Canvas found via interval:', canvasRef.current);
        setIsCanvasReady(true);
        clearInterval(checkInterval);
      }
    }, 50);
    
    // Cleanup
    return () => clearInterval(checkInterval);
  }
}, [canvasRef]); // Run only once on mount

// Add this useEffect to force editor initialization when canvas is ready
useEffect(() => {
  console.log('🔧 Checking editor initialization status:', {
    isCanvasReady,
    canvasRefCurrent: canvasRef?.current,
    editor: !!editor,
    isEditorLoading,
    isEditorFullyReady
  });
  
  if (isCanvasReady && canvasRef?.current && !editor && !isEditorLoading && !isEditorFullyReady) {
    console.log('🚀 Force-triggering DocumentEditor initialization...');
    
    // The hook should automatically initialize when canvas is ready
    // But we can log to debug
    console.log('Canvas is ready, editor should initialize automatically');
    
    // If processDocument exists but editor doesn't, it might be a timing issue
    // Force a re-check by triggering a state update
    const timer = setTimeout(() => {
      console.log('🔄 Re-checking editor state after timeout...');
      // This will trigger re-render and re-evaluation
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [isCanvasReady, editor,canvasRef, isEditorLoading, isEditorFullyReady]);
  
  // ------------------ Helper Functions ------------------
  
  const undo = useCallback(() => {
    if (historyStep > 0) {
      setElements(history[historyStep - 1]);
      setHistoryStep(historyStep - 1);
    }
  }, [history, historyStep]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      setElements(history[historyStep + 1]);
      setHistoryStep(historyStep + 1);
    }
  }, [history, historyStep]);

// Update the addElement function to use tool properties from konvaToolManager
const addElement = useCallback((type, customProps = {}) => {
  // Get tool-specific properties from konvaToolManager
  const toolConfig = konvaToolManager.getCurrentToolConfig();
  
  const baseElement = {
  id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: type,
  x: customProps.x || 50,
  y: customProps.y || 50,
  draggable: true,
  ...customProps
};

switch (type) {
  case 'text':
  case 'heading':
  case 'subheading':
  case 'paragraph': {
    const finalElement = {
      ...baseElement,
      type: 'text',
      text: customProps.text || 'New Text',
      fontSize: type === 'heading' ? 24 : type === 'subheading' ? 18 : 16,
      fontFamily: customProps.fontFamily || textProperties.fontFamily,
      fontWeight: customProps.fontWeight || textProperties.fontWeight,
      fontStyle: customProps.fontStyle || textProperties.fontStyle,
      fill: customProps.fill || textProperties.fill,
      textAlign: customProps.textAlign || textProperties.textAlign,
      width: customProps.width || canvasSize.width - 100
    };
    
    setElements(prev => {
      const updated = [...prev, finalElement];
      addToHistory(updated);
      return updated;
    });
    setSelectedId(finalElement.id);
    return finalElement;
  }
    
  case 'rectangle':
  case 'circle':
  case 'line':
  case 'arrow': {
    // Use toolConfig properties if available
    const shapeProps = {
      stroke: toolConfig.stroke || '#000000',
      strokeWidth: toolConfig.strokeWidth || 2,
      fill: toolConfig.fill || (type === 'line' || type === 'arrow' ? 'transparent' : '#ffffff'),
      ...customProps
    };
    
    let shapeElement;
    
    if (type === 'rectangle') {
      shapeElement = {
        ...baseElement,
        type: 'rectangle',
        width: customProps.width || 100,
        height: customProps.height || 100,
        ...shapeProps
      };
    } else if (type === 'circle') {
      shapeElement = {
        ...baseElement,
        type: 'circle',
        radius: customProps.radius || 50,
        ...shapeProps
      };
    } else if (type === 'line' || type === 'arrow') {
      shapeElement = {
        ...baseElement,
        type: 'line',
        points: customProps.points || [0, 0, 100, 0],
        ...shapeProps
      };
    }
    
    setElements(prev => {
      const updated = [...prev, shapeElement];
      addToHistory(updated);
      return updated;
    });
    setSelectedId(shapeElement.id);
    return shapeElement;
  }
    
  default: {
    setElements(prev => {
      const updated = [...prev, baseElement];
      addToHistory(updated);
      return updated;
    });
    setSelectedId(baseElement.id);
    return baseElement;
  }
}
}, [canvasSize.width, textProperties, konvaToolManager, addToHistory]);


  const handleDragEnd = useCallback((e, id) => {
    const node = e.target;
    setElements(prev =>
      prev.map(el =>
        el.id === id ? { ...el, x: node.x(), y: node.y() } : el
      )
    );
  }, []);

  const handleTextEdit = useCallback((elementId, newText) => {
    setElements(prev =>
      prev.map(el =>
        el.id === elementId ? { ...el, text: newText } : el
      )
    );
  }, []);

  const deleteSelectedElement = useCallback(() => {
    if (selectedId) {
      setElements(prev => {
        const updated = prev.filter(el => el.id !== selectedId);
        addToHistory(updated);
        return updated;
      });
      setSelectedId(null);
      showNotification('Element deleted', 'success');
    }
  }, [selectedId, addToHistory, showNotification]);

  // ------------------ Render Functions ------------------
  const createTextInputForEditing = useCallback((element) => {
    const stage = stageRef.current;
    if (!stage) return;

    const existingInput = document.getElementById('konva-text-input');
    if (existingInput) {
      existingInput.remove();
    }

    const textPosition = {
      x: element.x * zoom,
      y: element.y * zoom
    };

    const input = document.createElement('textarea');
    input.id = 'konva-text-input';
    input.value = element.text || '';
    input.style.position = 'absolute';
    input.style.left = `${textPosition.x + 10}px`;
    input.style.top = `${textPosition.y + 10}px`;
    input.style.width = `${(element.width || 200) * zoom}px`;
    input.style.minHeight = `${(element.fontSize || 16) * 2 * zoom}px`;
    input.style.fontSize = `${(element.fontSize || 16) * zoom}px`;
    input.style.fontFamily = element.fontFamily || 'Arial';
    input.style.color = element.fill || '#000000';
    input.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    input.style.border = '2px solid #3498db';
    input.style.borderRadius = '4px';
    input.style.padding = '8px';
    input.style.outline = 'none';
    input.style.zIndex = '1000';
    input.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    input.style.resize = 'vertical';
    
    stage.container().parentNode.appendChild(input);
    input.focus();
    input.select();

    const handleInputChange = (e) => {
      handleTextEdit(element.id, e.target.value);
    };

    const handleInputBlur = () => {
      input.removeEventListener('input', handleInputChange);
      input.remove();
      if (stage) {
        stage.container().style.cursor = 'default';
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        input.blur();
      }
      if (e.key === 'Escape') {
        handleTextEdit(element.id, element.text);
        input.blur();
      }
    };

    input.addEventListener('input', handleInputChange);
    input.addEventListener('blur', handleInputBlur);
    input.addEventListener('keydown', handleKeyDown);
  }, [zoom, handleTextEdit]);

const renderKonvaElements = useCallback(() => {
  return elements.map((element) => {
    const baseProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: element.draggable,
      onClick: () => setSelectedId(element.id),
      onTap: () => setSelectedId(element.id),
      onDragEnd: (e) => handleDragEnd(e, element.id),
      onTransformEnd: (e) => {
        const node = e.target;
        setElements(prev =>
          prev.map(el =>
            el.id === element.id
              ? {
                  ...el,
                  x: node.x(),
                  y: node.y(),
                  width: node.width(),
                  height: node.height(),
                  rotation: node.rotation()
                }
              : el
          )
        );
      },
      onDblClick: () => {
        if (element.type === 'text') {
          const stage = stageRef.current;
          if (stage) {
            stage.container().style.cursor = 'text';
            createTextInputForEditing(element);
          }
        }
      },
      onDblTap: () => {
        if (element.type === 'text') {
          createTextInputForEditing(element);
        }
      },
      onContextMenu: (e) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        
        setContextMenu({
          x: pos.x,
          y: pos.y,
          elementId: element.id,
          open: true
        });
        setSelectedId(element.id);
      }
    };

    switch (element.type) {
      case 'text':
        return (
          <Text
            key={element.id}
            {...baseProps}
            fontSize={element.fontSize}
            fontFamily={element.fontFamily}
            fontWeight={element.fontWeight}
            fontStyle={element.fontStyle}
            fill={element.fill}
            textAlign={element.textAlign}
            width={element.width}
            wrap="word"
            text={element.text}
          />
        );
      case 'rectangle':
        return (
          <Rect
            key={element.id}
            {...baseProps}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            {...baseProps}
            radius={element.radius}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
          />
        );
      case 'line':
        return (
          <Line
            key={element.id}
            {...baseProps}
            points={element.points}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        );
    // In the image case of renderKonvaElements - simplify
       case 'image':
        console.log('🖼️ Rendering image element:', {
          id: element.id,
          hasImage: !!element.image,
          imageComplete: element.image?.complete,
          src: element.src?.substring(0, 50),
          position: { x: element.x, y: element.y },
          size: { width: element.width, height: element.height }
        });
        
        // If we have a loaded image, render it
        if (element.image && element.image.complete) {
          return (
            <KonvaImage
              key={element.id}
              {...baseProps}
              image={element.image}
              width={element.width}
              height={element.height}
              onMouseEnter={(e) => {
                const container = e.target.getStage().container();
                container.style.cursor = 'move';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage().container();
                container.style.cursor = 'default';
              }}
            />
          );
        } 
        // If we have a src but no loaded image, start loading
        else if (element.src) {
          console.log('🔄 Image needs loading, creating loader for:', element.id);
          
          const img = new window.Image();
          img.crossOrigin = 'Anonymous';
          img.src = element.src;
          
          img.onload = () => {
            console.log('✅ Image loaded, updating element:', element.id);
            setElements(prev => prev.map(el => 
              el.id === element.id ? { 
                ...el, 
                image: img,
                width: el.width || img.width,
                height: el.height || img.height 
              } : el
            ));
          };
          
          img.onerror = (err) => {
            console.error('❌ Failed to load image:', element.src, err);
          };
          
          // Return placeholder while loading
          return (
            <Rect
              key={element.id}
              x={element.x}
              y={element.y}
              width={element.width || 100}
              height={element.height || 100}
              fill="#f0f0f0"
              stroke="#ccc"
              strokeWidth={1}
              draggable={element.draggable}
              onClick={() => setSelectedId(element.id)}
            />
          );
        }
        
        console.warn('⚠️ Image element has no src or image:', element.id);
        return null;
      default:
        return null;
    }
  });
}, [elements, handleDragEnd, createTextInputForEditing, setElements, setSelectedId, setContextMenu]);


// ------------------ Enhanced File Upload Processing ------------------

const convertToKonvaElement = useCallback((docElement) => {
  if (!docElement) return null;
  
  console.log('🔄 Converting element to Konva:', {
    type: docElement.type,
    id: docElement.id,
    dimensions: { 
      x: docElement.x, 
      y: docElement.y,
      width: docElement.width,
      height: docElement.height
    },
    hasImage: !!docElement.image,
    imageComplete: docElement.image?.complete
  });
  
  // Define drag handlers
  const createDragHandlers = (elementId) => ({
    draggable: true,
    onDragStart: (e) => {
      const node = e.target;
      node.setAttrs({
        shadowOffset: { x: 3, y: 3 },
        scaleX: 1.02,
        scaleY: 1.02,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowBlur: 5
      });
      const stage = node.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = 'grabbing';
      }
    },
    onDragEnd: (e) => {
      const node = e.target;
      node.setAttrs({
        shadowOffset: { x: 0, y: 0 },
        scaleX: 1,
        scaleY: 1,
        shadowBlur: 0
      });
      
      // Update element position
      setElements(prev =>
        prev.map(el =>
          el.id === elementId 
            ? { ...el, x: node.x(), y: node.y() }
            : el
        )
      );
      
      const stage = node.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = 'default';
      }
    }
  });
  
  switch (docElement.type) {
    case 'text':
      return {
        id: docElement.id || `text-${Date.now()}`,
        type: 'text',
        text: docElement.text || '',
        x: docElement.x || 50,
        y: docElement.y || 50,
        width: docElement.width || canvasSize.width - 100,
        fontSize: docElement.fontSize || 12,
        fontFamily: docElement.fontFamily || 'Arial',
        fontWeight: docElement.fontWeight,
        fontStyle: docElement.fontStyle,
        fill: docElement.fill || textProperties.fill || '#000000',
        textAlign: docElement.textAlign || 'left',
        ...createDragHandlers(docElement.id),
        onDblClick: (e) => {
          const node = e.target;
          createTextInputForEditing({
            id: docElement.id,
            text: node.text(),
            x: node.x(),
            y: node.y(),
            fontSize: node.fontSize(),
            fontFamily: node.fontFamily(),
            fill: node.fill(),
            width: node.width()
          });
        }
      };
      
    case 'image': {
      console.log('🖼️ Converting image element:', {
        id: docElement.id,
        hasImage: !!docElement.image,
        imageComplete: docElement.image?.complete,
        dimensions: {
          x: docElement.x,
          y: docElement.y,
          width: docElement.width,
          height: docElement.height
        },
        metadata: docElement.metadata
      });
      
      const konvaImage = {
        id: docElement.id || `image-${Date.now()}`,
        type: 'image',
        x: docElement.x || 50,
        y: docElement.y || 50,
        width: docElement.width || 200,
        height: docElement.height || 200,
        draggable: true,
        onMouseEnter: (e) => {
          const container = e.target.getStage().container();
          container.style.cursor = 'move';
        },
        onMouseLeave: (e) => {
          const container = e.target.getStage().container();
          container.style.cursor = 'default';
        }
      };
      
      // If we have an Image object, use it directly
      if (docElement.image instanceof HTMLImageElement) {
        konvaImage.image = docElement.image;
        console.log('✅ Using pre-loaded HTMLImageElement:', {
          complete: docElement.image.complete,
          naturalSize: `${docElement.image.naturalWidth}x${docElement.image.naturalHeight}`,
          displaySize: `${docElement.width}x${docElement.height}`,
          scalingRatio: {
            width: docElement.width / docElement.image.naturalWidth,
            height: docElement.height / docElement.image.naturalHeight
          }
        });
      }
      // If we have a src, we'll load it dynamically
      else if (docElement.src) {
        konvaImage.src = docElement.src;
        console.log('📄 Image will load from src');
        
        // Dynamically load the image
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          console.log('🖼️ Dynamically loaded image:', {
            id: docElement.id,
            naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
            displaySize: `${docElement.width}x${docElement.height}`
          });
          
          // Update the element with the loaded image
          setElements(prev => prev.map(el => 
            el.id === docElement.id ? { ...el, image: img } : el
          ));
        };
        img.onerror = (err) => {
          console.error('❌ Failed to load image:', docElement.src, err);
        };
        img.src = docElement.src;
      }
      
      return {
        ...konvaImage,
        ...createDragHandlers(docElement.id)
      };
    }
    
    case 'rectangle': {
      // Handle rectangle elements from PDF
      return {
        id: docElement.id || `rect-${Date.now()}`,
        type: 'rectangle',
        x: docElement.x || 50,
        y: docElement.y || 50,
        width: docElement.width || 100,
        height: docElement.height || 100,
        fill: docElement.fill || '#ffffff',
        stroke: docElement.stroke || '#000000',
        strokeWidth: docElement.strokeWidth || 1,
        ...createDragHandlers(docElement.id)
      };
    }
    
    case 'circle': {
      // Handle circle elements from PDF
      return {
        id: docElement.id || `circle-${Date.now()}`,
        type: 'circle',
        x: docElement.x || 50,
        y: docElement.y || 50,
        radius: docElement.radius || 50,
        fill: docElement.fill || '#ffffff',
        stroke: docElement.stroke || '#000000',
        strokeWidth: docElement.strokeWidth || 1,
        ...createDragHandlers(docElement.id)
      };
    }
    
    case 'line': {
      // Handle line elements from PDF
      return {
        id: docElement.id || `line-${Date.now()}`,
        type: 'line',
        points: docElement.points || [0, 0, 100, 0],
        stroke: docElement.stroke || '#000000',
        strokeWidth: docElement.strokeWidth || 2,
        ...createDragHandlers(docElement.id)
      };
    }
      
    default:
      console.warn('Unsupported element type from DocumentEditor:', docElement.type, docElement);
      return null;
  }
}, [canvasSize, textProperties, setElements, createTextInputForEditing]);


const resetCanvasToDefault = useCallback(() => {
  setCanvasSize({
    width: DEFAULT_CANVAS_SIZE.width,
    height: DEFAULT_CANVAS_SIZE.height
  });
}, []);

// ✅ ADD: Image fitting helper function
const fitImageToCanvas = useCallback((img, canvasWidth, canvasHeight, maxPadding = 20) => {
  const imgWidth = img.width || img.naturalWidth || 200;
  const imgHeight = img.height || img.naturalHeight || 200;
  
  // Calculate scale to fit within canvas (with padding)
  const availableWidth = canvasWidth - (maxPadding * 2);
  const availableHeight = canvasHeight - (maxPadding * 2);
  
  const widthScale = availableWidth / imgWidth;
  const heightScale = availableHeight / imgHeight;
  const scale = Math.min(widthScale, heightScale, 1); // Don't scale up beyond original
  
  // Calculate centered position
  const fittedWidth = imgWidth * scale;
  const fittedHeight = imgHeight * scale;
  const centeredX = (canvasWidth - fittedWidth) / 2;
  const centeredY = (canvasHeight - fittedHeight) / 2;
  
  return {
    width: fittedWidth,
    height: fittedHeight,
    x: centeredX,
    y: centeredY,
    scale: scale
  };
}, []);


// ✅ Add this helper function for when DocumentEditor fails
const handleSimpleFileUpload = useCallback(async (file) => {
  console.log('Using simple file upload fallback for:', file.name);
  
  if (file.type.startsWith('image/')) {
    // Simple image upload with auto-fit
    const img = new window.Image();
    const imageUrl = URL.createObjectURL(file);
    
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });
      
      // ✅ FIX: Auto-fit image to canvas
      const fitted = fitImageToCanvas(img, canvasSize.width, canvasSize.height);
      
      const imageElement = {
        id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        image: img,
        x: fitted.x,
        y: fitted.y,
        width: fitted.width,
        height: fitted.height,
        draggable: true,
        src: imageUrl
      };
      
      setElements(prev => {
        const updated = [...prev, imageElement];
        addToHistory(updated);
        return updated;
      });
      
      setSelectedId(imageElement.id);
      showNotification('Image uploaded (auto-fitted to canvas)', 'info');
      
    } catch (error) {
      console.error('Simple image upload failed:', error);
      showNotification('Failed to upload image', 'error');
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
    
  } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    // Simple text upload
    try {
      const text = await file.text();
      const textElement = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        text: text.substring(0, 1000) + (text.length > 1000 ? '...' : ''),
        x: 50,
        y: 50,
        width: canvasSize.width - 100,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000000',
        draggable: true
      };
      
      setElements(prev => {
        const updated = [...prev, textElement];
        addToHistory(updated);
        return updated;
      });
      
      setSelectedId(textElement.id);
      showNotification('Text file uploaded (basic mode)', 'info');
      
    } catch (error) {
      console.error('Simple text upload failed:', error);
      showNotification('Failed to read text file', 'error');
    }
    
  } else {
    showNotification(`Cannot process ${file.type} in basic mode. Please use PDF/Image files.`, 'error');
  }
}, [canvasSize, showNotification, setElements, setSelectedId, fitImageToCanvas, addToHistory]);


// ✅ FIXED: loadPageElements with proper scaling
const loadPageElements = useCallback(async (pageData, pageIndex) => {
  if (!pageData || !pageData.elements) {
    console.log(`Page ${pageIndex + 1} has no elements`);
    setElements([]);
    addToHistory([]);
    return 0;
  }
  
  console.log(`📄 Loading page ${pageIndex + 1}:`, {
    originalPageSize: `${pageData.width}x${pageData.height}`,
    targetCanvasSize: `${STANDARD_A4_WIDTH}x${STANDARD_A4_HEIGHT}`,
    totalElements: pageData.elements.length,
    elementTypes: pageData.elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {})
  });
  
  let addedElementsCount = 0;
  const konvaElements = [];
  
  // Calculate the scale factor from page size to A4
  const pageWidth = pageData.width || STANDARD_A4_WIDTH;
  const pageHeight = pageData.height || STANDARD_A4_HEIGHT;
  
  const scaleX = STANDARD_A4_WIDTH / pageWidth;
  const scaleY = STANDARD_A4_HEIGHT / pageHeight;
  const scale = Math.min(scaleX, scaleY); // Scale uniformly to fit
  
  console.log(`📏 SCALING CALCULATION:`, {
    pageSize: `${pageWidth.toFixed(2)}x${pageHeight.toFixed(2)}`,
    targetSize: `${STANDARD_A4_WIDTH}x${STANDARD_A4_HEIGHT}`,
    scaleX: scaleX.toFixed(3),
    scaleY: scaleY.toFixed(3),
    finalScale: scale.toFixed(3),
    scaledPageSize: `${(pageWidth * scale).toFixed(2)}x${(pageHeight * scale).toFixed(2)}`
  });
  
  // First, pre-load any images
  const imagePromises = pageData.elements
    .filter(el => el.type === 'image' && el.src && !el.image)
    .map(async (docElement) => {
      try {
        console.log('🖼️ Pre-loading image element BEFORE scaling:', {
          id: docElement.id,
          originalDimensions: {
            x: docElement.x,
            y: docElement.y,
            width: docElement.width,
            height: docElement.height
          }
        });
        
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('✅ Pre-loaded image:', {
              id: docElement.id,
              naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
              elementSize: `${docElement.width}x${docElement.height}`,
              metadata: docElement.metadata
            });
            resolve();
          };
          img.onerror = (err) => {
            console.error('❌ Failed to pre-load image:', docElement.id, err);
            reject(err);
          };
          img.src = docElement.src;
        });
        
        docElement.image = img;
        
        // Store original dimensions for reference
        docElement._originalWidth = docElement.width;
        docElement._originalHeight = docElement.height;
        
      } catch (error) {
        console.error('❌ Failed to pre-load image:', error);
      }
    });

  // Wait for images to load
  await Promise.all(imagePromises);
  
  // DEBUG: Log all elements before scaling
  console.log('📋 ELEMENTS BEFORE SCALING:');
  pageData.elements.forEach((el, idx) => {
    console.log(`  [${idx}] ${el.type}:`, {
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      radius: el.radius,
      points: el.points?.length
    });
  });
  
  // Process and scale all elements
  pageData.elements.forEach((docElement, elementIndex) => {
    console.log(`\n🔄 Processing element ${elementIndex} (${docElement.type}):`, {
      id: docElement.id,
      beforeScaling: {
        x: docElement.x,
        y: docElement.y,
        width: docElement.width,
        height: docElement.height,
        radius: docElement.radius
      }
    });
    
    // Apply scale to all elements (position and size)
    const scaledElement = { ...docElement };
    
    // Scale position
    scaledElement.x = (docElement.x || 0) * scale;
    scaledElement.y = (docElement.y || 0) * scale;
    
    // Scale dimensions
    if (scaledElement.width) {
      scaledElement.width = scaledElement.width * scale;
    }
    if (scaledElement.height) {
      scaledElement.height = scaledElement.height * scale;
    }
    
    // Special handling for circles (radius)
    if (scaledElement.radius) {
      scaledElement.radius = scaledElement.radius * scale;
    }
    
    // Special handling for lines (points array)
    if (scaledElement.points && Array.isArray(scaledElement.points)) {
      scaledElement.points = scaledElement.points.map((point) => {
        return point * scale;
      });
    }
    
    console.log(`📐 AFTER SCALING (scale: ${scale.toFixed(3)}):`, {
      original: { 
        x: docElement.x, 
        y: docElement.y, 
        width: docElement.width, 
        height: docElement.height,
        radius: docElement.radius 
      },
      scaled: { 
        x: Math.round(scaledElement.x), 
        y: Math.round(scaledElement.y), 
        width: Math.round(scaledElement.width), 
        height: Math.round(scaledElement.height),
        radius: Math.round(scaledElement.radius)
      },
      fitsInCanvas: {
        widthFits: scaledElement.width <= STANDARD_A4_WIDTH,
        heightFits: scaledElement.height <= STANDARD_A4_HEIGHT,
        canvasSize: `${STANDARD_A4_WIDTH}x${STANDARD_A4_HEIGHT}`
      }
    });
    
    // For images, log more details
    if (scaledElement.type === 'image') {
      console.log('🖼️ IMAGE SCALING DETAILS:', {
        originalElementSize: `${docElement.width}x${docElement.height}`,
        scaledElementSize: `${scaledElement.width}x${scaledElement.height}`,
        naturalImageSize: scaledElement.image ? 
          `${scaledElement.image.naturalWidth}x${scaledElement.image.naturalHeight}` : 'unknown',
        scalingRatio: {
          width: (scaledElement.width / (scaledElement.image?.naturalWidth || 1)).toFixed(3),
          height: (scaledElement.height / (scaledElement.image?.naturalHeight || 1)).toFixed(3)
        }
      });
    }
    
    const konvaElement = convertToKonvaElement(scaledElement);
    if (konvaElement) {
      konvaElements.push(konvaElement);
      addedElementsCount++;
    }
  });
  
  console.log(`\n✅ Converted ${addedElementsCount} elements to Konva format`);
  console.log('📊 FINAL ELEMENT SIZES:');
  konvaElements.forEach((el, idx) => {
    console.log(`  [${idx}] ${el.type}:`, {
      x: Math.round(el.x),
      y: Math.round(el.y),
      width: Math.round(el.width),
      height: Math.round(el.height),
      fitsInCanvas: el.width <= STANDARD_A4_WIDTH && el.height <= STANDARD_A4_HEIGHT
    });
  });
  
  // Set elements for this page
  setElements(konvaElements);
  addToHistory(konvaElements);
  
  // Always set canvas to standard A4 size
  setCanvasSize({
    width: STANDARD_A4_WIDTH,
    height: STANDARD_A4_HEIGHT
  });
  
  // Set selected element to the first image if available, or the first one
  if (konvaElements.length > 0) {
    const firstImage = konvaElements.find(el => el.type === 'image');
    setSelectedId(firstImage?.id || konvaElements[0].id);
  } else {
    setSelectedId(null);
  }
  
  console.log(`\n🎯 Page ${pageIndex + 1} loaded with ${addedElementsCount} elements (scaled by ${scale.toFixed(3)}x)`);
  console.log(`📐 Canvas set to A4: ${STANDARD_A4_WIDTH}x${STANDARD_A4_HEIGHT}`);
  
  return addedElementsCount;
}, [convertToKonvaElement, addToHistory, setElements, setCanvasSize, setSelectedId]);

// ------------------ ADD THIS: Helper to create serializable elements ------------------
// ------------------ ADD THIS: Helper to create serializable elements ------------------
const createSerializableElement = useCallback((element) => {
  // Create a deep copy to avoid mutating original
  const cleanElement = JSON.parse(JSON.stringify(element));
  
  // For image elements, ensure we only keep src, not the HTMLImageElement
  if (cleanElement.type === 'image') {
    if (cleanElement.image) {
      // If we have an image object, extract the src
      if (cleanElement.image.src) {
        cleanElement.src = cleanElement.image.src;
      }
      // Remove the HTMLImageElement entirely
      delete cleanElement.image;
    }
    // Also remove any Konva-specific image references
    if (cleanElement._image) {
      delete cleanElement._image;
    }
  }
  
  // Remove any function properties that might have been stringified
  const functionProps = [
    'onDragStart', 'onDragEnd', 'onDragMove', 'onTransformEnd',
    'onDblClick', 'onDblTap', 'onContextMenu', 'onClick', 'onTap',
    'onMouseEnter', 'onMouseLeave', 'onMouseDown', 'onMouseUp'
  ];
  
  functionProps.forEach(prop => {
    if (prop in cleanElement) {
      delete cleanElement[prop];
    }
  });
  
  // Remove any undefined/null values
  Object.keys(cleanElement).forEach(key => {
    if (cleanElement[key] === undefined || cleanElement[key] === null) {
      delete cleanElement[key];
    }
  });
  
  return cleanElement;
}, []);
// ------------------ Enhanced saveCurrentPage ------------------
const saveCurrentPage = useCallback(() => {
  if (pages.length > 0 && currentPageIndex >= 0) {
    const updatedPages = [...pages];
    
    // Clean elements for storage (remove event handlers)
    const serializableElements = elements.map(el => createSerializableElement(el));
    
    updatedPages[currentPageIndex] = {
      ...updatedPages[currentPageIndex],
      elements: serializableElements,
      width: canvasSize.width,
      height: canvasSize.height
    };
    setPages(updatedPages);
  }
}, [pages, currentPageIndex, elements, canvasSize, createSerializableElement]);


const goToNextPage = useCallback(() => {
  if (currentPageIndex < pages.length - 1) {
    saveCurrentPage(); // Save current page first
    const newIndex = currentPageIndex + 1;
    setCurrentPageIndex(newIndex);
    loadPageElements(pages[newIndex], newIndex);
    showNotification(`Page ${newIndex + 1} of ${pages.length}`, 'info');
  }
}, [pages, currentPageIndex, loadPageElements, showNotification, saveCurrentPage]);

const goToPrevPage = useCallback(() => {
  if (currentPageIndex > 0) {
    saveCurrentPage(); // Save current page first
    const newIndex = currentPageIndex - 1;
    setCurrentPageIndex(newIndex);
    loadPageElements(pages[newIndex], newIndex);
    showNotification(`Page ${newIndex + 1} of ${pages.length}`, 'info');
  }
}, [pages, currentPageIndex, loadPageElements, showNotification, saveCurrentPage]);

const goToPage = useCallback((pageIndex) => {
  if (pageIndex >= 0 && pageIndex < pages.length) {
    saveCurrentPage(); // Save current page first
    setCurrentPageIndex(pageIndex);
    loadPageElements(pages[pageIndex], pageIndex);
    showNotification(`Page ${pageIndex + 1} of ${pages.length}`, 'info');
  }
}, [pages, loadPageElements, showNotification, saveCurrentPage]);

// ✅ FIXED: Update your handleFileUpload function with decomposer options
const handleFileUpload = useCallback(async (files) => {
  if (!files || files.length === 0) {
    showNotification('No file selected', 'warning');
    return;
  }
  
  // ✅ FIX: Process only the first file for single upload
  const file = files[0];
  console.log('Processing single file:', file.name);
  
  // CRITICAL: Check if editor is FULLY ready before processing
  if (!isEditorFullyReady) {
    console.error('Editor not fully ready yet:', {
      canvasReady: isCanvasReady,
      editorReady: !!editor,
      editorLoading: isEditorLoading,
      editorError: !!editorError,
      processDocumentAvailable: typeof processDocument === 'function',
      isEditorFullyReady: isEditorFullyReady
    });
    
    let errorMsg = 'Document editor is still initializing. Please wait a moment and try again.';
    
    if (isCanvasReady && !editor) {
      errorMsg = 'Canvas ready but editor not initialized yet...';
    } else if (editor && isEditorLoading) {
      errorMsg = 'Editor is still loading...';
    } else if (editorError) {
      errorMsg = `Editor error: ${editorError}. Please try again.`;
    }
    
    showNotification(errorMsg, 'warning');
    return;
  }
  
  try {
    setIsProcessingFile(true);
    showNotification(`Processing ${file.name}...`, 'info');
    
    console.log('✅ Editor state at upload:', {
      editorReady: !!editor,
      processDocument: typeof processDocument,
      isLoading: isEditorLoading,
      error: editorError,
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size,
      canvasReady: isCanvasReady,
      isEditorFullyReady: isEditorFullyReady,
      timestamp: new Date().toISOString()
    });
    
    // ✅ Move getFileType inside the useCallback
    const getFileType = (file) => {
      if (file.type) {
        if (file.type === 'application/pdf') return 'pdf';
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('text/')) return 'text';
      }
      
      const fileName = file.name.toLowerCase();
      const ext = fileName.split('.').pop();
      
      if (['pdf'].includes(ext)) return 'pdf';
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'tiff'].includes(ext)) return 'image';
      if (['txt', 'text', 'md', 'csv'].includes(ext)) return 'text';
      
      return 'unknown';
    };
    
    const fileType = getFileType(file);
    
    // If editor is not ready but processDocument is available, try to use it
    if (processDocument && typeof processDocument === 'function') {
      try {
        console.log(`📤 Starting ${fileType.toUpperCase()} processing...`);
        
        // ✅ IMPORTANT: Force processAllPages to TRUE for ALL PDFs (not just fileType === 'pdf')
        const processAllPages = fileType === 'pdf';
        
        // ✅ UPDATED: Add decomposer options here
        const processedDoc = await processDocument(file, {
          // 🔥 NEW: Decomposer-specific options for intelligent element extraction
          useDecomposer: true, // Enable intelligent decomposition
          detectShapes: true, // Try to detect shapes in images/PDFs
          textRegionDetection: true, // Group text into logical regions
          ocrConfidenceThreshold: 0.7, // Only accept high-confidence OCR
          
          // ✅ EXISTING: Your original options (keep these)
          extractText: true,
          extractGraphics: true,
          scale: 2.0,
          processAllPages: processAllPages, // ✅ Always true for PDFs
          forceAllPages: true, // ✅ ADD THIS if your DocumentEditor supports it
          maxPages: 50, // ✅ Optional: Set a limit
          
          // ✅ EXISTING: Additional options from your original setup
          preserveLayout: true,
          semanticStructure: true
        });
        
        console.log(`📊 ${fileType.toUpperCase()} processing complete:`, {
          pages: processedDoc.pages?.length || 0,
          elementsPerPage: processedDoc.pages?.map((p, i) => `Page ${i+1}: ${p.elements?.length || 0} elements`),
          totalElements: processedDoc.pages?.reduce((sum, p) => sum + (p.elements?.length || 0), 0),
          metadata: processedDoc.metadata,
          type: processedDoc.type,
          fileName: file.name,
          // 🔥 NEW: Check which processing method was used
          processingMethod: processedDoc.metadata?.processingMethod || 'unknown',
          decomposerSuccess: processedDoc.metadata?.decomposerSuccess || false
        });
        
        if (processedDoc.pages && processedDoc.pages.length > 0) {
          // ✅ FIX: Check if we have all pages
          const hasAllPages = processedDoc.pages.length > 1;
          
          // Store all pages for multi-page navigation
          setPages(processedDoc.pages);
          setDocumentMetadata({
            fileName: file.name,
            fileType: fileType,
            totalPages: processedDoc.pages.length,
            processingMethod: processedDoc.metadata?.processingMethod,
            decomposerUsed: processedDoc.metadata?.decomposerSuccess || false,
            timestamp: new Date().toISOString(),
            hasAllPages: hasAllPages // ✅ Track if we have all pages
          });
          
          // ✅ Load first page
          const firstPageData = processedDoc.pages[0];
          await loadPageElements(firstPageData, 0);
          setCurrentPageIndex(0);
          
          // ✅ FIX: Reset canvas to standard size when loading new document
          if (fileType === 'pdf' || fileType === 'image') {
            setCanvasSize({
              width: STANDARD_A4_WIDTH,
              height: STANDARD_A4_HEIGHT
            });
          }
          
          // Show appropriate notification based on page count AND processing method
          if (processedDoc.pages.length > 1) {
            const decomposerMessage = processedDoc.metadata?.decomposerSuccess 
              ? ' (Intelligent decomposition used)' 
              : ' (Basic processing used)';
            
            showNotification(
              `${fileType.toUpperCase()} loaded with ${processedDoc.pages.length} pages${decomposerMessage}. Use page navigation controls.`,
              'info'
            );
            
            // ✅ DEBUG: Log page information
            console.log('📄 Page navigation enabled:', {
              totalPages: processedDoc.pages.length,
              pages: processedDoc.pages.map((p, i) => ({
                page: i + 1,
                elements: p.elements?.length || 0,
                width: p.width,
                height: p.height
              })),
              processingMethod: processedDoc.metadata?.processingMethod
            });
          } else {
            // ✅ If we expected more pages but only got one
            if (fileType === 'pdf' && processedDoc.metadata?.expectedPages > 1) {
              showNotification(
                `PDF loaded but only 1 page was extracted. This might be a scanned PDF limitation.`,
                'warning'
              );
            } else {
              const decomposerMessage = processedDoc.metadata?.decomposerSuccess 
                ? ' (Intelligent decomposition successful!)' 
                : ' (Basic processing used)';
              
              showNotification(`${fileType.toUpperCase()} processed successfully!${decomposerMessage}`, 'success');
            }
          }
          
        } else {
          // NO ELEMENTS EXTRACTED - Add a placeholder
          console.log('⚠️ No elements extracted. Adding placeholder...');
          
          // Check if it's a scanned PDF
          const isScannedPDF = fileType === 'pdf' && (!processedDoc.metadata || processedDoc.metadata.processingMethod === 'ocr_fallback');
          
          const placeholderElement = {
            id: `placeholder-${Date.now()}`,
            type: 'text',
            text: isScannedPDF 
              ? `📄 Scanned PDF: ${file.name}\n\nThis appears to be a scanned document (image-based).\nOnly page 1 was processed due to memory constraints.\n\nTry uploading:\n• Searchable PDFs (with selectable text)\n• Single page images (PNG, JPG, etc.)\n• Text files (TXT)`
              : `📄 File processed: ${file.name}\n\nNo extractable elements were found.\nFile type: ${fileType.toUpperCase()}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\nProcessing method: ${processedDoc.metadata?.processingMethod || 'unknown'}`,
            x: 50,
            y: 50,
            width: canvasSize.width - 100,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: isScannedPDF ? '#ff9800' : '#2196f3',
            draggable: true
          };
          
          setElements(prev => {
            const updated = [...prev, placeholderElement];
            addToHistory(updated);
            return updated;
          });
          
          setSelectedId(placeholderElement.id);
          showNotification(`No elements extracted from ${fileType.toUpperCase()}. Added placeholder.`, 'warning');
        }
        
      } catch (processError) {
        console.error('processDocument failed:', processError);
        console.error('Error details:', {
          message: processError.message,
          stack: processError.stack,
          fileName: file.name,
          fileType: file.type
        });
        
        // If it's a PDF and DocumentEditor failed, show error
        if (file.type === 'application/pdf') {
          showNotification(
            'PDF processing requires DocumentEditor which failed to initialize. ' +
            'Please try uploading an image or text file instead.',
            'error'
          );
          return;
        }
        
        // For images, fallback to simple upload with auto-fit
        if (file.type.startsWith('image/')) {
          console.log('🔄 Falling back to simple image upload due to error...');
          await handleSimpleFileUpload(file);
        } else {
          throw processError;
        }
      }
    } else {
      // No processDocument available at all
      console.error('processDocument not available:', {
        processDocument,
        type: typeof processDocument,
        editor: !!editor,
        isEditorFullyReady
      });
      
      // Check file type to provide appropriate fallback
      if (file.type.startsWith('image/')) {
        console.log('🔄 Using simple image upload (processDocument not available)...');
        await handleSimpleFileUpload(file);
      } else if (file.type === 'application/pdf') {
        throw new Error('PDF processing not available. Document editor failed to initialize.');
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        // Handle text files directly as fallback
        console.log('📝 Processing text file directly...');
        const text = await file.text();
        const textElement = {
          id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'text',
          text: text.substring(0, 1000) + (text.length > 1000 ? '...' : ''),
          x: 50,
          y: 50,
          width: canvasSize.width - 100,
          fontSize: 12,
          fontFamily: 'Arial',
          fill: '#000000',
          draggable: true
        };
        
        setElements(prev => {
          const updated = [...prev, textElement];
          addToHistory(updated);
          return updated;
        });
        
        setSelectedId(textElement.id);
        showNotification(`Text file "${file.name}" added to canvas (basic mode)`, 'success');
      } else {
        throw new Error('Document processing not available for this file type');
      }
    }
    
  } catch (err) {
    console.error('File processing error:', err);
    console.error('Full error details:', {
      message: err.message,
      stack: err.stack,
      fileName: file?.name,
      fileType: file?.type
    });
    
    let errorMessage = err.message;
    if (err.message.includes('not ready') || err.message.includes('initializing')) {
      errorMessage = 'Document editor is still starting up. Please wait a moment and try again.';
    } else if (err.message.includes('not available')) {
      errorMessage = 'Document processing is currently unavailable. Please try uploading an image or text file instead.';
    } else if (err.message.includes('PDF processing')) {
      errorMessage = 'PDF processing requires document editor which failed to initialize. Please try uploading an image or text file.';
    } else if (err.message.includes('scanned')) {
      errorMessage = 'This appears to be a scanned PDF (image-based). Try uploading a searchable PDF or an image file.';
    } else if (err.message.includes('memory')) {
      errorMessage = 'PDF too large for processing. Try uploading smaller PDFs or single-page images.';
    }
    
    showNotification(`Error: ${errorMessage}`, 'error');
    
    // Try simple fallback for images only
    if (file?.type?.startsWith('image/')) {
      console.log('🔄 Last resort: Trying simple fallback for image...');
      try {
        await handleSimpleFileUpload(file);
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
      }
    }
  } finally {
    setIsProcessingFile(false);
    console.log('🏁 File processing complete');
  }
}, [
  isEditorFullyReady,
  isCanvasReady,
  processDocument,
  addToHistory,
  canvasSize,
  showNotification,
  setElements,
  setSelectedId,
  editor,
  editorError,
  isEditorLoading,
  handleSimpleFileUpload,
  loadPageElements,
  setPages,
  setDocumentMetadata,
  setCurrentPageIndex,
  setCanvasSize,
 
]);


// Add this debug function
const debugImageSizes = useCallback(() => {
  console.log('🖼️ DEBUG - Current image sizes on canvas:', {
    canvasSize,
    totalElements: elements.length,
    imageElements: elements.filter(el => el.type === 'image').map(el => ({
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      src: el.src?.substring(0, 30) + '...',
      fitsInCanvas: el.width <= canvasSize.width && el.height <= canvasSize.height
    }))
  });
}, [canvasSize, elements]);

// Call this when images are loaded
// Add to your render or useEffect
useEffect(() => {
  if (elements.length > 0) {
    const imageElements = elements.filter(el => el.type === 'image');
    if (imageElements.length > 0) {
      debugImageSizes();
    }
  }
}, [elements, debugImageSizes]);

  // OCR Split Utility
  const addOCRToCanvas = useCallback(() => {
    if (!content) return;

    const chunks = splitTextIntoChunks(content, 500);

    chunks.forEach((chunk, i) => {
      addElement("text", {
        text: chunk,
        x: 50,
        y: 50 + (i * 150),
        width: canvasSize.width - 100,
        fontSize: 12,
        fontFamily: "Arial",
        fill: "#000"
      });
    });

    showNotification("OCR text added to canvas!");
  }, [content, addElement, canvasSize.width, showNotification]);

const clearCanvas = useCallback(() => {
  showNotification('Clearing canvas...', 'info');
  
  setTimeout(() => {
    // Clear current elements
    setElements([]);
    addToHistory([]);
    
    // Clear pages
    setPages([]);
    setCurrentPageIndex(0);
    setDocumentMetadata(null);
    
    // ✅ FIX: Reset canvas to default size
    resetCanvasToDefault();
    
    hasOCRContentRef.current = false;
    showNotification('Canvas cleared - All pages removed', 'success');
  }, 100);
}, [addToHistory, showNotification, setElements, setPages, setCurrentPageIndex, setDocumentMetadata, resetCanvasToDefault]);


const resetEditor = useCallback(() => {
  showNotification('Resetting editor...', 'info');
  
  setTimeout(() => {
    setElements([]);
    setSelectedId(null);
    setHistory([]);
    setHistoryStep(-1);
    setCurrentTemplate(null);
    
    // ✅ FIX: Reset canvas to default size
    resetCanvasToDefault();
    
    setZoom(1);
    setIsDrawing(false);
    setDrawingPoints([]);
    
    // Clear pages
    setPages([]);
    setCurrentPageIndex(0);
    setDocumentMetadata(null);
    
    hasOCRContentRef.current = false;
    showNotification('Editor reset successfully!', 'success');
  }, 100);
}, [showNotification, setElements, setSelectedId, setHistory, setHistoryStep, setCurrentTemplate, resetCanvasToDefault, setZoom, setIsDrawing, setDrawingPoints, setPages, setCurrentPageIndex, setDocumentMetadata]);

  const applyTemplate = useCallback((templateKey) => {
    const template = TEMPLATES[templateKey];
    if (template) {
      const newElements = template.elements.map(el => ({
        ...el,
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      setElements(newElements);
      if (template.canvasSize) {
        setCanvasSize(template.canvasSize);
      }
      setCurrentTemplate(templateKey);
      addToHistory(newElements);
      showNotification(`"${template.name}" template applied!`);
    }
  }, [addToHistory, showNotification, setElements, setCanvasSize, setCurrentTemplate]);

// Update useDropzone to properly handle files
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop: async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      // ✅ FIX: Process only first file
      await handleFileUpload([acceptedFiles[0]]);
    }
  },
  accept: {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt']
  },
  maxFiles: 1, // ✅ FIX: Explicitly set to 1
  multiple: false, // ✅ FIX: Disable multiple selection
  maxSize: 100 * 1024 * 1024,
  noClick: false,
  noKeyboard: false,
  onError: (err) => {
    console.error('Dropzone error:', err);
    showNotification('File upload error: ' + err.message, 'error');
  }
});

const handleManualFileUpload = () => {
  if (fileInputRef.current) {
    fileInputRef.current.click();
  }
};

const handleFileInputChange = (event) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    handleFileUpload(files);
    // Reset the input so the same file can be selected again
    event.target.value = '';
  }
};

// ------------------ Export Operations ------------------
const handleSaveWithFormat = async (format = 'json') => {
  try {
    setIsExporting(true);
    console.log('🔍 Export Debug:', {
      format,
      exportMode,
      selectedPages,
      totalPages: pages.length,
      currentPageIndex,
      hasPages: pages.length > 0,
      pageSizes: pages.map((p, i) => `Page ${i+1}: ${p.width}x${p.height}, ${p.elements?.length || 0} elements`)
    });

    // Build export data
    const exportData = {
      content: content || '',
      elements: elements, // Current page elements
      canvasSize: canvasSize,
      pages: pages, // ALL pages
      metadata: {
        timestamp: new Date().toISOString(),
        documentType: documentType || 'pdf_design',
        aiResults: aiResults ? 'available' : null,
        exportFormat: format,
        totalPages: pages.length || 1,
        currentPage: currentPageIndex + 1
      },
      textProperties: textProperties // ← ADD THIS LINE
    };

    // Determine which pages to export
    let pagesToExport = [];
    switch (exportMode) {
      case 'all':
        pagesToExport = Array.from({ length: pages.length || 1 }, (_, i) => i);
        break;
      case 'current':
        pagesToExport = [currentPageIndex];
        break;
      case 'range': {
        const startIdx = Math.max(0, exportStartPage - 1);
        const endIdx = Math.min((pages.length || 1) - 1, exportEndPage - 1);
        pagesToExport = Array.from({ length: endIdx - startIdx + 1 }, (_, i) => startIdx + i);
        break;
      }
      case 'select':
        pagesToExport = selectedPages.length > 0 ? selectedPages : [currentPageIndex];
        break;
      case 'merge':
        pagesToExport = Array.from({ length: pages.length || 1 }, (_, i) => i);
        break;
      default:
        pagesToExport = [currentPageIndex];
    }

    console.log('📄 Pages to export:', {
      indices: pagesToExport,
      pageNumbers: pagesToExport.map(i => i + 1),
      totalSelected: pagesToExport.length
    });

    // Prepare page options for the export utility
    const pageOptions = {
      exportMode,
      currentPageIndex,
      startPage: exportStartPage,
      endPage: exportEndPage,
      selectedPages: pagesToExport,
      mergeRatio: exportMode === 'merge' ? mergeRatio : 1,
      filename: `design-${documentType || 'export'}-${Date.now()}`,
      pages: pages, // Pass all pages
      canvasSize: canvasSize, // ← Ensure this is passed
      textProperties: textProperties // ← ADD THIS LINE for enhanced text clarity
    };

    // Call the export utility
    const result = await handlePDFDocumentExport( // ← Store the result
      format,
      exportData,
      stageRef,
      canvasSize,
      textProperties, // ← Make sure this is passed
      exportData.metadata,
      pageOptions
    );

    console.log('✅ Export result:', result);

    // Save export record if needed
    if (onSave) {
      const exportRecord = {
        format: format,
        timestamp: new Date().toISOString(),
        elementsCount: elements.length,
        canvasSize: canvasSize,
        documentType: documentType,
        pageInfo: {
          exportMode,
          selectedPages: pagesToExport,
          totalPages: pages.length || 1,
          mergeRatio: exportMode === 'merge' ? mergeRatio : null
        },
        qualityInfo: {
          usedCanvasSize: result.usedCanvasSize || false,
          textClarity: result.textClarity || 'standard',
          pixelRatio: result.pixelRatio || 1
        }
      };
      await onSave(JSON.stringify(exportRecord), 'export-record');
    }
    
    showNotification(`Design exported as ${format.toUpperCase()} successfully!`, 'success');
    
  } catch (error) {
    console.error('Save/Export error:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    setIsExporting(false);
    setSaveDialogOpen(false);
  }
};

  // ------------------ Drawing Handlers ------------------

const handleStageMouseDown = useCallback((e) => {
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  
  // Use konvaToolManager event handler
  const result = konvaToolManager.eventHandlers.onPointerDown(
    { x: pos.x / zoom, y: pos.y / zoom },
    e
  );
  
  // Fallback to original logic if tool manager doesn't handle it
  if (!result && ['brush', 'pencil', 'eraser', 'highlighter', 'freehand'].includes(selectedTool)) {
    setIsDrawing(true);
    setDrawingPoints([pos.x / zoom, pos.y / zoom]);
  }
  
  const input = document.getElementById('konva-text-input');
  if (input) {
    input.blur();
  }
}, [selectedTool, zoom, konvaToolManager]);

// UPDATE your handleStageMouseMove function:
const handleStageMouseMove = useCallback((e) => {
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  
  // Use konvaToolManager event handler
  const result = konvaToolManager.eventHandlers.onPointerMove(
    { x: pos.x / zoom, y: pos.y / zoom },
    e
  );
  
  // Fallback to original logic
  if (!result && !konvaToolManager.isDrawing && selectedTool !== 'freehand') return;
  
  if (isDrawing && selectedTool === 'freehand' && drawingPoints.length >= 2) {
    setDrawingPoints(prev => [...prev, pos.x / zoom, pos.y / zoom]);
  }
}, [isDrawing, selectedTool, zoom, drawingPoints, konvaToolManager]);

// UPDATE your handleStageMouseUp function:
const handleStageMouseUp = useCallback(() => {
  // Use konvaToolManager event handler
  const result = konvaToolManager.eventHandlers.onPointerUp();
  
  // Fallback to original logic
  if (!result && isDrawing && ['brush', 'pencil', 'eraser', 'highlighter', 'freehand'].includes(selectedTool) && drawingPoints.length >= 4) {
    const element = {
      id: `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'line',
      points: [...drawingPoints],
      x: drawingPoints[0],
      y: drawingPoints[1],
      stroke: selectedTool === 'highlighter' ? '#ffff00' : textProperties.fill,
      strokeWidth: selectedTool === 'eraser' ? 20 : 
                   selectedTool === 'highlighter' ? 15 : 
                   selectedTool === 'brush' ? 5 : 3,
      opacity: selectedTool === 'highlighter' ? 0.3 : 1,
      globalCompositeOperation: selectedTool === 'eraser' ? 'destination-out' : 'source-over',
      draggable: true
    };
    
    setElements(prev => {
      const updated = [...prev, element];
      addToHistory(updated);
      return updated;
    });
    
    setSelectedId(element.id);
  }
  
  setIsDrawing(false);
  setDrawingPoints([]);
}, [isDrawing, selectedTool, drawingPoints, textProperties.fill, addToHistory, konvaToolManager]);


  // Fix the OCR Initialization useEffect
useEffect(() => {
  if (open && content && !hasOCRContentRef.current) {
    hasOCRContentRef.current = true;
    
    const lines = content.split('\n').length;
    const estimatedHeight = lines * 18 + 100;
    
    setTimeout(() => {
      setCanvasSize(prev => {
        if (estimatedHeight > prev.height && estimatedHeight <= MAX_MERGE_HEIGHT) {
          return { ...prev, height: estimatedHeight };
        }
        return prev;
      });
      
      const ocrElement = {
        id: `ocr-${Date.now()}`,
        type: 'text',
        x: 50,
        y: 50,
        text: content,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#000',
        width: STANDARD_A4_WIDTH - 100,
        wrap: 'word',
        draggable: true
      };
      setElements(prev => {
        const updated = [...prev, ocrElement];
        addToHistory(updated);
        return updated;
      });
      
      showNotification("OCR content loaded!");
    }, 100);
  }
  
  return () => {
    if (!open) {
      hasOCRContentRef.current = false;
    }
  };
}, [open, content, addToHistory, showNotification]);



  // ------------------ Keyboard Shortcuts ----------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.matches('textarea, input')) {
        if (selectedId) {
          deleteSelectedElement();
          e.preventDefault();
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        const input = document.getElementById('konva-text-input');
        if (input) {
          input.blur();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setTextProperties(prev => ({
          ...prev,
          fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold'
        }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setTextProperties(prev => ({
          ...prev,
          fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteSelectedElement]);

  // Update selected text element when properties change
  useEffect(() => {
    if (!selectedId) return;

    setElements(prev => {
      return prev.map(el => {
        if (el.id !== selectedId || el.type !== 'text') return el;

        const needsUpdate = Object.keys(textProperties).some(
          key => el[key] !== textProperties[key]
        );

        if (!needsUpdate) return el;

        return { ...el, ...textProperties };
      });
    });
  }, [textProperties, selectedId]);

  // ------------------ Transformer Update ----------------
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  // Cleanup text input on unmount
  useEffect(() => {
    return () => {
      const input = document.getElementById('konva-text-input');
      if (input && input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };
  }, []);

  // Add this after your existing canvas useEffect (around line 330)
useEffect(() => {
  console.log('🔄 Canvas readiness changed:', {
    canvasReady: isCanvasReady,
    canvasElement: canvasRef.current,
    editorReady: !!editor,
    editorLoading: isEditorLoading,
    editorError: editorError
  });
  
  if (isCanvasReady && canvasRef.current) {
    console.log('🎉 Canvas is READY for file uploads!');
    showNotification('Document editor is now ready for file uploads', 'success');
  }
}, [isCanvasReady, editor, isEditorLoading,canvasRef, editorError, showNotification]);

// 🔥 CRITICAL: Add this useEffect to track when editor is FULLY ready
useEffect(() => {
  console.log('🔄 Editor readiness changed:', {
    canvasReady: isCanvasReady,
    editor: !!editor,
    editorLoading: isEditorLoading,
    editorError: editorError,
    processDocumentAvailable: typeof processDocument === 'function'
  });
  
  // Editor is fully ready when:
  // 1. Canvas is ready
  // 2. Editor instance exists
  // 3. Not loading
  // 4. No error
  // 5. processDocument function is available
  const fullyReady = isCanvasReady && 
                     !!editor && 
                     !isEditorLoading && 
                     !editorError && 
                     typeof processDocument === 'function';
  
  setIsEditorFullyReady(fullyReady);
  
  if (fullyReady) {
    console.log('✅ Canvas AND Editor are READY for file uploads!');
    showNotification('Document editor is now fully ready for file uploads', 'success');
  }
}, [isCanvasReady, editor, isEditorLoading, editorError, processDocument, showNotification]);

// Add this near your other useEffect hooks
useEffect(() => {
  console.log('🖼️ Canvas ref debug:', {
    refObject: canvasRef,
    current: canvasRef.current,
    refType: typeof canvasRef,
    isCanvasElement: canvasRef.current instanceof HTMLCanvasElement,
    canvasId: canvasRef.current?.id,
    parentNode: canvasRef.current?.parentNode,
    isInDOM: document.body.contains(canvasRef.current)
  });
}, [canvasRef]); // Run once on mount

// Enhanced MutationObserver to find OUR specific canvas
useEffect(() => {
  // First check if canvas already exists
  if (canvasRef.current) {
    console.log('✅ Canvas ref already exists:', canvasRef.current);
    setIsCanvasReady(true);
    return;
  }
  
  console.log('🔍 Setting up MutationObserver to find canvas...');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        Array.from(mutation.addedNodes).forEach((node) => {
          // Check if this is OUR canvas (look for specific attributes or position)
          if (node.nodeName === 'CANVAS') {
            const canvas = node;
            
            // Check if it's likely our canvas (has the hidden style)
            const style = canvas.style;
            const isHidden = style.position === 'absolute' && 
                            style.left === '-9999px' && 
                            style.top === '-9999px';
            
            if (isHidden) {
              console.log('🎯 Found OUR canvas via MutationObserver:', canvas);
              setIsCanvasReady(true);
              observer.disconnect(); // Stop observing once found
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also check periodically in case MutationObserver misses it
  const checkInterval = setInterval(() => {
    if (canvasRef.current && !isCanvasReady) {
      console.log('✅ Canvas found via interval check:', canvasRef.current);
      setIsCanvasReady(true);
      clearInterval(checkInterval);
      observer.disconnect();
    }
  }, 100);
  
  // Cleanup
  return () => {
    observer.disconnect();
    clearInterval(checkInterval);
  };
}, [isCanvasReady,canvasRef]);

// Update the debug useEffect to check actual properties:
useEffect(() => {
  console.log('📊 Document Editor Status:', {
    // Hook state
    editorReady: !!editor,
    isLoading: isEditorLoading,
    hasError: !!editorError,
    processDocumentAvailable: typeof processDocument === 'function',
    
    // Actual properties available from the hook
    canvasRef: !!canvasRef.current,
    selectedElementIds: editor?.selectedElementIds || [],
    documentData: !!editor?.pageCache?.size,
    
    // Component state
    openState: open,
    canvasSize: canvasSize,
    isProcessingFile: isProcessingFile
  });
  
  if (editorError) {
    console.error('❌ Document Editor Error:', editorError);
    showNotification(`Editor Error: ${editorError}`, 'error');
  }
}, [editor, isEditorLoading, editorError, canvasRef,processDocument, open, canvasSize, isProcessingFile, showNotification],);
// ------------------ Render ------------------
return (
  <Dialog 
    open={open} 
    onClose={() => {
      // Use the hook to go back - ONLY this line
      goBackToAdvancedOCR();
    }}
    maxWidth="xl"
    fullWidth
    sx={{
      '& .MuiDialog-paper': { 
        height: '95vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    }}
  >
     
      {/* Loading Overlay for File Processing */}
      {isProcessingFile && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ color: 'white', ml: 2 }}>
            Processing document...
          </Typography>
        </Box>
      )}

      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        color: 'white',
        borderBottom: '1px solid #34495e',
        padding: '16px 24px'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PictureAsPdf sx={{ fontSize: 32, color: '#fff' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                Pro PDF Editor
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Create, Edit & Design Professional Documents
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Undo">
              <span>
                <IconButton 
                  onClick={undo} 
                  disabled={historyStep <= 0} 
                  sx={{ 
                    color: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  <Undo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton 
                  onClick={redo} 
                  disabled={historyStep >= history.length - 1} 
                  sx={{ 
                    color: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  <Redo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Reset Editor">
              <span>
                <IconButton 
                  onClick={resetEditor} 
                  sx={{ 
                    color: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                >
                  <RestartAlt />
                </IconButton>
              </span>
            </Tooltip>
            {selectedId && (
              <Tooltip title="Delete Selected">
                <span>
                  <IconButton 
                    onClick={deleteSelectedElement} 
                    sx={{ 
                      color: '#fff',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      }
                    }}
                  >
                    <Delete />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', height: '100%', backgroundColor: '#ecf0f1' }}>
        {/* Left Sidebar - Tools & Templates */}
        <Box sx={{ 
          width: 300, 
          borderRight: 1, 
          borderColor: 'divider', 
          p: 2,
          backgroundColor: 'white',
          overflow: 'auto'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48
              }
            }}
          >
            <Tab label="Templates" />
            <Tab label="Elements" />
            <Tab label="Properties" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  Choose Template
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(TEMPLATES).map(([key, template]) => (
                    <Grid size={{ xs: 6 }} key={key}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: currentTemplate === key ? 2 : 1,
                          borderColor: currentTemplate === key ? '#3498db' : 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 3
                          }
                        }}
                        onClick={() => applyTemplate(key)}
                      >
                        <CardContent sx={{ p: 1, textAlign: 'center' }}>
                          <PictureAsPdf sx={{ fontSize: 32, color: '#3498db', mb: 1 }} />
                          <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                            {template.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Page Navigation Controls */}
                {pages.length > 1 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    ml: 2,
                    p: 1,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderRadius: 1,
                    border: '1px solid rgba(52, 152, 219, 0.3)'
                  }}>
                    <IconButton 
                      size="small" 
                      onClick={goToPrevPage} 
                      disabled={currentPageIndex === 0}
                      sx={{ 
                        color: '#3498db',
                        '&:hover': { backgroundColor: 'rgba(52, 152, 219, 0.2)' }
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                    
                    <Typography variant="body2" sx={{ 
                      minWidth: '80px', 
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#2c3e50'
                    }}>
                      Page {currentPageIndex + 1} of {pages.length}
                    </Typography>
                    
                    <IconButton 
                      size="small" 
                      onClick={goToNextPage} 
                      disabled={currentPageIndex === pages.length - 1}
                      sx={{ 
                        color: '#3498db',
                        '&:hover': { backgroundColor: 'rgba(52, 152, 219, 0.2)' }
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                    
                    {/* Page selector dropdown */}
                    <FormControl size="small" sx={{ minWidth: 80, ml: 1 }}>
                      <Select
                        value={currentPageIndex}
                        onChange={(e) => goToPage(e.target.value)}
                        sx={{
                          height: '32px',
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': {
                            padding: '6px 12px'
                          }
                        }}
                      >
                        {pages.map((_, index) => (
                          <MenuItem key={index} value={index}>
                            Page {index + 1}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* Enhanced File Upload Section */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    Upload Files
                  </Typography>
                  
                  {/* Drag & Drop Zone */}
                  <Box
                    {...getRootProps()}
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragActive ? '#3498db' : isEditorFullyReady ? '#bdc3c7' : '#ff9800',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: isEditorFullyReady ? 'pointer' : 'not-allowed',
                      backgroundColor: isDragActive ? '#ebf5fb' : isEditorFullyReady ? '#f8f9fa' : '#fff3e0',
                      transition: 'all 0.2s',
                      mb: 2,
                      '&:hover': {
                        borderColor: isEditorFullyReady ? '#3498db' : '#ff9800',
                        backgroundColor: isEditorFullyReady ? '#ebf5fb' : '#fff3e0'
                      },
                      pointerEvents: isEditorFullyReady ? 'auto' : 'none'
                    }}
                  >
                    <input {...getInputProps()} disabled={!isCanvasReady} />
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileInputChange}
                      accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,.pdf,.txt"
                      disabled={!isEditorFullyReady}
                    />
                    
                    <CloudUpload sx={{ 
                      fontSize: 48, 
                      color: isCanvasReady ? '#3498db' : '#ff9800', 
                      mb: 1 
                    }} />
                    
                    {isCanvasReady ? (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50', mb: 1 }}>
                          Drag & drop files here
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          Supports: Images (PNG, JPG, GIF), PDFs, Text files
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800', mb: 1 }}>
                          Initializing Document Editor...
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          Please wait for the editor to initialize before uploading files
                        </Typography>
                      </>
                    )}
                    
                    <Divider sx={{ my: 2 }}>OR</Divider>
                    
                    <Button
                      variant="contained"
                      startIcon={<Upload />}
                      onClick={handleManualFileUpload}
                      disabled={!isEditorFullyReady}
                      sx={{
                        background: isEditorFullyReady ? 
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                          'linear-gradient(135deg, #cccccc 0%, #999999 100%)',
                        fontWeight: 600,
                        '&:hover': isEditorFullyReady ? {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        } : {},
                        '&.Mui-disabled': {
                          color: '#999999'
                        }
                      }}
                    >
                      {isEditorFullyReady ? 'Browse Files' : 'Editor Initializing...'}
                    </Button>
                  </Box>
                  
                  {/* File Type Info */}
                    <Box sx={{ 
                      backgroundColor: '#f8f9fa', 
                      p: 2, 
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 1 }}>
                        Supported Formats & Features:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip label="PNG" size="small" variant="outlined" />
                        <Chip label="JPG" size="small" variant="outlined" />
                        <Chip label="GIF" size="small" variant="outlined" />
                        <Chip label="WebP" size="small" variant="outlined" />
                        <Chip label="PDF" size="small" variant="outlined" />
                        <Chip label="TXT" size="small" variant="outlined" />
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip label="Intelligent Decomposition" size="small" color="primary" variant="outlined" />
                        <Chip label="Shape Detection" size="small" color="secondary" variant="outlined" />
                        <Chip label="Text Extraction" size="small" color="info" variant="outlined" />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                        Max file size: 100MB • Uses intelligent element detection
                      </Typography>
                    </Box>
                                    </Box>
              </Box>
            )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Design Elements
              </Typography>

              {/* OCR Actions - Keep this section if you want it */}
              {content && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  border: '1px solid #3498db', 
                  borderRadius: 2,
                  backgroundColor: '#ebf5fb'
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                    <SmartToy sx={{ fontSize: 16, mr: 1 }} />
                    OCR Actions
                  </Typography>
                  <Button 
                    fullWidth
                    size="small"
                    startIcon={<TextFields />}
                    onClick={addOCRToCanvas}
                    sx={{ mb: 1 }}
                    variant="contained"
                  >
                    Add to Canvas
                  </Button>
                  <Button 
                    fullWidth
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => {
                      navigator.clipboard.writeText(content);
                      showNotification('OCR text copied to clipboard!');
                    }}
                    variant="outlined"
                  >
                    Copy Text
                  </Button>
                </Box>
              )}
            </Box>
          )}

              {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  Element Properties
                </Typography>
                
                {/* If a text element is selected, show text properties */}
                {selectedId && elements.find(el => el.id === selectedId && el.type === 'text') && (
                  <>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Font Family</InputLabel>
                      <Select
                        value={textProperties.fontFamily}
                        label="Font Family"
                        onChange={(e) => setTextProperties(prev => ({ ...prev, fontFamily: e.target.value }))}
                      >
                        {['Arial', 'Georgia', 'Times New Roman', 'Helvetica', 'Courier New', 'Verdana', 'Tahoma'].map(font => (
                          <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Tooltip title="Bold">
                        <IconButton
                          size="small"
                          color={textProperties.fontWeight === 'bold' ? 'primary' : 'default'}
                          onClick={() => setTextProperties(prev => ({ 
                            ...prev, 
                            fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold' 
                          }))}
                        >
                          <FormatBold />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Italic">
                        <IconButton 
                          size="small"
                          color={textProperties.fontStyle === 'italic' ? 'primary' : 'default'}
                          onClick={() => setTextProperties(prev => ({
                            ...prev,
                            fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
                          }))}
                        >
                          <FormatItalic />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Left">
                        <IconButton 
                          size="small"
                          color={textProperties.textAlign === 'left' ? 'primary' : 'default'}
                          onClick={() => setTextProperties(prev => ({ ...prev, textAlign: 'left' }))}
                        >
                          <FormatAlignLeft />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Center">
                        <IconButton 
                          size="small"
                          color={textProperties.textAlign === 'center' ? 'primary' : 'default'}
                          onClick={() => setTextProperties(prev => ({ ...prev, textAlign: 'center' }))}
                        >
                          <FormatAlignCenter />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Right">
                        <IconButton 
                          size="small"
                          color={textProperties.textAlign === 'right' ? 'primary' : 'default'}
                          onClick={() => setTextProperties(prev => ({ ...prev, textAlign: 'right' }))}
                        >
                          <FormatAlignRight />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                      Font Size: {textProperties.fontSize}px
                    </Typography>
                    <Slider
                      value={textProperties.fontSize}
                      onChange={(e, newValue) => setTextProperties(prev => ({ ...prev, fontSize: newValue }))}
                      min={8}
                      max={72}
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80 }}>
                        Text Color:
                      </Typography>
                      <input
                        type="color"
                        value={textProperties.fill}
                        onChange={(e) => setTextProperties(prev => ({ ...prev, fill: e.target.value }))}
                        style={{ 
                          width: 40, 
                          height: 40, 
                          border: 'none', 
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      />
                    </Box>
                  </>
                )}
                
                {/* If no text element selected, show general element properties */}
                {selectedId && !elements.find(el => el.id === selectedId && el.type === 'text') && (
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Selected Element
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Type: {elements.find(el => el.id === selectedId)?.type || 'Unknown'}
                    </Typography>
                    <Button 
                      fullWidth
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={deleteSelectedElement}
                      sx={{ fontWeight: 600 }}
                    >
                      Delete Selected
                    </Button>
                  </Box>
                )}
                
                {!selectedId && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Select an element to edit its properties
                  </Typography>
                )}
                
                {/* Keep your Export Quality Settings section here */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  Export Quality Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportQuality.enhanceText}
                      onChange={(e) => setExportQuality(prev => ({ ...prev, enhanceText: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      Enhanced Text Clarity
                    </Typography>
                  }
                  sx={{ mb: 1, width: '100%' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', ml: 4 }}>
                  Improves text sharpness, especially for OCR content
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportQuality.preserveOCR}
                      onChange={(e) => setExportQuality(prev => ({ ...prev, preserveOCR: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      Preserve OCR Metadata
                    </Typography>
                  }
                  sx={{ mb: 1, width: '100%' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', ml: 4 }}>
                  Includes OCR confidence scores and original text in exports
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportQuality.highDPI}
                      onChange={(e) => setExportQuality(prev => ({ ...prev, highDPI: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      High DPI Export (2x)
                    </Typography>
                  }
                  sx={{ mb: 2, width: '100%' }}
                />
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                  Resolution (DPI): {exportQuality.dpi}
                </Typography>
                <Slider
                  value={exportQuality.dpi}
                  onChange={(e, newValue) => setExportQuality(prev => ({ ...prev, dpi: newValue }))}
                  min={72}
                  max={600}
                  step={72}
                  marks={[
                    { value: 72, label: 'Screen' },
                    { value: 150, label: 'Web' },
                    { value: 300, label: 'Print' },
                    { value: 600, label: 'Premium' }
                  ]}
                  sx={{ 
                    mb: 2,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.7rem',
                      color: '#666'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                  Higher DPI = Better quality but larger file size
                </Typography>
                
                {/* 🔥 NEW: Document Processing Settings Section */}
                <Divider sx={{ my: 3 }} />
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  mb: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AutoFixHigh sx={{ color: '#3498db', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                      Document Processing
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure how uploaded documents are processed and decomposed into editable elements
                  </Typography>
                  
                  {/* Processing Method Toggle */}
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Processing Mode</InputLabel>
                    <Select
                      value="intelligent"
                      label="Processing Mode"
                      onChange={(e) => {
                        showNotification(
                          e.target.value === 'intelligent' 
                            ? 'Intelligent decomposition enabled for next upload' 
                            : 'Basic processing enabled for next upload',
                          'info'
                        );
                      }}
                    >
                      <MenuItem value="intelligent">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SmartToy sx={{ fontSize: 18, color: '#3498db' }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Intelligent Decomposition</Typography>
                            <Typography variant="caption" color="text.secondary">Recommended for best results</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                      <MenuItem value="basic">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PictureAsPdf sx={{ fontSize: 18, color: '#666' }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Basic Processing</Typography>
                            <Typography variant="caption" color="text.secondary">Fast but limited extraction</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  
                  {/* Advanced Processing Options */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                    Advanced Features
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        color="primary"
                        onChange={(e) => showNotification(
                          `Shape detection ${e.target.checked ? 'enabled' : 'disabled'} for next upload`,
                          'info'
                        )}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                          Shape Detection
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Detect rectangles, circles, and lines
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 2, width: '100%' }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        color="primary"
                        onChange={(e) => showNotification(
                          `Text region detection ${e.target.checked ? 'enabled' : 'disabled'}`,
                          'info'
                        )}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                          Text Region Grouping
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Group text into logical paragraphs
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 2, width: '100%' }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        color="primary"
                        onChange={(e) => showNotification(
                          `Graphics extraction ${e.target.checked ? 'enabled' : 'disabled'}`,
                          'info'
                        )}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                          Graphics Extraction
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Extract images and graphics as separate elements
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 2, width: '100%' }}
                  />
                  
                  {/* OCR Confidence */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      OCR Confidence: <span style={{ color: '#3498db' }}>High (≥ 70%)</span>
                    </Typography>
                    <Slider
                      defaultValue={70}
                      min={30}
                      max={95}
                      step={5}
                      marks={[
                        { value: 30, label: 'Low' },
                        { value: 50, label: 'Medium' },
                        { value: 70, label: 'High' },
                        { value: 90, label: 'Strict' }
                      ]}
                      onChange={(e, newValue) => showNotification(
                        `OCR confidence threshold set to ${newValue}% for next upload`,
                        'info'
                      )}
                      sx={{ 
                        mb: 1,
                        '& .MuiSlider-markLabel': {
                          fontSize: '0.65rem',
                          color: '#666'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Higher values = More accurate but fewer text elements
                    </Typography>
                  </Box>
                  
                  {/* Current Document Info */}
                  {documentMetadata && (
                    <Box sx={{ 
                      mt: 3, 
                      p: 2, 
                      backgroundColor: '#e8f4fd', 
                      borderRadius: 1,
                      border: '1px solid #b3d9ff'
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0066cc', mb: 1 }}>
                        <Description sx={{ fontSize: 16, mr: 1 }} />
                        Current Document Info
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#2c3e50', display: 'block' }}>
                        File: {documentMetadata.fileName || 'Untitled'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#2c3e50', display: 'block' }}>
                        Type: {documentMetadata.fileType?.toUpperCase() || 'Unknown'}
                      </Typography>
                      {documentMetadata.processingMethod && (
                        <Typography variant="caption" sx={{ color: '#2c3e50', display: 'block' }}>
                          Processing: {documentMetadata.processingMethod.replace('_', ' ')}
                        </Typography>
                      )}
                      {documentMetadata.decomposerUsed !== undefined && (
                        <Chip
                          label={documentMetadata.decomposerUsed ? "Intelligent Processing" : "Basic Processing"}
                          color={documentMetadata.decomposerUsed ? "success" : "warning"}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
                
                {selectedId && (
                  <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1,
                    backgroundColor: '#f8f9fa'
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
                      Selected Element
                    </Typography>
                    <Button 
                      fullWidth
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={deleteSelectedElement}
                      sx={{ fontWeight: 600 }}
                    >
                      Delete Selected
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Main Canvas Area */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
          {/* OCR Content Display */}
          {content && showOCRArea && (
            <Paper sx={{ 
              p: 2, 
              mb: 2, 
              width: '100%', 
              maxWidth: '800px',
              border: '2px solid #3498db',
              backgroundColor: '#f8f9fa'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  <SmartToy sx={{ mr: 1, fontSize: 20 }} />
                  OCR Extracted Text
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Copy to clipboard">
                    <IconButton size="small" onClick={() => {
                      navigator.clipboard.writeText(content);
                      showNotification('OCR text copied to clipboard!');
                    }}>
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hide OCR text">
                    <IconButton size="small" onClick={() => setShowOCRArea(false)}>
                      <VisibilityOff />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Use the "Add to Canvas" button in the Elements tab to incorporate this text into your design.
              </Alert>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflow: 'auto',
                  backgroundColor: 'white',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              >
                {content}
              </Typography>
            </Paper>
          )}

          {!showOCRArea && content && (
            <Button 
              startIcon={<Visibility />}
              onClick={() => setShowOCRArea(true)}
              sx={{ mb: 2 }}
              variant="outlined"
            >
              Show OCR Text
            </Button>
          )}

          {/* Canvas Controls */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mb: 2, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            backgroundColor: '#f0f8ff',
            p: 2,
            borderRadius: 2,
            border: '2px solid #3498db',
            boxShadow: '0 4px 12px rgba(52, 152, 219, 0.15)',
            width: '100%',
            maxWidth: '800px'
          }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 700, 
              color: '#2c3e50',
              mr: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Canvas Controls:
            </Typography>
            
            {/* Zoom Controls */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              backgroundColor: 'white',
              padding: '4px 8px',
              borderRadius: 1,
              border: '1px solid #3498db'
            }}>
              <Tooltip title="Zoom Out">
                <IconButton 
                  onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}
                  size="small"
                  sx={{ 
                    color: '#3498db',
                    backgroundColor: '#ebf5fb',
                    '&:hover': {
                      backgroundColor: '#d6eaf8',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <ZoomOut />
                </IconButton>
              </Tooltip>
                {/* ADD THIS CHIP HERE - after zoom controls but before Status Chip */}
              <Chip
                label={`Quality: ${zoom >= 1.5 ? 'High' : 'Standard'}`}
                color={zoom >= 1.5 ? "primary" : "default"}
                variant="outlined"
                size="small"
                sx={{ 
                  ml: 1,
                  fontWeight: 600,
                  borderWidth: 2,
                  backgroundColor: zoom >= 1.5 ? '#ebf5fb' : 'white'
                }}
              />
              <Chip 
                label={`${Math.round(zoom * 100)}%`} 
                variant="outlined"
                sx={{ 
                  fontWeight: 700,
                  color: '#2c3e50',
                  borderColor: '#3498db',
                  backgroundColor: 'white'
                }}
              />
              {/* Decomposition Status Chip */}
              {documentMetadata?.decomposerUsed && (
                <Chip
                  label="Intelligent Decomposition ✓"
                  color="success"
                  variant="filled"
                  size="small"
                  sx={{ 
                    ml: 1,
                    fontWeight: 600,
                    backgroundColor: '#10b981',
                    color: 'white'
                  }}
                />
              )}

              {documentMetadata?.processingMethod === 'original_processing' && (
                <Chip
                  label="Basic Processing"
                  color="warning"
                  variant="filled"
                  size="small"
                  sx={{ 
                    ml: 1,
                    fontWeight: 600,
                    backgroundColor: '#f59e0b',
                    color: 'white'
                  }}
                />
              )}
              <Tooltip title="Zoom In">
                <IconButton 
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  size="small"
                  sx={{ 
                    color: '#3498db',
                    backgroundColor: '#ebf5fb',
                    '&:hover': {
                      backgroundColor: '#d6eaf8',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <ZoomIn />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Status Chip */}
            <Chip
              label={isEditorFullyReady ? "Ready ✓" : isCanvasReady ? "Initializing..." : "Loading..."}
              color={isEditorFullyReady ? "primary" : isCanvasReady ? "warning" : "default"}
              variant="filled"
              size="small"
              icon={isEditorFullyReady ? undefined : <CircularProgress size={16} />}
              sx={{ 
                ml: 1,
                fontWeight: 600,
                backgroundColor: isEditorFullyReady ? '#3498db' : '#f39c12',
                color: 'white'
              }}
            />
            
            {/* Clear Canvas Button */}
            <Button 
              startIcon={<AutoFixHigh />} 
              onClick={clearCanvas}
              variant="contained"
              size="small"
              sx={{ 
                ml: 1, 
                fontWeight: 700,
                backgroundColor: '#e74c3c',
                '&:hover': {
                  backgroundColor: '#c0392b',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(231, 76, 60, 0.3)'
                }
              }}
            >
              Clear Canvas
            </Button>
            
            {/* Page Size Selector */}
            <FormControl size="small" sx={{ minWidth: 120, ml: 1 }}>
              <InputLabel sx={{ 
                color: '#2c3e50', 
                fontWeight: 700,
                '&.Mui-focused': { color: '#3498db' }
              }}>
                Page Size
              </InputLabel>
              <Select
                value={`${canvasSize.width}x${canvasSize.height}`}
                label="Page Size"
                onChange={(e) => handleCanvasSizeChange(e.target.value)}
                sx={{
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3498db',
                    borderWidth: 2
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2980b9',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2980b9',
                  }
                }}
              >
                {Object.entries(FIXED_CANVAS_SIZES).map(([key, size]) => (
                  <MenuItem key={key} value={key}>
                    {size.name} ({size.width}x{size.height})
                  </MenuItem>
                ))}
                {/* Show custom option if not in standard sizes */}
                {!FIXED_CANVAS_SIZES[`${canvasSize.width}x${canvasSize.height}`] && (
                  <MenuItem value={`${canvasSize.width}x${canvasSize.height}`}>
                    Custom ({canvasSize.width}x{canvasSize.height})
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            
            {/* Debug Editor Button */}
            <Button 
              onClick={() => {
                console.log('Document Editor Debug Info:', {
                  editorReady: !!editor,
                  editorInstance: editor,
                  editorError: editorError,
                  editorLoading: isEditorLoading,
                  processDocumentAvailable: typeof processDocument === 'function',
                  processDocumentType: typeof processDocument,
                  openState: open,
                  elementsCount: elements.length,
                  selectedElement: selectedId,
                  canvasSize: canvasSize,
                  zoom: zoom,
                  selectedTool: selectedTool,
                  documentData: editor?.pageCache?.size,
                  currentPage: editor?.activePage,
                  totalPages: editor?.pageCache?.size,
                  pages: pages.length,
                  currentPageIndex: currentPageIndex,
                  documentMetadata: documentMetadata
                });
                showNotification('Document Editor debug info logged to console', 'info');
              }}
              variant="outlined"
              size="small"
              sx={{ 
                ml: 1,
                color: '#e67e22',
                borderColor: '#e67e22',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#fef9e7',
                  borderColor: '#d35400',
                  color: '#d35400'
                }
              }}
              startIcon={<Code />}
            >
              Debug Editor
            </Button>
            
        {/*  new export preiview page navigation */}
      <Button
       startIcon={<Visibility />}
        onClick={() => {
          // Save current state before preview
          saveCurrentPage();
          
          // Create serializable preview data WITHOUT HTMLImageElement objects
          const previewData = {
            pages: pages.map(page => ({
              ...page,
              elements: page.elements ? page.elements.map(el => {
                // Create a clean copy without non-serializable properties
                const cleanElement = { ...el };
                
                // Remove any HTMLImageElement or function properties
                if (cleanElement.type === 'image') {
                  // Keep only the src, not the image object
                  if (cleanElement.image) {
                    cleanElement.src = cleanElement.image.src || cleanElement.src;
                    // Remove the HTMLImageElement
                    delete cleanElement.image;
                  }
                }
                
                // Remove function properties
                const functionProps = [
                  'onDragStart', 'onDragEnd', 'onDragMove', 'onTransformEnd',
                  'onDblClick', 'onDblTap', 'onContextMenu', 'onClick', 'onTap',
                  'onMouseEnter', 'onMouseLeave'
                ];
                
                functionProps.forEach(prop => {
                  if (prop in cleanElement) {
                    delete cleanElement[prop];
                  }
                });
                
                return cleanElement;
              }) : []
            })),
            currentPageIndex: currentPageIndex,
            canvasSize: canvasSize,
            textProperties: textProperties,
            documentMetadata: {
              ...documentMetadata,
              currentPageIndex: currentPageIndex,
              totalElements: elements.length,
              totalPages: pages.length,
              fileName: documentMetadata?.fileName || 'Untitled',
              fileType: documentMetadata?.fileType || 'unknown',
              timestamp: documentMetadata?.timestamp || new Date().toISOString()
            }
          };
          
          console.log('📤 Preparing serializable preview data:', {
            pages: previewData.pages.length,
            totalElements: previewData.pages.reduce((sum, p) => sum + (p.elements?.length || 0), 0),
            dataSize: JSON.stringify(previewData).length,
            hasImageObjects: previewData.pages.some(p => 
              p.elements?.some(e => e.type === 'image' && e.image)
            )
          });
          
          // Log a sample element to verify it's serializable
          if (previewData.pages.length > 0 && previewData.pages[0].elements?.length > 0) {
            const sampleElement = previewData.pages[0].elements[0];
            console.log('📝 Sample element:', {
              type: sampleElement.type,
              hasImageObject: sampleElement.type === 'image' && !!sampleElement.image,
              hasSrc: sampleElement.type === 'image' && !!sampleElement.src,
              keys: Object.keys(sampleElement)
            });
          }
          
          // Use the hook to navigate to preview
          goToPreview(previewData);
        }}
        variant="outlined"
        sx={{ 
          ml: 1,
          color: '#2c3e50',
          borderColor: '#3498db',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#ebf5fb',
            borderColor: '#2980b9'
          }
        }}
      >
        Preview & Edit
      </Button>

           {/* Tool Mode Indicators */}
            {selectedTool === 'freehand' && (
              <Chip 
                label="Drawing Mode: Click & Drag" 
                color="primary"
                variant="outlined"
                icon={<FormatPaint />}
                sx={{ ml: 1, fontWeight: 600, borderWidth: 2 }}
              />
            )}
            
            {selectedTool === 'text' && (
              <Chip 
                label="Text Mode: Double-click to edit" 
                color="success"
                variant="outlined"
                icon={<TextFields />}
                sx={{ ml: 1, fontWeight: 600, borderWidth: 2 }}
              />
            )}
            
            {/* Editor Status Indicator */}
            <Chip
              label={isEditorLoading ? "Loading..." : editorError ? "Error" : editor ? "Ready" : "Not Ready"}
              color={isEditorLoading ? "default" : editorError ? "error" : editor ? "success" : "warning"}
              variant="outlined"
              size="small"
              icon={isEditorLoading ? <CircularProgress size={16} /> : undefined}
              sx={{ ml: 1, fontWeight: 600, borderWidth: 2 }}
            />
          </Box>

          {/* Konva Canvas */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              backgroundColor: '#f5f5f5',
              border: '2px solid #bdc3c7',
              borderRadius: 2,
              position: 'relative'
            }}
          >
            <Stage
              width={canvasSize.width * zoom}
              height={canvasSize.height * zoom}
              ref={stageRef}
              scaleX={zoom}
              scaleY={zoom}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onTouchStart={handleStageMouseDown}
              onTouchMove={handleStageMouseMove}
              onTouchEnd={handleStageMouseUp}
              onClick={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null);
                }
              }}
              onContextMenu={(e) => {
                e.evt.preventDefault();
                if (e.target === e.target.getStage()) {
                  const stage = e.target.getStage();
                  const pos = stage.getPointerPosition();
                  
                  setContextMenu({
                    x: pos.x,
                    y: pos.y,
                    elementId: null,
                    open: true
                  });
                }
              }}
            >
              <Layer>
                {renderKonvaElements()}
                
                {/* Drawing preview */}
                {isDrawing && selectedTool === 'freehand' && drawingPoints.length > 0 && (
                  <Line
                    points={drawingPoints}
                    stroke={textProperties.fill}
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.5}
                  />
                )}
                
                {/* Transformer for selected element */}
                {selectedId && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                )}
              </Layer>
            </Stage>
          </Paper>

          {/* Canvas Size Info */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
            Canvas: {canvasSize.width} × {canvasSize.height}px • {elements.length} elements • Selected: {selectedId ? 'Yes' : 'None'}
          </Typography>
        </Box>
      </DialogContent>

      {/* Footer with Export Menu */}
      <DialogActions sx={{ 
        p: 1,
        borderTop: '1px solid #E2E8F0',
        backgroundColor: 'white',
        minHeight: '60px'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="#718096" sx={{ fontWeight: 500 }}>
              Elements: {elements.length} • Template: {currentTemplate || 'Custom'} • Zoom: {Math.round(zoom * 100)}%
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

           <Button 
          onClick={() => {
            // Use the hook to go back to AdvancedOCR - ONLY this line
            goBackToAdvancedOCR();
          }}
          startIcon={<Close />}
          size="small"
          sx={{ 
            color: '#718096',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#F7FAFC' }
          }}
        >
          Cancel
        </Button>

     {/* Enhanced Save/Export Button with Dropdown */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <Button 
          onClick={() => {
            // Only open save dialog, don't toggle export menu
            setSaveDialogOpen(true);
            // Close export menu if it's open
            if (exportMenuAnchor) {
              setExportMenuAnchor(null);
            }
          }}
          variant="contained" 
          startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <Save />}
          size="small"
          disabled={isExporting}
          sx={{ 
            minWidth: 140,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              transform: 'translateY(-1px)'
            },
            '&.Mui-disabled': {
              background: 'linear-gradient(135deg, #A0AEC0 0%, #718096 100%)',
            }
          }}
        >
          {isExporting ? 'Saving...' : 'Save Design'}
        </Button>
        

      </Box>
          </Box>
        </Box>
      </DialogActions>

      {/* Context Menu */}
      {contextMenu.open && (
        <div
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            padding: '4px 0'
          }}
        >
          {contextMenu.elementId ? (
            <>
              <button
                onClick={() => {
                  if (contextMenu.elementId) {
                    const element = elements.find(el => el.id === contextMenu.elementId);
                    if (element?.type === 'text') {
                      createTextInputForEditing(element);
                    }
                  }
                  setContextMenu({ ...contextMenu, open: false });
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Edit Text
              </button>
              <button
                onClick={() => {
                  if (contextMenu.elementId) {
                    deleteSelectedElement();
                  }
                  setContextMenu({ ...contextMenu, open: false });
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#f44336'
                }}
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (selectedTool === 'text') {
                  const stage = stageRef.current;
                  const pos = stage.getPointerPosition();
                  const newX = pos.x / zoom;
                  const newY = pos.y / zoom;
                  
                  addElement('text', {
                    text: 'New Text',
                    x: newX,
                    y: newY,
                    fontSize: textProperties.fontSize,
                    fontFamily: textProperties.fontFamily,
                    fontWeight: textProperties.fontWeight,
                    fontStyle: textProperties.fontStyle,
                    fill: textProperties.fill,
                    textAlign: textProperties.textAlign,
                    draggable: true
                  });
                }
                setContextMenu({ ...contextMenu, open: false });
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Text Here
            </button>
          )}
        </div>
      )}

      {/* Export Format Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: '#2D3748',
            color: 'white',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            minWidth: 200,
          }
        }}
      >
        {[
          { format: 'json', label: 'Save as JSON', icon: <CloudDownloadIcon />, description: 'Save to app & download' },
          { format: 'pdf', label: 'Export as PDF', icon: <PictureAsPdf />, description: 'Download PDF file' },
          { format: 'png', label: 'Export as Image', icon: <ImageIcon />, description: 'Download PNG image' },
          { format: 'docx', label: 'Export as Word', icon: <Description />, description: 'Download Word document' },
          { format: 'txt', label: 'Export as Text', icon: <TextFields />, description: 'Download text file' },
          { format: 'html', label: 'Export as HTML', icon: <Code />, description: 'Download HTML file' },
        ].map((item) => (
          <MenuItem 
            key={item.format}
            onClick={() => {
              setSelectedFormat(item.format);
              setSaveDialogOpen(true);
            }}
            disabled={isExporting}
            sx={{ 
              '&:hover': { backgroundColor: '#4A5568' },
              '&.Mui-disabled': { opacity: 0.6 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{ color: 
                item.format === 'pdf' ? '#F56565' :
                item.format === 'png' ? '#4299E1' :
                item.format === 'html' ? '#ED8936' :
                item.format === 'docx' ? '#9F7AEA' :
                item.format === 'txt' ? '#68D391' : '#9F7AEA',
                display: 'flex', alignItems: 'center' 
              }}>
                {item.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {item.label}
                </Typography>
                <Typography variant="caption" color="#CBD5E0">
                  {item.description}
                </Typography>
              </Box>
              {isExporting && <CircularProgress size={16} />}
            </Box>
          </MenuItem>
        ))}
      </Menu>

     {/* Save Dialog */}
      <SaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={() => handleSaveWithFormat(selectedFormat)}
        isSaving={isExporting}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        contentHeight={calculateContentHeight(elements)}
        qualityWarningThreshold={QUALITY_WARNING_THRESHOLD}
        
        // Multi-page export props
        exportMode={exportMode}
        setExportMode={setExportMode}
        selectedPages={selectedPages}
        setSelectedPages={setSelectedPages}
        mergeRatio={mergeRatio}
        setMergeRatio={setMergeRatio}
        exportStartPage={exportStartPage}
        setExportStartPage={setExportStartPage}
        exportEndPage={exportEndPage}
        setExportEndPage={setExportEndPage}
        pages={pages}
        currentPageIndex={currentPageIndex}
        
        // ADD THESE TWO NEW PROPS:
        canvasSize={canvasSize}
        textProperties={textProperties}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
   
    </Dialog>
  );
};

export default PDFEditor; 