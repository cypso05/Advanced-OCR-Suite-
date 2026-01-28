// src/app/features/ocr/components/PDFEditor.jsx - UPDATED VERSION
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, IconButton, Tooltip, Chip, FormControl,
  InputLabel, Select, MenuItem, TextField, Slider,
  Switch, FormControlLabel, Divider, Alert, Snackbar,
  Menu, CircularProgress, InputAdornment, Drawer,  ButtonGroup, ToggleButtonGroup, ToggleButton
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
  ChevronRight, Layers, Settings, ViewSidebar,
  ViewCompact, FormatSize, AspectRatio, Circle as CircleIcon, Slideshow, Brush, Info,CropSquare, 
  ChangeHistory, 
  ArrowRightAlt, 
  Remove, 
  Star, 
  Favorite, 
  Cloud
} from '@mui/icons-material';
import { Image as ImageIcon } from '@mui/icons-material';

import {Transformer,} from 'react-konva';

// IMPORTANT: Import Konva shapes directly from konva
import Konva from 'konva';
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Rect";
import "konva/lib/shapes/Circle";
import "konva/lib/shapes/Text";
import "konva/lib/shapes/Image";
import "konva/lib/shapes/Arrow";
import "konva/lib/shapes/Label";

import "konva/lib/shapes/Rect";
import "konva/lib/shapes/Circle";
import "konva/lib/shapes/Text";
import "konva/lib/shapes/Image";
import { useDropzone } from 'react-dropzone';

import {
  handlePDFDocumentExport, 
} from '../utils/pdfExportUtils';

// Add these imports
import { useDocumentEditor } from '../utils/documentEditorHooks';

import SaveDialog from './SaveDialog'; // Adjust path if needed
import { useEditorNavigation } from './useEditorNavigation'; // ADD THIS

// Add this import with your other imports
import { useKonvaToolManager } from '../upgrade/hooks/useKonvaToolManager'; // Adjust path as needed

// =================== NEW COMPONENT IMPORTS ===================
import LayoutModeSwitcher from './LayoutModeSwitcher';
import LayerPanel from './LayerPanel';
import CanvasStage from './CanvasStage';
import ElementRenderer from './ElementRenderer';
import TextEditorOverlay from './TextEditorOverlay';
import PropertyPanel from './PropertyPanel';
import QuickAccessToolbar from './QuickAccessToolbar';
import { ELEMENT_TYPES , getElementsByCategory } from '../utils/elementTypes';
// In PDFEditor.jsx - Add import at top
import useElementConverter from '../utils/elementConverter';
// =============================================================

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
// Main Component - WITH NEW COMPONENTS INTEGRATED
// ----------------------------------------------------
const PDFEditor = ({ open, content, onSave, documentType, aiResults }) => {
  // =================== NEW STATE ADDITIONS ===================
const [layers, setLayers] = useState([
    { id: 'layer-1', name: 'Background', visible: true, locked: false, opacity: 1, blendMode: 'normal' },
    { id: 'layer-2', name: 'Elements', visible: true, locked: false, opacity: 1, blendMode: 'normal' }
  ]);

  // Add these to your state variables at the beginning of PDFEditor
const [selectedElementCategory, setSelectedElementCategory] = useState('text');
const [showAllElements, setShowAllElements] = useState(false);
  
  const [selectedLayerId, setSelectedLayerId] = useState('layer-2');
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); // Changed from selectedId to support multiple selection
  const [layoutMode, setLayoutMode] = useState('word');
  const [canvasColor, setCanvasColor] = useState('#ffffff');

  // Add to your state variables in PDFEditor.jsx:
const [customCanvasColor, setCustomCanvasColor] = useState(null);
  const [activeLayout, setActiveLayout] = useState('word');
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showGridGuides, setShowGridGuides] = useState(true);
  const [showQuickAccess, setShowQuickAccess] = useState(true);
  
  const [gridConfig, setGridConfig] = useState({
    enabled: true,
    size: 20,
    snap: true,
    color: 'rgba(0, 0, 0, 0.1)',
    type: 'lines'
  });
  
  const [guidesConfig, setGuidesConfig] = useState({
    enabled: true,
    vertical: [100, 300, 500],
    horizontal: [100, 400],
    color: '#00ff00'
  });
  
  const [rulersConfig, setRulersConfig] = useState({
    show: true,
    unit: 'px'
  });
  
  const [marginsConfig, setMarginsConfig] = useState({
    show: false,
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  });
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [textEditingElement, setTextEditingElement] = useState(null);
  const [toolProperties, setToolProperties] = useState({
  // Word mode defaults
  text: {
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Calibri',
    fontWeight: 'normal'
  },
  
  // PowerPoint mode defaults
  shape: {
    fill: '#ffffff',
    stroke: '#d24726',
    strokeWidth: 2
  },
  
  // Photoshop mode defaults
  brush: {
    color: '#000000',
    size: 5,
    opacity: 1,
    blendMode: 'normal'
  },
  
  // Excel mode defaults
  table: {
    cellColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    showGrid: true
  }
});
  const { goToPreview, goBackToAdvancedOCR } = useEditorNavigation();
  
  const [selectedTool, setSelectedTool] = useState("select");
  const [activeTab, setActiveTab] = useState(0);
  const [elements, setElements] = useState([]);
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

    // =================== NEW REFS ===================
  const canvasStageRef = useRef(null);
    // ✅ MUST CREATE canvasRef BEFORE useDocumentEditor
  const stageRef = useRef(null);
  const transformerRef = useRef();
  const hasOCRContentRef = useRef(false);
  const fileInputRef = useRef(null);
  // ===============================================

  // ✅ MOVE addToHistory function UP here, BEFORE toolManager
  const addToHistory = useCallback((newElements) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push([...newElements]);
      return newHistory;
    });
    setHistoryStep(step => step + 1);
  }, [historyStep]);
  
  // ✅ Helper Functions - MUST come BEFORE useEffect that uses them // ✅ FIX: Move showNotification function UP here, BEFORE handleGridToggle
  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

    // Layout-specific canvas colors
  const layoutCanvasColors = useMemo(() => ({
    word: '#ffffff',
    powerpoint: '#f8f9fa',
    photoshop: '#2d2d2d',
    excel: '#ffffff'
  }), []);

const handleLayoutModeChange = (mode) => {
  setActiveLayout(mode);
  setLayoutMode(mode);
  
  // Reset tool properties based on layout mode
  const newToolProperties = { ...toolProperties };
  
  // Handle tool selection for each mode
  switch (mode) {
    case 'word':
      setSelectedTool('text');
      break;
    case 'powerpoint':
      setSelectedTool('shape');
      break;
    case 'photoshop':
      setSelectedTool('brush');
      break;
    case 'excel':
      setSelectedTool('table');
      break;
  }
  
  // ✅ Grid visibility: Only Excel shows grid, all others hide it
  if (mode === 'excel') {
    // Excel: Grid ON by default
    setShowGridGuides(true);
    setGridConfig(prev => ({ ...prev, enabled: true }));
  } else {
    // All other modes: Grid OFF
    setShowGridGuides(false);
    setGridConfig(prev => ({ ...prev, enabled: false }));
  }
  
  // canvas color
  setCanvasColor(layoutCanvasColors[mode]);
  if (mode === 'photoshop' && customCanvasColor) {
    setCanvasColor(customCanvasColor);
  }
};

const handleGridToggle = useCallback((newValue) => {
  // Only allow toggling grid in Excel mode
  if (activeLayout === 'excel') {
    setShowGridGuides(newValue);
    setGridConfig(prev => ({ ...prev, enabled: newValue }));
    console.log(`Grid ${newValue ? 'ON' : 'OFF'} in Excel mode`);
  } else {
    // For all other modes, show a notification
    showNotification('Grid is only available in Excel mode', 'info'); // ✅ Now showNotification is defined
    console.log('Grid disabled for non-Excel modes');
  }
}, [activeLayout, showNotification]); // ✅ Add showNotification to dependencies

  
// Canvas color change handler for Photoshop mode
const handleCanvasColorChange = useCallback((color) => {
  setCustomCanvasColor(color);
  setCanvasColor(color); // ✅ Actually update the canvas color
  console.log(`🎨 Canvas color changed to: ${color}`);
  
  // Also update layoutCanvasColors for Photoshop mode
  const updatedColors = { ...layoutCanvasColors };
  updatedColors.photoshop = color;
  
  console.log(`Canvas color changed to: ${color}`);
}, [layoutCanvasColors]);

  // Initialize Konva Tool Manager // 4. Update the konvaToolManager initialization to use layout mode:
const konvaToolManager = useKonvaToolManager({
  initialTool: selectedTool,
  resetPropertiesOnToolChange: true,
  onToolChange: (toolId, properties) => {
    console.log(`Tool changed to: ${toolId}`, properties);
    
    // Update tool properties with layout-specific defaults
    const layoutDefaults = {
      word: { color: '#000000', fontSize: 12, fontFamily: 'Calibri' },
      powerpoint: { fill: '#ffffff', stroke: '#d24726', strokeWidth: 2 },
      photoshop: { color: '#000000', size: 5, opacity: 1 },
      excel: { cellColor: '#ffffff', borderColor: '#e2e8f0', showGrid: true }
    };
    
    const defaults = layoutDefaults[activeLayout] || {};
    setToolProperties(prev => ({
      ...prev,
      [toolId]: { ...defaults, ...properties }
    }));
  }
});

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
  const [textProperties, setTextProperties] = useState({
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    fill: '#000000',
    textAlign: 'left'
  });

  // =================== NEW EVENT HANDLERS ===================
  // Layer handlers
  const handleLayerCreate = useCallback(() => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal'
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    showNotification(`New layer created: ${newLayer.name}`, 'success');
  }, [layers, showNotification]);

  const handleLayerDelete = useCallback((layerId) => {
    if (layerId === 'layer-1') {
      showNotification('Cannot delete background layer', 'warning');
      return;
    }
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    setSelectedLayerId('layer-1');
    showNotification('Layer deleted', 'info');
  }, [showNotification]);

  const handleLayerUpdate = useCallback((layerId, updates) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  const handleLayerSelect = useCallback((layerId) => {
    setSelectedLayerId(layerId);
  }, []);

  // Element handlers
// When selecting elements, you might want to highlight the layer they belong to
// Handle element lock/unlock
const handleElementLock = useCallback((elementId) => {
  setElements(prev => prev.map(el => 
    el.id === elementId ? { ...el, locked: !el.locked } : el
  ));
}, []);

// Handle element deletion (you might already have this)
const handleElementDelete = useCallback((elementId) => {
  setElements(prev => prev.filter(el => el.id !== elementId));
  // Also remove from selected IDs
  setSelectedIds(prev => prev.filter(id => id !== elementId));
  showNotification('Element deleted', 'info');
}, [showNotification]);

// Handle element duplication
const handleElementDuplicate = useCallback((elementId) => {
  const element = elements.find(el => el.id === elementId);
  if (element) {
    const duplicate = {
      ...element,
      id: `${element.id}-copy-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
      name: `${element.name || 'Element'} (Copy)`,
      zIndex: (element.zIndex || 0) + 1
    };
    setElements(prev => [...prev, duplicate]);
    setSelectedIds([duplicate.id]);
    showNotification('Element duplicated', 'success');
  }
}, [elements, showNotification]);

// Handle z-index changes (bring forward/send backward)
const handleElementZIndexChange = useCallback((elementId, change) => {
  setElements(prev => {
    const currentElement = prev.find(el => el.id === elementId);
    if (!currentElement) return prev;
    
    const currentZ = currentElement.zIndex || 0;
    const newZ = currentZ + change;
    
    // Ensure z-index doesn't go below 0
    const safeZ = Math.max(0, newZ);
    
    return prev.map(el => 
      el.id === elementId ? { ...el, zIndex: safeZ } : el
    );
  });
}, []);

// Handle element layer change
const handleElementLayerChange = useCallback((elementId, newLayerId) => {
  setElements(prev => prev.map(el => 
    el.id === elementId ? { ...el, layerId: newLayerId } : el
  ));
  showNotification(`Element moved to ${layers.find(l => l.id === newLayerId)?.name || 'new layer'}`, 'success');
}, [layers, showNotification]);

// Handle element opacity change
const handleElementOpacityChange = useCallback((elementId, opacity) => {
  setElements(prev => prev.map(el => 
    el.id === elementId ? { ...el, opacity } : el
  ));
}, []);

// Generic element update handler
const handleElementUpdate = useCallback((elementId, updates) => {
  // Handle different types of updates
  if (updates.locked !== undefined) {
    handleElementLock(elementId);
  } else if (updates.zIndex !== undefined) {
    handleElementZIndexChange(elementId, updates.zIndex);
  } else if (updates.layerId !== undefined) {
    handleElementLayerChange(elementId, updates.layerId);
  } else if (updates.opacity !== undefined) {
    handleElementOpacityChange(elementId, updates.opacity);
  } else {
    // Generic update
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  }
}, [handleElementLock, handleElementZIndexChange, handleElementLayerChange, handleElementOpacityChange]);


// =================== VISIBLE ELEMENTS FILTERING ===================

// Filter elements to show only those in selected layer
const visibleElements = useMemo(() => {
  // If no layer is selected, show all elements
  if (!selectedLayerId) return elements;
  
  // Get the current layer
  const currentLayer = layers.find(l => l.id === selectedLayerId);
  
  // If layer doesn't exist or is hidden, return empty array
  if (!currentLayer || currentLayer.visible === false) {
    return [];
  }
  
  // Filter elements by layerId AND visibility
  return elements.filter(element => 
    element.layerId === selectedLayerId && 
    element.visible !== false
  );
}, [elements, selectedLayerId, layers]);

// Also create a version with all elements for LayerPanel
const allElements = useMemo(() => {
  return elements.filter(element => element.visible !== false);
}, [elements]);

const handleElementSelect = useCallback((id, additive = false) => {
  const element = elements.find(el => el.id === id);
  if (element) {
    // Auto-select the layer this element belongs to
    handleLayerSelect(element.layerId);
  }
  
  if (additive) {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(elId => elId !== id)
        : [...prev, id]
    );
  } else {
    setSelectedIds([id]);
  }
}, [elements, handleLayerSelect]);

  const handleElementHover = useCallback((elementId, isHovered) => {
    setHoveredElementId(isHovered ? elementId : null);
  }, []);

const handleElementDrag = useCallback((id, position) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...position } : el
    ));
  }, []);

  const handleElementResize = useCallback((elementId, newProperties) => {
    setElements(prev => prev.map(el =>
      el.id === elementId ? { ...el, ...newProperties } : el
    ));
  }, []);


  // Text editing handlers
  const handleTextEditStart = useCallback((element) => {
    if (element.type === 'text' || element.type === 'textbox') {
      setTextEditingElement({
        id: element.id,
        text: element.text || '',
        position: { x: element.x, y: element.y },
        style: {
          fontFamily: element.fontFamily || 'Arial, sans-serif',
          fontSize: element.fontSize || 16,
          bold: element.fontWeight === 'bold',
          italic: element.fontStyle === 'italic',
          underline: element.underline || false,
          fill: element.fill || '#000000',
          align: element.align || 'left',
          lineHeight: element.lineHeight || 1.2,
          letterSpacing: element.letterSpacing || 0
        }
      });
    }
  }, []);

  const handleTextEditSave = useCallback((newText, newStyle) => {
    if (textEditingElement) {
      setElements(prev => prev.map(el => 
        el.id === textEditingElement.id 
          ? { 
              ...el, 
              text: newText,
              fontFamily: newStyle.fontFamily,
              fontSize: newStyle.fontSize,
              fontWeight: newStyle.bold ? 'bold' : 'normal',
              fontStyle: newStyle.italic ? 'italic' : 'normal',
              underline: newStyle.underline,
              fill: newStyle.fill,
              align: newStyle.align,
              lineHeight: newStyle.lineHeight,
              letterSpacing: newStyle.letterSpacing
            } 
          : el
      ));
      setTextEditingElement(null);
    }
  }, [textEditingElement]);

  const handleTextEditCancel = useCallback(() => {
    setTextEditingElement(null);
  }, []);

  // Tool property handlers
  const handleToolPropertyChange = useCallback((property, value) => {
    setToolProperties(prev => ({ ...prev, [property]: value }));
    konvaToolManager.updateToolProperty(property, value);
  }, [konvaToolManager]);

  // Quick Access Toolbar handlers
  const handleAlign = useCallback((alignment) => {
    if (selectedIds.length < 2) return;
    
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    if (selectedElements.length < 2) return;
    
    let referenceValue;
    
    switch (alignment) {
      case 'left':
        referenceValue = Math.min(...selectedElements.map(el => el.x));
        setElements(prev => prev.map(el => 
          selectedIds.includes(el.id) ? { ...el, x: referenceValue } : el
        ));
        break;
        
      case 'center':
        referenceValue = selectedElements[0].x + selectedElements[0].width / 2;
        setElements(prev => prev.map(el => 
          selectedIds.includes(el.id) ? { 
            ...el, 
            x: referenceValue - (el.width || 0) / 2 
          } : el
        ));
        break;
        
      case 'right':
        referenceValue = Math.max(...selectedElements.map(el => el.x + (el.width || 0)));
        setElements(prev => prev.map(el => 
          selectedIds.includes(el.id) ? { 
            ...el, 
            x: referenceValue - (el.width || 0) 
          } : el
        ));
        break;
        
      case 'top':
        referenceValue = Math.min(...selectedElements.map(el => el.y));
        setElements(prev => prev.map(el => 
          selectedIds.includes(el.id) ? { ...el, y: referenceValue } : el
        ));
        break;
        
      case 'middle':
        referenceValue = selectedElements[0].y + selectedElements[0].height / 2;
        setElements(prev => prev.map(el => 
          selectedIds.includes(el.id) ? { 
            ...el, 
            y: referenceValue - (el.height || 0) / 2 
          } : el
        ));
        break;
        
      case 'bottom':
        referenceValue = Math.max(...selectedElements.map(el => el.y + (el.height || 0)));
        setElements(prev => prev.map(el => 
          selectedIds.includes(el.id) ? { 
            ...el, 
            y: referenceValue - (el.height || 0) 
          } : el
        ));
        break;
    }
    
    showNotification(`Aligned ${selectedIds.length} elements ${alignment}`, 'success');
  }, [selectedIds, elements, showNotification]);

    // Quick Access Toolbar handlers
  const handleDelete = useCallback(() => {
    setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
    setSelectedIds([]);
  }, [selectedIds]);

  const handleDuplicate = useCallback(() => {
    const duplicated = elements
      .filter(el => selectedIds.includes(el.id))
      .map(el => ({
        ...el,
        id: `${el.id}-copy-${Date.now()}`,
        x: el.x + 20,
        y: el.y + 20
      }));
    setElements(prev => [...prev, ...duplicated]);
    setSelectedIds(duplicated.map(el => el.id));
  }, [elements, selectedIds]);

  const handleLock = useCallback(() => {
    setElements(prev => prev.map(el => 
      selectedIds.includes(el.id) 
        ? { ...el, draggable: el.draggable === false ? true : false }
        : el
    ));
  }, [selectedIds]);


  const handleGroup = useCallback(() => {
    if (selectedIds.length < 2) return;
    
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const groupId = `group-${Date.now()}`;
    
    // Calculate group bounds
    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxX = Math.max(...selectedElements.map(el => el.x + (el.width || 0)));
    const maxY = Math.max(...selectedElements.map(el => el.y + (el.height || 0)));
    
    const groupElement = {
      id: groupId,
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      children: selectedIds,
      draggable: true
    };
    
    // Update children to reference group
    const updatedElements = elements.map(el => {
      if (selectedIds.includes(el.id)) {
        return { ...el, groupId };
      }
      return el;
    });
    
    // Add group to elements
    updatedElements.push(groupElement);
    
    setElements(updatedElements);
    setSelectedIds([groupId]);
    showNotification(`Grouped ${selectedIds.length} elements`, 'success');
  }, [selectedIds, elements, showNotification]);

  const handleUngroup = useCallback((groupId) => {
    const groupElement = elements.find(el => el.id === groupId);
    if (!groupElement || groupElement.type !== 'group') return;
    
    // Remove group reference from children
    const updatedElements = elements.map(el => {
      if (el.groupId === groupId) {
        const { groupId: _, ...rest } = el;
        return rest;
      }
      return el;
    }).filter(el => el.id !== groupId); // Remove the group itself
    
    setElements(updatedElements);
    setSelectedIds([]);
    showNotification('Ungrouped elements', 'success');
  }, [elements, showNotification]);

  const handleHide = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    setElements(prev => prev.map(el => 
      selectedIds.includes(el.id) ? { ...el, visible: !el.visible } : el
    ));
    
    const isVisible = elements.find(el => 
      selectedIds.includes(el.id) && el.visible !== false
    );
    
    showNotification(
      `${selectedIds.length} element(s) ${isVisible ? 'hidden' : 'shown'}`,
      'success'
    );
  }, [selectedIds, elements, showNotification]);

  const handleBringForward = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const sortedElements = [...elements];
    selectedIds.forEach(id => {
      const index = sortedElements.findIndex(el => el.id === id);
      if (index < sortedElements.length - 1) {
        const [element] = sortedElements.splice(index, 1);
        sortedElements.splice(index + 1, 0, element);
      }
    });
    
    setElements(sortedElements);
    showNotification('Element brought forward', 'success');
  }, [selectedIds, elements, showNotification]);

  const handleSendBackward = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const sortedElements = [...elements];
    selectedIds.forEach(id => {
      const index = sortedElements.findIndex(el => el.id === id);
      if (index > 0) {
        const [element] = sortedElements.splice(index, 1);
        sortedElements.splice(index - 1, 0, element);
      }
    });
    
    setElements(sortedElements);
    showNotification('Element sent backward', 'success');
  }, [selectedIds, elements, showNotification]);

  // Layout mode configuration (for tooltips/help)
const layoutConfig = useMemo(() => ({
  word: {
    features: ['Text Editing', 'Page Layout', 'Styles', 'Paragraph Formatting'],
    helpText: 'Word Mode: Focus on document editing'
  },
  powerpoint: {
    features: ['Slide Design', 'Animations', 'Transitions', 'Master Slides'],
    helpText: 'PowerPoint Mode: Focus on presentations'
  },
  photoshop: {
    features: ['Layers', 'Filters', 'Brushes', 'Selection Tools'],
    helpText: 'Photoshop Mode: Focus on design and layers'
  },
  excel: {
    features: ['Tables', 'Charts', 'Formulas', 'Grid View'],
    helpText: 'Excel Mode: Focus on grids and data'
  }
}), []);

  
  // ===========================================================
// Add this utility function near your other helper functions
const getLayoutSpecificElementDefaults = useCallback((type) => {
  const defaults = {
    word: {
      [ELEMENT_TYPES.TEXT]: { fontSize: 12, fontFamily: 'Calibri' },
      [ELEMENT_TYPES.PARAGRAPH]: { fontSize: 11, width: 400 },
      [ELEMENT_TYPES.HEADING]: { fontSize: 16, fontWeight: 'bold' },
      [ELEMENT_TYPES.TABLE]: { rows: 4, columns: 3, showGrid: false },
    },
    powerpoint: {
      [ELEMENT_TYPES.SHAPE]: { fill: '#d24726', strokeWidth: 0 },
      [ELEMENT_TYPES.TEXT]: { fontSize: 18, fontFamily: 'Arial' },
      [ELEMENT_TYPES.RECTANGLE]: { fill: '#d24726', cornerRadius: 4 },
      [ELEMENT_TYPES.CIRCLE]: { fill: '#2a9d8f' },
    },
    excel: {
      [ELEMENT_TYPES.TABLE]: { rows: 10, columns: 5, showGrid: true },
      [ELEMENT_TYPES.SPREADSHEET]: { rows: 20, columns: 10 },
      [ELEMENT_TYPES.CELL_RANGE]: { rows: 5, columns: 3 },
      [ELEMENT_TYPES.CHART]: { chartType: 'bar' },
    },
    photoshop: {
      [ELEMENT_TYPES.SHAPE]: { fill: '#3498db', stroke: '#2980b9' },
      [ELEMENT_TYPES.LAYER]: { opacity: 1, blendMode: 'normal' },
      [ELEMENT_TYPES.BRUSH]: { color: '#000000', size: 5 },
      [ELEMENT_TYPES.FILTER]: { type: 'blur', value: 5 },
    }
  };
  
  return defaults[activeLayout]?.[type] || {};
}, [activeLayout]);


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
      setSelectedIds([]);
    }
  }, [history, historyStep]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      setElements(history[historyStep + 1]);
      setHistoryStep(historyStep + 1);
      setSelectedIds([]);
    }
  }, [history, historyStep]);


  const handleTextEdit = useCallback((elementId, newText) => {
    setElements(prev =>
      prev.map(el =>
        el.id === elementId ? { ...el, text: newText } : el
      )
    );
  }, []);

  const deleteSelectedElement = useCallback(() => {
    if (selectedIds.length > 0) {
      setElements(prev => {
        const updated = prev.filter(el => !selectedIds.includes(el.id));
        addToHistory(updated);
        return updated;
      });
      setSelectedIds([]);
      showNotification(`${selectedIds.length} element(s) deleted`, 'success');
    }
  }, [selectedIds, addToHistory, showNotification]);

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

  


// In PDFEditor component - Replace the existing convertToKonvaElement and addElement functions
// In your PDFEditor component
const {
  convertToKonvaElement,
  addElement
} = useElementConverter({
  canvasSize,
  textProperties,
  setElements,
  createTextInputForEditing,
  selectedLayerId,
  activeLayout,
  konvaToolManager
});

// Removed all the old convertToKonvaElement, createEnhancedShapeElement, and addElement functions
// They're now handled by the useElementConverter hook

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
          src: imageUrl,
          layerId: selectedLayerId,
          visible: true
        };
        
        setElements(prev => {
          const updated = [...prev, imageElement];
          addToHistory(updated);
          return updated;
        });
        
        setSelectedIds([imageElement.id]);
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
          draggable: true,
          layerId: selectedLayerId,
          visible: true
        };
        
        setElements(prev => {
          const updated = [...prev, textElement];
          addToHistory(updated);
          return updated;
        });
        
        setSelectedIds([textElement.id]);
        showNotification('Text file uploaded (basic mode)', 'info');
        
      } catch (error) {
        console.error('Simple text upload failed:', error);
        showNotification('Failed to read text file', 'error');
      }
      
    } else {
      showNotification(`Cannot process ${file.type} in basic mode. Please use PDF/Image files.`, 'error');
    }
  }, [canvasSize, showNotification, setElements, fitImageToCanvas, addToHistory, selectedLayerId]);

  // ✅ FIXED: loadPageElements with proper scaling
  const loadPageElements = useCallback(async (pageData, pageIndex) => {
    // ... keep existing loadPageElements implementation ...
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
      setSelectedIds(firstImage ? [firstImage.id] : [konvaElements[0].id]);
    } else {
      setSelectedIds([]);
    }
    
    console.log(`\n🎯 Page ${pageIndex + 1} loaded with ${addedElementsCount} elements (scaled by ${scale.toFixed(3)}x)`);
    console.log(`📐 Canvas set to A4: ${STANDARD_A4_WIDTH}x${STANDARD_A4_HEIGHT}`);
    
    return addedElementsCount;
  }, [convertToKonvaElement, addToHistory, setElements, setCanvasSize]);

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
    // ... keep existing handleFileUpload implementation ...
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
              draggable: true,
              layerId: selectedLayerId,
              visible: true
            };
            
            setElements(prev => {
              const updated = [...prev, placeholderElement];
              addToHistory(updated);
              return updated;
            });
            
            setSelectedIds([placeholderElement.id]);
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
            draggable: true,
            layerId: selectedLayerId,
            visible: true
          };
          
          setElements(prev => {
            const updated = [...prev, textElement];
            addToHistory(updated);
            return updated;
          });
          
          setSelectedIds([textElement.id]);
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
    editor,
    editorError,
    isEditorLoading,
    handleSimpleFileUpload,
    loadPageElements,
    setPages,
    setDocumentMetadata,
    setCurrentPageIndex,
    setCanvasSize,
    selectedLayerId
  ]);


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
      
      // Reset selection
      setSelectedIds([]);
      
      hasOCRContentRef.current = false;
      showNotification('Canvas cleared - All pages removed', 'success');
    }, 100);
  }, [addToHistory, showNotification, setElements, setPages, setCurrentPageIndex, setDocumentMetadata, resetCanvasToDefault]);

  const resetEditor = useCallback(() => {
    showNotification('Resetting editor...', 'info');
    
    setTimeout(() => {
      setElements([]);
      setSelectedIds([]);
      setHistory([]);
      setHistoryStep(-1);
      setCurrentTemplate(null);
      
      // Reset layers
      setLayers([
        { id: 'layer-1', name: 'Background', visible: true, locked: false, opacity: 1, blendMode: 'normal' },
        { id: 'layer-2', name: 'Content', visible: true, locked: false, opacity: 1, blendMode: 'normal' },
        { id: 'layer-3', name: 'Annotations', visible: true, locked: false, opacity: 1, blendMode: 'normal' }
      ]);
      setSelectedLayerId('layer-2');
      
      // ✅ FIX: Reset canvas to default size
      resetCanvasToDefault();
      
      setZoom(1);
      setIsDrawing(false);
      setDrawingPoints([]);
      setPan({ x: 0, y: 0 });
      
      // Clear pages
      setPages([]);
      setCurrentPageIndex(0);
      setDocumentMetadata(null);
      
      hasOCRContentRef.current = false;
      showNotification('Editor reset successfully!', 'success');
    }, 100);
  }, [showNotification, setElements, setHistory, setHistoryStep, setCurrentTemplate, resetCanvasToDefault, setZoom, setIsDrawing, setDrawingPoints, setPages, setCurrentPageIndex, setDocumentMetadata]);

  const applyTemplate = useCallback((templateKey) => {
    const template = TEMPLATES[templateKey];
    if (template) {
      const newElements = template.elements.map(el => ({
        ...el,
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        layerId: selectedLayerId,
        visible: true
      }));
      
      setElements(newElements);
      if (template.canvasSize) {
        setCanvasSize(template.canvasSize);
      }
      setCurrentTemplate(templateKey);
      addToHistory(newElements);
      setSelectedIds(newElements.map(el => el.id));
      showNotification(`"${template.name}" template applied!`);
    }
  }, [addToHistory, showNotification, setElements, setCanvasSize, setCurrentTemplate, selectedLayerId]);

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

  // ------------------ Keyboard Shortcuts ----------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.matches('textarea, input')) {
        if (selectedIds.length > 0) {
          deleteSelectedElement();
          e.preventDefault();
        }
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        const input = document.getElementById('konva-text-input');
        if (input) {
          input.blur();
        }
        setTextEditingElement(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(elements.map(el => el.id));
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        handleGroup();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        if (selectedIds.length === 1) {
          handleUngroup(selectedIds[0]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteSelectedElement, undo, redo, handleDuplicate, handleGroup, handleUngroup, elements]);

  // Update selected text element when properties change
  useEffect(() => {
    if (selectedIds.length === 0) return;

    setElements(prev => {
      return prev.map(el => {
        if (!selectedIds.includes(el.id) || el.type !== 'text') return el;

        const needsUpdate = Object.keys(textProperties).some(
          key => el[key] !== textProperties[key]
        );

        if (!needsUpdate) return el;

        return { ...el, ...textProperties };
      });
    });
  }, [textProperties, selectedIds]);

  // ------------------ Transformer Update ----------------
  useEffect(() => {
    if (selectedIds.length === 1 && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedIds[0]}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds]);

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
  }, [editor, isEditorLoading, editorError, canvasRef,processDocument, open, canvasSize, isProcessingFile, showNotification]);

  // Get selected elements for PropertyPanel
  const selectedElements = useMemo(() => 
    elements.filter(el => selectedIds.includes(el.id)),
    [elements, selectedIds]
  );

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

// Add this function inside your PDFEditor component, before the return statement
const renderLayoutSpecificElements = () => {
  // Get all elements categorized
  const categorizedElements = getElementsByCategory();
  
  // Define which categories to show for each layout mode
  const layoutCategories = {
    word: ['text', 'document', 'shape', 'special'],
    powerpoint: ['presentation', 'shape', 'special', 'text'],
    photoshop: ['drawing', 'layer', 'photoshop', 'shape', 'special'],
    excel: ['data', 'excel', 'shape', 'text']
  };
  
  // Get relevant categories for current layout
  const relevantCategories = layoutCategories[activeLayout] || ['text', 'shape', 'data'];
  
  // Filter and sort categories
  const filteredCategories = relevantCategories
    .filter(cat => categorizedElements[cat])
    .map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      key: cat,
      elements: categorizedElements[cat]
    }));
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ 
        fontWeight: 600, 
        color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569', 
        mb: 1.5,
        fontSize: '0.8125rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {activeLayout === 'word' ? 'Document Elements' :
         activeLayout === 'powerpoint' ? 'Presentation Elements' :
         activeLayout === 'photoshop' ? 'Design Elements' : 'Data & Table Elements'}
      </Typography>
      
      {/* Tabs for each category */}
      <Tabs 
        value={selectedElementCategory || filteredCategories[0]?.key}
        onChange={(e, newValue) => setSelectedElementCategory(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            minHeight: 36,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b',
            '&.Mui-selected': {
              color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
            }
          }
        }}
      >
        {filteredCategories.map(category => (
          <Tab 
            key={category.key} 
            label={`${category.name} (${category.elements.length})`} 
            value={category.key}
          />
        ))}
      </Tabs>
      
      {/* Elements Grid */}
      {filteredCategories.map(category => (
      selectedElementCategory === category.key && (
        <Grid container spacing={1} key={category.key} sx={{ mb: 2 }}>
          {/* Add this line: */}
          {category.elements.slice(0, showAllElements ? category.elements.length : 12).map(element => (
            <Grid item xs={3} key={element.type}>
                <Tooltip 
                  title={element.name} 
                  arrow
                  placement="top"
                >
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      textAlign: 'center',
                      p: 1.5,
                      border: '1px solid',
                      borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
                      backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#ffffff',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: activeLayout === 'photoshop' ? 
                          '0 6px 16px rgba(139, 92, 246, 0.3)' : 
                          '0 6px 16px rgba(59, 130, 246, 0.2)',
                        borderColor: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
                      }
                    }}
                    onClick={() => addElement(element.type)}
                  >
                    <Box sx={{ 
                      color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6', 
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      fontSize: '24px',
                      height: 28
                    }}>
                      {element.icon}
                    </Box>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600,
                      color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b',
                      lineHeight: 1.2,
                      fontSize: '0.7rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {element.name}
                    </Typography>
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        )
      ))}
      
      {/* Show All Elements Button */}
      {filteredCategories.some(cat => cat.elements.length > 12) && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button
            size="small"
            onClick={() => setShowAllElements(!showAllElements)}
            sx={{
              fontSize: '0.7rem',
              textTransform: 'none',
              color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
            }}
          >
            {showAllElements ? 'Show Less' : `Show All ${filteredCategories.reduce((sum, cat) => sum + cat.elements.length, 0)} Elements`}
          </Button>
        </Box>
      )}
    </Box>
  );
};


// ------------------ Render ------------------
return (
  <Box sx={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: activeLayout === 'photoshop' ? '#1a1a1a' : '#f5f5f5',
    zIndex: 1300,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }}>
    {/* Loading Overlay for File Processing */}
    {isProcessingFile && (
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)'
      }}>
        <Box sx={{ 
          textAlign: 'center',
          color: 'white',
          padding: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <CircularProgress 
            size={64} 
            thickness={4}
            sx={{ 
              color: '#3b82f6',
              marginBottom: 3
            }} 
          />
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            marginBottom: 1,
            color: '#f8fafc'
          }}>
            Processing Document
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#cbd5e1',
            maxWidth: 300
          }}>
            Please wait while we extract elements from your file...
          </Typography>
        </Box>
      </Box>
    )}

    {/* Header - Professional Design */}
    <Box sx={{ 
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      color: 'white',
      borderBottom: '1px solid #475569',
      padding: '10px 24px',
      minHeight: '64px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left: Logo and Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <PictureAsPdf sx={{ 
            fontSize: 24, 
            color: '#f8fafc' 
          }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            color: '#f8fafc',
            letterSpacing: '-0.025em'
          }}>
            Pro PDF Designer
          </Typography>
          <Typography variant="caption" sx={{ 
            color: '#cbd5e1',
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 500
          }}>
            Professional Document Design Studio
          </Typography>
        </Box>
      </Box>
      
      {/* Center: Layout Mode Switcher - UPDATED */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <Typography variant="caption" sx={{ 
          fontWeight: 600,
          color: '#cbd5e1',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          padding: '0 8px'
        }}>
          Mode:
        </Typography>
        <ButtonGroup size="small" sx={{ mr: 2 }}>
        <ToggleButtonGroup
          value={activeLayout}
          exclusive
          onChange={(e, newMode) => newMode && handleLayoutModeChange(newMode)}
          aria-label="layout mode"
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#cbd5e1',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff'
              }
            }
          }}
        >
          <Tooltip title={layoutConfig.word?.helpText || "Word Mode: Document editing and formatting"} arrow>
            <ToggleButton value="word" aria-label="word mode">
              <Description sx={{ fontSize: 16, mr: 1 }} /> Word
            </ToggleButton>
          </Tooltip>
          
          <Tooltip title={layoutConfig.powerpoint?.helpText || "PowerPoint Mode: Presentation design"} arrow>
            <ToggleButton value="powerpoint" aria-label="powerpoint mode">
              <Slideshow sx={{ fontSize: 16, mr: 1 }} /> PowerPoint
            </ToggleButton>
          </Tooltip>
          
          <Tooltip title={layoutConfig.photoshop?.helpText || "Photoshop Mode: Design and layers"} arrow>
            <ToggleButton value="photoshop" aria-label="photoshop mode">
              <Brush sx={{ fontSize: 16, mr: 1 }} /> Photoshop
            </ToggleButton>
          </Tooltip>
          
          <Tooltip title={layoutConfig.excel?.helpText || "Excel Mode: Grid and data visualization"} arrow>
            <ToggleButton value="excel" aria-label="excel mode">
              <GridOn sx={{ fontSize: 16, mr: 1 }} /> Excel
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
        </ButtonGroup>
      </Box>
      
      {/* Right: Header Actions */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
       {/* Global Grid Toggle - UPDATED (only works in Excel mode) */}
      <Button
          variant={activeLayout === 'excel' && showGridGuides ? "contained" : "outlined"}
          size="small"
          startIcon={<GridOn />}
          onClick={() => handleGridToggle(!showGridGuides)}
          disabled={activeLayout !== 'excel'}
          sx={{
            backgroundColor: activeLayout === 'excel' && showGridGuides ? 'primary.main' : 'transparent',
            color: activeLayout === 'excel' ? 'white' : '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              backgroundColor: activeLayout === 'excel' ? (showGridGuides ? 'primary.dark' : 'rgba(255, 255, 255, 0.1)') : 'transparent'
            },
            '&.Mui-disabled': {
              color: '#6b7280',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {activeLayout === 'excel' 
            ? (showGridGuides ? 'Hide Grid' : 'Show Grid') 
            : `Grid (${activeLayout === 'excel' ? '' : 'Excel only'})`
          }
        </Button>

        {/* Canvas Color Picker (Photoshop mode only) - ADDED */} {/* Header color picker */}
        {activeLayout === 'photoshop' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette sx={{ fontSize: 16, color: '#cbd5e1' }} />
            <input
              type="color"
              value={customCanvasColor || '#2d2d2d'}
              onChange={(e) => handleCanvasColorChange(e.target.value)} // ✅
              style={{ /* styles */ }}
              title="Change Canvas Color"
            />
          </Box>
        )}

        {/* Settings tab color picker */}
        {activeLayout === 'photoshop' && (
          <Box sx={{ 
            mb: 3.5, 
            pt: 2.5, 
            borderTop: '1px solid #4b5563' 
          }}>
            {/* ... */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {['#2d2d2d', '#1a1a1a', '#ffffff', '#f8f9fa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                <Tooltip title={color} key={color}>
                  <Box
                    sx={{ /* styles */ }}
                    onClick={() => handleCanvasColorChange(color)} // ✅
                  />
                </Tooltip>
              ))}
            </Box>
            
            <TextField
              fullWidth
              size="small"
              label="Custom Color"
              value={customCanvasColor || ''}
              onChange={(e) => handleCanvasColorChange(e.target.value)} // ✅
              placeholder="#RRGGBB or CSS color name"
              sx={{ /* styles */ }}
            />
          </Box>
        )}

        {/* Canvas Controls - ADDED */}
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => canvasStageRef.current?.zoomToFit()}
          sx={{ 
            color: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        >
          Fit to Screen
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => canvasStageRef.current?.resetViewport()}
          sx={{ 
            color: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        >
          Reset View
        </Button>

        {/* Status Indicator */}
        <Chip
          label={isEditorFullyReady ? "Ready" : "Initializing..."}
          color={isEditorFullyReady ? "success" : "warning"}
          size="small"
          sx={{ 
            fontWeight: 600,
            backgroundColor: isEditorFullyReady ? '#10b981' : '#f59e0b',
            color: 'white',
            fontSize: '0.75rem',
            height: 28,
            '& .MuiChip-label': {
              padding: '0 10px'
            }
          }}
        />
        {/* Mode-specific grid indicator */}
        <Chip
          label={activeLayout === 'excel' ? 
            `Grid: ${showGridGuides ? 'ON' : 'OFF'}` : 
            'Grid: Disabled'}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: activeLayout === 'excel' ? 
              (showGridGuides ? '#10b981' : '#ef4444') : 
              '#6b7280',
            color: 'white',
            fontSize: '0.7rem',
            height: 24
          }}
        />
                
        <Tooltip title="Save Design" arrow>
          <IconButton 
            onClick={() => setSaveDialogOpen(true)}
            sx={{ 
              color: '#f8fafc',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s',
              width: 40,
              height: 40
            }}
          >
            <Save sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Reset Editor" arrow>
          <IconButton 
            onClick={resetEditor}
            sx={{ 
              color: '#f8fafc',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s',
              width: 40,
              height: 40
            }}
          >
            <RestartAlt sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        
        <Button
          onClick={() => goBackToAdvancedOCR()}
          startIcon={<Close sx={{ fontSize: 18 }} />}
          size="small"
          sx={{ 
            color: '#f8fafc',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            fontWeight: 600,
            fontSize: '0.8125rem',
            padding: '6px 16px',
            '&:hover': { 
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          Exit Editor
        </Button>
      </Box>
    </Box>

    {/* Main Workspace */}
    <Box sx={{
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      backgroundColor: '#f1f5f9'
    }}>
      {/* Left Sidebar - Professional Design */}
      <Paper 
        elevation={0}
        sx={{ 
          width: 280,
          borderRight: '1px solid #e2e8f0',
          backgroundColor: activeLayout === 'photoshop' ? '#2d2d2d' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 0,
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
        }}
      >
        <Tabs 
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            minHeight: '52px',
            backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: '52px',
              fontSize: '0.8125rem',
              color: activeLayout === 'photoshop' ? '#cbd5e1' : '#64748b',
              '&.Mui-selected': {
                color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Templates" icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Elements" icon={<Add sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Layers" icon={<Layers sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Settings" icon={<Settings sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>

        <Box sx={{ 
          p: 2.5, 
          flex: 1, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: activeLayout === 'photoshop' ? '#374151' : '#f1f5f9',
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: activeLayout === 'photoshop' ? '#4b5563' : '#cbd5e1',
            borderRadius: '3px',
            '&:hover': {
              background: activeLayout === 'photoshop' ? '#6b7280' : '#94a3b8'
            }
          }
        }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
                fontWeight: 700, 
                mb: 2.5,
                fontSize: '0.9375rem',
                letterSpacing: '-0.01em'
              }}>
                Choose Template
              </Typography>
              <Grid container spacing={1.5}>
                {Object.entries(TEMPLATES).map(([key, template]) => (
                  <Grid size={12} key={key}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: currentTemplate === key ? '2px solid' : '1px solid',
                        borderColor: currentTemplate === key ? 
                          (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                          (activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'),
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: currentTemplate === key ? 
                          (activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff') : 
                          (activeLayout === 'photoshop' ? '#374151' : '#ffffff'),
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                          borderColor: currentTemplate === key ? 
                            (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                            (activeLayout === 'photoshop' ? '#6b7280' : '#cbd5e1')
                        },
                        overflow: 'hidden'
                      }}
                      onClick={() => applyTemplate(key)}
                    >
                      <CardContent sx={{ p: 1.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '8px',
                            backgroundColor: currentTemplate === key ? 
                              (activeLayout === 'photoshop' ? '#7c3aed' : '#dbeafe') : 
                              (activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9'),
                            color: currentTemplate === key ? 
                              (activeLayout === 'photoshop' ? '#ffffff' : '#3b82f6') : 
                              (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b')
                          }}>
                            <PictureAsPdf sx={{ fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b',
                              lineHeight: 1.3,
                              mb: 0.5
                            }}>
                              {template.name}
                            </Typography>
                            {template.canvasSize && (
                              <Typography variant="caption" sx={{ 
                                color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}>
                                <AspectRatio sx={{ fontSize: 12 }} />
                                {template.canvasSize.width}×{template.canvasSize.height}px
                              </Typography>
                            )}
                          </Box>
                          {currentTemplate === key && (
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6',
                              animation: 'pulse 1.5s ease-in-out infinite'
                            }} />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Page Navigation */}
              {pages.length > 1 && (
                <Box sx={{ 
                  mt: 3.5, 
                  pt: 2.5, 
                  borderTop: '1px solid #e2e8f0' 
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ 
                    fontWeight: 700, 
                    color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
                    mb: 1.75,
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75
                  }}>
                    <Description sx={{ fontSize: 16, color: '#64748b' }} />
                    Page Navigation
                  </Typography>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2,
                      backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 1.5
                    }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 600, 
                        color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em'
                      }}>
                        Current Page
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        color: activeLayout === 'photoshop' ? '#ffffff' : '#1e293b',
                        backgroundColor: activeLayout === 'photoshop' ? '#7c3aed' : '#f0f9ff',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        border: activeLayout === 'photoshop' ? '1px solid #8b5cf6' : '1px solid #dbeafe'
                      }}>
                        {currentPageIndex + 1} / {pages.length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: 1
                    }}>
                      <Tooltip title="Previous Page" arrow>
                        <IconButton 
                          size="small" 
                          onClick={goToPrevPage} 
                          disabled={currentPageIndex === 0}
                          sx={{ 
                            color: currentPageIndex === 0 ? 
                              (activeLayout === 'photoshop' ? '#6b7280' : '#cbd5e1') : 
                              (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'),
                            backgroundColor: currentPageIndex === 0 ? 
                              (activeLayout === 'photoshop' ? '#374151' : '#f1f5f9') : 
                              (activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff'),
                            '&:hover': {
                              backgroundColor: currentPageIndex === 0 ? 
                                (activeLayout === 'photoshop' ? '#374151' : '#f1f5f9') : 
                                (activeLayout === 'photoshop' ? '#5b21b6' : '#dbeafe'),
                              transform: currentPageIndex === 0 ? 'none' : 'translateY(-1px)'
                            },
                            transition: 'all 0.2s',
                            width: 36,
                            height: 36
                          }}
                        >
                          <ChevronLeft />
                        </IconButton>
                      </Tooltip>
                      
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                          mb: 0.5
                        }}>
                          Page {currentPageIndex + 1}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: activeLayout === 'photoshop' ? '#9ca3af' : '#94a3b8',
                          fontWeight: 500
                        }}>
                          {pages[currentPageIndex]?.elements?.length || 0} elements
                        </Typography>
                      </Box>
                      
                      <Tooltip title="Next Page" arrow>
                        <IconButton 
                          size="small" 
                          onClick={goToNextPage} 
                          disabled={currentPageIndex === pages.length - 1}
                          sx={{ 
                            color: currentPageIndex === pages.length - 1 ? 
                              (activeLayout === 'photoshop' ? '#6b7280' : '#cbd5e1') : 
                              (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'),
                            backgroundColor: currentPageIndex === pages.length - 1 ? 
                              (activeLayout === 'photoshop' ? '#374151' : '#f1f5f9') : 
                              (activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff'),
                            '&:hover': {
                              backgroundColor: currentPageIndex === pages.length - 1 ? 
                                (activeLayout === 'photoshop' ? '#374151' : '#f1f5f9') : 
                                (activeLayout === 'photoshop' ? '#5b21b6' : '#dbeafe'),
                              transform: currentPageIndex === pages.length - 1 ? 'none' : 'translateY(-1px)'
                            },
                            transition: 'all 0.2s',
                            width: 36,
                            height: 36
                          }}
                        >
                          <ChevronRight />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* File Upload Section */}
              <Box sx={{ 
                mt: 3.5, 
                pt: 2.5, 
                borderTop: '1px solid #e2e8f0' 
              }}>
                <Typography variant="subtitle2" gutterBottom sx={{ 
                  fontWeight: 700, 
                  color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
                  mb: 1.75,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75
                }}>
                  <CloudUpload sx={{ fontSize: 16, color: '#64748b' }} />
                  Upload Document
                </Typography>
                
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 
                      (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                      isEditorFullyReady ? 
                        (activeLayout === 'photoshop' ? '#4b5563' : '#cbd5e1') : 
                        '#fbbf24',
                    borderRadius: '12px',
                    p: 3,
                    textAlign: 'center',
                    cursor: isEditorFullyReady ? 'pointer' : 'not-allowed',
                    backgroundColor: isDragActive ? 
                      (activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff') : 
                      isEditorFullyReady ? 
                        (activeLayout === 'photoshop' ? '#374151' : '#f8fafc') : 
                        '#fffbeb',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: isEditorFullyReady ? 
                        (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                        '#fbbf24',
                      backgroundColor: isEditorFullyReady ? 
                        (activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff') : 
                        '#fffbeb',
                      transform: isEditorFullyReady ? 'translateY(-2px)' : 'none'
                    },
                    pointerEvents: isEditorFullyReady ? 'auto' : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: isDragActive ? 
                        (activeLayout === 'photoshop' ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)') : 
                        isEditorFullyReady ? 
                          (activeLayout === 'photoshop' ? 'linear-gradient(90deg, #4b5563, #6b7280)' : 'linear-gradient(90deg, #cbd5e1, #e2e8f0)') : 
                          'linear-gradient(90deg, #fbbf24, #fcd34d)',
                      opacity: 0.7
                    }
                  }}
                >
                  <input {...getInputProps()} disabled={!isCanvasReady} />
                  <CloudUpload sx={{ 
                    fontSize: 48, 
                    color: isEditorFullyReady ? 
                      (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                      '#fbbf24', 
                    mb: 2,
                    opacity: isEditorFullyReady ? 1 : 0.7
                  }} />
                  
                  <Typography variant="body1" sx={{ 
                    fontWeight: 700, 
                    color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
                    mb: 1,
                    fontSize: '1rem'
                  }}>
                    {isEditorFullyReady ? 'Drag & Drop Files Here' : 'Initializing Editor...'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b',
                    mb: 2.5,
                    lineHeight: 1.5
                  }}>
                    Upload PDF, Images (PNG, JPG, GIF), or Text files
                    <br />
                    <Typography component="span" variant="caption" sx={{ color: activeLayout === 'photoshop' ? '#6b7280' : '#94a3b8' }}>
                      Max file size: 100MB
                    </Typography>
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<Upload sx={{ fontSize: 18 }} />}
                    onClick={handleManualFileUpload}
                    disabled={!isEditorFullyReady}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      backgroundColor: isEditorFullyReady ? 
                        (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                        (activeLayout === 'photoshop' ? '#4b5563' : '#cbd5e1'),
                      color: 'white',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: isEditorFullyReady ? 
                          (activeLayout === 'photoshop' ? '#7c3aed' : '#2563eb') : 
                          (activeLayout === 'photoshop' ? '#4b5563' : '#cbd5e1'),
                        transform: isEditorFullyReady ? 'translateY(-1px)' : 'none',
                        boxShadow: isEditorFullyReady ? 
                          (activeLayout === 'photoshop' ? '0 6px 12px rgba(139, 92, 246, 0.25)' : '0 6px 12px rgba(59, 130, 246, 0.25)') : 'none'
                      },
                      transition: 'all 0.2s',
                      boxShadow: isEditorFullyReady ? 
                        (activeLayout === 'photoshop' ? '0 4px 8px rgba(139, 92, 246, 0.2)' : '0 4px 8px rgba(59, 130, 246, 0.2)') : 'none'
                    }}
                  >
                    Browse Files
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ 
              color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
              fontWeight: 700, 
              mb: 2.5,
              fontSize: '0.9375rem'
            }}>
              Add Elements
            </Typography>
            
            {/* Layout-Specific Element Categories */}
            {renderLayoutSpecificElements()}
              
              {/* Drawing Tools Section */}
              <Typography variant="subtitle2" gutterBottom sx={{ 
                fontWeight: 600, 
                color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569', 
                mb: 1.5,
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Drawing Tools
              </Typography>
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {[
                  { id: 'brush', label: 'Brush', icon: <FormatPaint />, color: '#8b5cf6' },
                  { id: 'pencil', label: 'Pencil', icon: <AutoFixHigh />, color: '#10b981' },
                  { id: 'highlighter', label: 'Highlighter', icon: <Link />, color: '#f59e0b' },
                  { id: 'eraser', label: 'Eraser', icon: <Delete />, color: '#ef4444' },
                  { id: 'freehand', label: 'Freehand', icon: <ShapeLine />, color: '#3b82f6' },
                ].map((tool) => (
                  <Grid size={2.4} key={tool.id}>
                    <Tooltip title={tool.label} arrow>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          textAlign: 'center',
                          p: 1.25,
                          border: selectedTool === tool.id ? '2px solid' : '1px solid',
                          borderColor: selectedTool === tool.id ? tool.color : 
                            (activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'),
                          backgroundColor: selectedTool === tool.id ? 
                            (activeLayout === 'photoshop' ? `${tool.color}20` : `${tool.color}10`) : 
                            (activeLayout === 'photoshop' ? '#374151' : '#ffffff'),
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: activeLayout === 'photoshop' ? 
                              `0 4px 12px ${tool.color}30` : 
                              `0 4px 12px ${tool.color}20`,
                            borderColor: tool.color
                          }
                        }}
                        onClick={() => setSelectedTool(tool.id)}
                      >
                        <Box sx={{ 
                          color: selectedTool === tool.id ? tool.color : 
                            (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'), 
                          mb: 0.75,
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          {tool.icon}
                        </Box>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600,
                          color: selectedTool === tool.id ? tool.color : 
                            (activeLayout === 'photoshop' ? '#d1d5db' : '#475569')
                        }}>
                          {tool.label}
                        </Typography>
                      </Card>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>

              {/* Shape Tools Section */}
              <Typography variant="subtitle2" gutterBottom sx={{ 
                fontWeight: 600, 
                color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569', 
                mb: 1.5,
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Shape Tools
              </Typography>
              <Grid container spacing={1.5}>
              {[
                { type: 'text', label: 'Text', icon: <TextFields />, color: '#3b82f6' },
                { type: 'heading', label: 'Heading', icon: <FormatSize />, color: '#10b981' },
                { type: 'rectangle', label: 'Rectangle', icon: <CropSquare />, color: '#8b5cf6' },
                { type: 'circle', label: 'Circle', icon: <CircleIcon />, color: '#ef4444' },
                { type: 'triangle', label: 'Triangle', icon: <ChangeHistory />, color: '#f59e0b' },
                { type: 'star', label: 'Star', icon: <Star />, color: '#06b6d4' },
                { type: 'line', label: 'Line', icon: <Remove />, color: '#64748b' },
                { type: 'arrow', label: 'Arrow', icon: <ArrowRightAlt />, color: '#8b5cf6' },
                { type: 'hexagon', label: 'Hexagon', icon: <CropSquare />, color: '#10b981' },
                { type: 'heart', label: 'Heart', icon: <Favorite />, color: '#ef4444' },
                { type: 'cloud', label: 'Cloud', icon: <Cloud />, color: '#3b82f6' },
                { type: 'image', label: 'Image', icon: <ImageIcon />, color: '#06b6d4' },
              ].map((item) => (
                <Grid item xs={3} key={item.type}>
                  <Tooltip title={`Add ${item.label}`} arrow>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        textAlign: 'center',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
                        backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#ffffff',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: activeLayout === 'photoshop' ? 
                            `0 6px 16px ${item.color}30` : 
                            `0 6px 16px ${item.color}20`,
                          borderColor: item.color
                        }
                      }}
                      onClick={() => addElement(item.type)}
                    >
                      <Box sx={{ 
                        color: item.color, 
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        {React.cloneElement(item.icon, { sx: { fontSize: 24 } })}
                      </Box>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 700,
                        color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b'
                      }}>
                        {item.label}
                      </Typography>
                    </Card>
                  </Tooltip>
                </Grid>
              ))}
              </Grid>

              {/* OCR Actions */}
              {content && (
                <Box sx={{ 
                  mt: 3.5, 
                  p: 2.5, 
                  border: '1px solid',
                  borderColor: activeLayout === 'photoshop' ? '#7c3aed' : '#dbeafe',
                  borderRadius: '12px',
                  backgroundColor: activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff',
                  background: activeLayout === 'photoshop' ? 
                    'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)' : 
                    'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ 
                    color: activeLayout === 'photoshop' ? '#ffffff' : '#1e40af', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.75,
                    mb: 1.5
                  }}>
                    <SmartToy sx={{ fontSize: 18 }} />
                    OCR Extracted Text
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                    mb: 2,
                    lineHeight: 1.5
                  }}>
                    Add the extracted OCR text to your canvas for editing and design.
                  </Typography>
                  <Button 
                    fullWidth
                    size="medium"
                    startIcon={<TextFields sx={{ fontSize: 18 }} />}
                    onClick={addOCRToCanvas}
                    variant="contained"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6',
                      color: 'white',
                      padding: '10px 0',
                      borderRadius: '8px',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: activeLayout === 'photoshop' ? '#7c3aed' : '#2563eb',
                        transform: 'translateY(-1px)',
                        boxShadow: activeLayout === 'photoshop' ? 
                          '0 6px 12px rgba(139, 92, 246, 0.25)' : 
                          '0 6px 12px rgba(59, 130, 246, 0.25)'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    Add to Canvas
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="subtitle1" sx={{ color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', fontWeight: 700 }}>
                Layers
              </Typography>
              <Tooltip title="Add New Layer" arrow>
                <IconButton 
                  size="small" 
                  onClick={handleLayerCreate}
                  sx={{ color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6' }}
                >
                  <Add sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
         <LayerPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              selectedElements={allElements} // ← CHANGED: Use ALL elements, not just selected ones
              onLayerSelect={handleLayerSelect}
              onLayerCreate={handleLayerCreate}
              onLayerDelete={handleLayerDelete}
              onLayerUpdate={handleLayerUpdate}
              onElementSelect={(id) => {
                // When element is clicked in LayerPanel, select it
                handleElementSelect(id, false);
                // Optionally, you could center the view on the element
                const element = elements.find(el => el.id === id);
                if (element && canvasStageRef.current) {
                  // Add auto-centering logic here if desired
                }
              }}
              onElementDelete={handleElementDelete}
              onElementDuplicate={handleElementDuplicate}
              onElementUpdate={handleElementUpdate} // ← NEW: Pass the update handler
              showElementCount={true}
              allowLayerOperations={true}
              layoutMode={activeLayout}
            />
          </Box>
        )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
                fontWeight: 700, 
                mb: 2.5,
                fontSize: '0.9375rem'
              }}>
                Settings & Properties
              </Typography>
              
              {/* Text Properties */}
              {selectedIds && selectedIds.length > 0 && elements.find(el => selectedIds.includes(el.id) && el.type === 'text') && (
                <Box sx={{ mb: 3.5 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ 
                    fontWeight: 700, 
                    color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
                    mb: 2,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75
                  }}>
                    <TextFields sx={{ fontSize: 16, color: '#64748b' }} />
                    Text Properties
                  </Typography>
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel sx={{ 
                      fontWeight: 600,
                      color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'
                    }}>
                      Font Family
                    </InputLabel>
                    <Select
                      value={textProperties.fontFamily}
                      label="Font Family"
                      onChange={(e) => setTextProperties(prev => ({ ...prev, fontFamily: e.target.value }))}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: activeLayout === 'photoshop' ? '#6b7280' : '#cbd5e1'
                        },
                        borderRadius: '8px',
                        backgroundColor: activeLayout === 'photoshop' ? '#374151' : 'white'
                      }}
                    >
                      {['Arial', 'Georgia', 'Times New Roman', 'Helvetica', 'Verdana', 'Tahoma', 
                        'Courier New', 'Comic Sans MS', 'Impact', 'Trebuchet MS'].map(font => (
                        <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 1.5,
                      mb: 2,
                      backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Tooltip title="Bold" arrow>
                        <IconButton
                          size="small"
                          sx={{
                            color: textProperties.fontWeight === 'bold' ? 
                              (activeLayout === 'photoshop' ? '#ffffff' : '#1e293b') : 
                              (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'),
                            backgroundColor: textProperties.fontWeight === 'bold' ? 
                              (activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0') : 
                              'transparent',
                            '&:hover': {
                              backgroundColor: activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9'
                            },
                            borderRadius: '6px'
                          }}
                          onClick={() => setTextProperties(prev => ({ 
                            ...prev, 
                            fontWeight: prev.fontWeight === 'bold' ? 'normal' : 'bold' 
                          }))}
                        >
                          <FormatBold />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Italic" arrow>
                        <IconButton 
                          size="small"
                          sx={{
                            color: textProperties.fontStyle === 'italic' ? 
                              (activeLayout === 'photoshop' ? '#ffffff' : '#1e293b') : 
                              (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'),
                            backgroundColor: textProperties.fontStyle === 'italic' ? 
                              (activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0') : 
                              'transparent',
                            '&:hover': {
                              backgroundColor: activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9'
                            },
                            borderRadius: '6px'
                          }}
                          onClick={() => setTextProperties(prev => ({
                            ...prev,
                            fontStyle: prev.fontStyle === 'italic' ? 'normal' : 'italic'
                          }))}
                        >
                          <FormatItalic />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Underline" arrow>
                        <IconButton 
                          size="small"
                          sx={{
                            color: textProperties.underline ? 
                              (activeLayout === 'photoshop' ? '#ffffff' : '#1e293b') : 
                              (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'),
                            backgroundColor: textProperties.underline ? 
                              (activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0') : 
                              'transparent',
                            '&:hover': {
                              backgroundColor: activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9'
                            },
                            borderRadius: '6px'
                          }}
                          onClick={() => setTextProperties(prev => ({
                            ...prev,
                            underline: !prev.underline
                          }))}
                        >
                          <span style={{ 
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}>
                            U
                          </span>
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Tooltip title="Align Left" arrow>
                        <IconButton 
                          size="small"
                          sx={{
                            color: textProperties.textAlign === 'left' ? 
                              (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                              (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'),
                            backgroundColor: textProperties.textAlign === 'left' ? 
                              (activeLayout === 'photoshop' ? '#4c1d95' : '#dbeafe') : 
                              'transparent',
                            '&:hover': {
                              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f1f5f9'
                            },
                            borderRadius: '6px'
                          }}
                          onClick={() => setTextProperties(prev => ({ ...prev, textAlign: 'left' }))}
                        >
                          <FormatAlignLeft />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Center" arrow>
                        <IconButton 
                          size="small"
                          sx={{
                            color: textProperties.textAlign === 'center' ? 
                              (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                              (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'),
                            backgroundColor: textProperties.textAlign === 'center' ? 
                              (activeLayout === 'photoshop' ? '#4c1d95' : '#dbeafe') : 
                              'transparent',
                            '&:hover': {
                              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f1f5f9'
                            },
                            borderRadius: '6px'
                          }}
                          onClick={() => setTextProperties(prev => ({ ...prev, textAlign: 'center' }))}
                        >
                          <FormatAlignCenter />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align Right" arrow>
                        <IconButton 
                          size="small"
                          sx={{
                            color: textProperties.textAlign === 'right' ? 
                              (activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6') : 
                              (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'),
                            backgroundColor: textProperties.textAlign === 'right' ? 
                              (activeLayout === 'photoshop' ? '#4c1d95' : '#dbeafe') : 
                              'transparent',
                            '&:hover': {
                              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f1f5f9'
                            },
                            borderRadius: '6px'
                          }}
                          onClick={() => setTextProperties(prev => ({ ...prev, textAlign: 'right' }))}
                        >
                          <FormatAlignRight />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>

                  <Box sx={{ mb: 2.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1.5
                    }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 700, 
                        color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Font Size
                      </Typography>
                      <Chip 
                        label={`${textProperties.fontSize}px`}
                        size="small"
                        sx={{ 
                          fontWeight: 700,
                          backgroundColor: activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff',
                          color: activeLayout === 'photoshop' ? '#ffffff' : '#3b82f6',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Slider
                      value={textProperties.fontSize}
                      onChange={(e, newValue) => setTextProperties(prev => ({ ...prev, fontSize: newValue }))}
                      min={8}
                      max={72}
                      size="small"
                      sx={{
                        color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6',
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                          boxShadow: activeLayout === 'photoshop' ? 
                            '0 2px 4px rgba(139, 92, 246, 0.3)' : 
                            '0 2px 4px rgba(59, 130, 246, 0.3)'
                        },
                        '& .MuiSlider-track': {
                          height: 4
                        },
                        '& .MuiSlider-rail': {
                          height: 4,
                          backgroundColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
                        }
                      }}
                    />
                  </Box>
                </Box>
              )}
              
              {/* Canvas Color Picker for Photoshop mode */}
              {activeLayout === 'photoshop' && (
                <Box sx={{ 
                  mb: 3.5, 
                  pt: 2.5, 
                  borderTop: '1px solid #4b5563' 
                }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ 
                    fontWeight: 700, 
                    color: '#f3f4f6', 
                    mb: 2,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75
                  }}>
                    <Palette sx={{ fontSize: 16, color: '#9ca3af' }} />
                    Canvas Color
                  </Typography>
                  
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2,
                      backgroundColor: '#374151',
                      borderRadius: '10px',
                      border: '1px solid #4b5563'
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {['#2d2d2d', '#1a1a1a', '#ffffff', '#f8f9fa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                        <Tooltip title={color} key={color}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '6px',
                              backgroundColor: color,
                              border: customCanvasColor === color ? '3px solid #8b5cf6' : '1px solid #4b5563',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s'
                            }}
                            onClick={() => setCustomCanvasColor(color)}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                    
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Color"
                      value={customCanvasColor || ''}
                      onChange={(e) => setCustomCanvasColor(e.target.value)}
                      placeholder="#RRGGBB or CSS color name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#4b5563'
                        },
                        '& .MuiInputLabel-root': {
                          color: '#9ca3af'
                        }
                      }}
                    />
                  </Paper>
                </Box>
              )}
              
              {/* Canvas Settings */}
              <Box sx={{ 
                pt: 2.5, 
                borderTop: '1px solid',
                borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
              }}>
                <Typography variant="subtitle2" gutterBottom sx={{ 
                  fontWeight: 700, 
                  color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b', 
                  mb: 2,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75
                }}>
                  <AspectRatio sx={{ fontSize: 16, color: '#64748b' }} />
                  Canvas Settings
                </Typography>
                
                <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                  <InputLabel sx={{ 
                    fontWeight: 600, 
                    color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b' 
                  }}>
                    Canvas Size
                  </InputLabel>
                  <Select
                    value={`${canvasSize.width}x${canvasSize.height}`}
                    onChange={(e) => handleCanvasSizeChange(e.target.value)}
                    label="Canvas Size"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: activeLayout === 'photoshop' ? '#6b7280' : '#cbd5e1'
                      },
                      borderRadius: '8px',
                      backgroundColor: activeLayout === 'photoshop' ? '#374151' : 'white'
                    }}
                  >
                    {Object.entries(FIXED_CANVAS_SIZES).map(([key, size]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          width: '100%',
                          py: 0.5
                        }}>
                          <Box>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b' 
                            }}>
                              {size.name}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b' 
                            }}>
                              {size.width} × {size.height} px
                            </Typography>
                          </Box>
                          {canvasSize.width === size.width && canvasSize.height === size.height && (
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
                            }} />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2,
                    backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showGridGuides}
                        onChange={(e) => setShowGridGuides(e.target.checked)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
                          }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GridOn sx={{ fontSize: 16, color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b' }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b' 
                        }}>
                          Show Grid & Guides
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%', mb: 1.5 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showQuickAccess}
                        onChange={(e) => setShowQuickAccess(e.target.checked)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6'
                          }
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ViewSidebar sx={{ fontSize: 16, color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b' }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b' 
                        }}>
                          Quick Access Tools
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%' }}
                  />
                </Paper>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Main Canvas Area */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f1f5f9'
      }}>
        {/* Top Toolbar - Professional Design */}
        <Paper 
          elevation={1}
          sx={{
            backgroundColor: activeLayout === 'photoshop' ? '#2d2d2d' : '#ffffff',
            borderBottom: '1px solid',
            borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
            padding: '10px 24px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            maxWidth: '900px',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {/* Left: History Controls */}
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5,
              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
            }}>
              <Tooltip title="Undo (Ctrl+Z)" arrow>
                <span>
                  <IconButton 
                    onClick={undo} 
                    disabled={!canUndo}
                    size="small"
                    sx={{ 
                      color: canUndo ? 
                        (activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b') : 
                        (activeLayout === 'photoshop' ? '#6b7280' : '#cbd5e1'),
                      backgroundColor: canUndo ? 'transparent' : 
                        (activeLayout === 'photoshop' ? '#374151' : '#f8fafc'),
                      '&:hover': {
                        backgroundColor: canUndo ? 
                          (activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9') : 
                          (activeLayout === 'photoshop' ? '#374151' : '#f8fafc'),
                        transform: canUndo ? 'translateY(-1px)' : 'none'
                      },
                      transition: 'all 0.2s',
                      width: 36,
                      height: 36,
                      borderRadius: '6px'
                    }}
                  >
                    <Undo />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Redo (Ctrl+Y)" arrow>
                <span>
                  <IconButton 
                    onClick={redo} 
                    disabled={!canRedo}
                    size="small"
                    sx={{ 
                      color: canRedo ? 
                        (activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b') : 
                        (activeLayout === 'photoshop' ? '#6b7280' : '#cbd5e1'),
                      backgroundColor: canRedo ? 'transparent' : 
                        (activeLayout === 'photoshop' ? '#374151' : '#f8fafc'),
                      '&:hover': {
                        backgroundColor: canRedo ? 
                          (activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9') : 
                          (activeLayout === 'photoshop' ? '#374151' : '#f8fafc'),
                        transform: canRedo ? 'translateY(-1px)' : 'none'
                      },
                      transition: 'all 0.2s',
                      width: 36,
                      height: 36,
                      borderRadius: '6px'
                    }}
                  >
                    <Redo />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            
            {/* Center: Enhanced Tool Selection */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
              padding: '6px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <Typography variant="caption" sx={{ 
                fontWeight: 700,
                color: activeLayout === 'photoshop' ? '#d1d5db' : '#64748b',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
                padding: '0 8px'
              }}>
                Tools:
              </Typography>
              {[
                { id: 'select', icon: '↖', label: 'Select (V)', color: '#3b82f6' },
                { id: 'text', icon: <TextFields />, label: 'Text (T)', color: '#10b981' },
                { id: 'rectangle', icon: <ShapeLine />, label: 'Rectangle (R)', color: '#8b5cf6' },
                { id: 'circle', icon: <CircleIcon />, label: 'Circle (C)', color: '#ef4444' },
                { id: 'line', icon: <ShapeLine />, label: 'Line (L)', color: '#f59e0b' },
                { id: 'image', icon: <ImageIcon />, label: 'Image (I)', color: '#06b6d4' },
              ].map((tool) => (
                <Tooltip key={tool.id} title={tool.label} arrow>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedTool(tool.id)}
                      sx={{
                        backgroundColor: selectedTool === tool.id ? tool.color : 'transparent',
                        color: selectedTool === tool.id ? '#ffffff' : 
                          (activeLayout === 'photoshop' ? '#9ca3af' : '#64748b'),
                        '&:hover': {
                          backgroundColor: selectedTool === tool.id ? tool.color : 
                            (activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9'),
                          color: selectedTool === tool.id ? '#ffffff' : tool.color,
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s',
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': selectedTool === tool.id ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '60%',
                          height: '3px',
                          backgroundColor: '#ffffff',
                          borderRadius: '3px 3px 0 0'
                        } : {}
                      }}
                    >
                      {typeof tool.icon === 'string' ? (
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{tool.icon}</span>
                      ) : tool.icon}
                    </IconButton>
                  </Box>
                </Tooltip>
              ))}
            </Box>
            
            {/* Right: Zoom and View Controls */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
            }}>
              <Tooltip title="Zoom Out (Ctrl+-)" arrow>
                <IconButton 
                  onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
                  size="small"
                  sx={{
                    color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b',
                    '&:hover': {
                      color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6',
                      backgroundColor: activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s',
                    width: 32,
                    height: 32
                  }}
                >
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              
              <Box sx={{ 
                minWidth: '80px', 
                textAlign: 'center',
                padding: '0 12px'
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 700,
                  color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b',
                  fontSize: '0.875rem'
                }}>
                  {Math.round(zoom * 100)}%
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: activeLayout === 'photoshop' ? '#9ca3af' : '#94a3b8',
                  fontWeight: 500,
                  fontSize: '0.7rem'
                }}>
                  Zoom Level
                </Typography>
              </Box>
              
              <Tooltip title="Zoom In (Ctrl+=)" arrow>
                <IconButton 
                  onClick={() => setZoom(prev => Math.min(5, prev + 0.1))}
                  size="small"
                  sx={{
                    color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b',
                    '&:hover': {
                      color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6',
                      backgroundColor: activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s',
                    width: 32,
                    height: 32
                  }}
                >
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem sx={{ 
                borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0' 
              }} />
              
              <Tooltip title="Reset View (Ctrl+0)" arrow>
                <Button
                  size="small"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b',
                    textTransform: 'none',
                    '&:hover': {
                      color: activeLayout === 'photoshop' ? '#8b5cf6' : '#3b82f6',
                      backgroundColor: activeLayout === 'photoshop' ? '#4b5563' : '#f1f5f9'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  Reset View
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Layout Mode Indicator */}
        <Box sx={{
          padding: '8px 24px',
          backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc',
          borderBottom: '1px solid',
          borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <Tooltip title={layoutConfig[activeLayout]?.helpText || "Current layout mode features"} arrow>
              <Chip
                label={activeLayout === 'word' ? 'Document Mode' : 
                      activeLayout === 'powerpoint' ? 'Presentation Mode' :
                      activeLayout === 'photoshop' ? 'Design Mode' : 'Grid Mode'}
                size="small"
                sx={{ 
                  fontWeight: 700,
                  backgroundColor: activeLayout === 'word' ? '#dbeafe' :
                                activeLayout === 'powerpoint' ? '#fef3c7' :
                                activeLayout === 'photoshop' ? '#fce7f3' : '#dcfce7',
                  color: activeLayout === 'word' ? '#1e40af' :
                      activeLayout === 'powerpoint' ? '#92400e' :
                      activeLayout === 'photoshop' ? '#831843' : '#065f46',
                  fontSize: '0.75rem',
                  cursor: 'help'
                }}
              />
            </Tooltip>
                        <Typography variant="caption" sx={{ 
              color: activeLayout === 'photoshop' ? '#d1d5db' : '#64748b',
              fontWeight: 500
            }}>
              Grid: <strong>{showGridGuides ? 'ON' : 'OFF'}</strong> | 
              Canvas: <strong>{canvasSize.width}×{canvasSize.height}px</strong> | 
              Elements: <strong>{elements.length}</strong>
            </Typography>
          </Box>
        </Box>
        
        {/* Canvas Display Area - UPDATED STRUCTURE */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          backgroundColor: activeLayout === 'photoshop' ? '#1a1a1a' : '#f1f5f9',
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          {/* OCR Content Display */}
          {content && showOCRArea && (
            <Paper 
              elevation={3}
              sx={{ 
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                maxWidth: '800px',
                zIndex: 100,
                p: 2.5,
                border: '2px solid #3b82f6',
                backgroundColor: '#ffffff',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                borderRadius: '12px',
                animation: 'slideDown 0.3s ease-out'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    backgroundColor: '#f0f9ff',
                    color: '#3b82f6'
                  }}>
                    <SmartToy sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: '#1e293b', 
                      fontWeight: 700,
                      lineHeight: 1.2
                    }}>
                      OCR Extracted Text
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#64748b',
                      fontWeight: 500
                    }}>
                      Ready to be added to your design
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Copy to clipboard" arrow>
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        navigator.clipboard.writeText(content);
                        showNotification('OCR text copied to clipboard!');
                      }}
                      sx={{ 
                        color: '#64748b',
                        backgroundColor: '#f8fafc',
                        '&:hover': {
                          backgroundColor: '#f1f5f9',
                          color: '#3b82f6'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      <ContentCopy sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hide OCR panel" arrow>
                    <IconButton 
                      size="small" 
                      onClick={() => setShowOCRArea(false)}
                      sx={{ 
                        color: '#64748b',
                        backgroundColor: '#f8fafc',
                        '&:hover': {
                          backgroundColor: '#f1f5f9',
                          color: '#ef4444'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      <VisibilityOff sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 2.5,
                  borderRadius: '8px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #dbeafe',
                  '& .MuiAlert-icon': {
                    color: '#3b82f6'
                  }
                }}
              >
                Use the "Add to Canvas" button in the Elements tab to incorporate this text into your design.
              </Alert>
              <Typography 
                variant="body2" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflow: 'auto',
                  backgroundColor: '#f8fafc',
                  p: 2.5,
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  color: '#475569'
                }}
              >
                {content}
              </Typography>
            </Paper>
          )}
          
          {/* Canvas Container - UPDATED STRUCTURE */}
          <Box sx={{
            position: 'relative',
            border: '2px solid #2c3e50',
            borderRadius: '4px',
            backgroundColor: '#fff',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            margin: '0 auto'
          }}>
              {/* Canvas Size Label - MOVED OUTSIDE */}
              <Box sx={{
                position: 'absolute',
                top: '-40px', // Move above canvas
                right: '0',
                backgroundColor: 'rgba(44, 62, 80, 0.9)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                zIndex: 10
              }}>
                {canvasSize.width} × {canvasSize.height}px
              </Box>
            
            {/* Canvas Info Panel - OUTSIDE the canvas */}
              {pages.length > 1 && (
                <Box sx={{
                  position: 'absolute',
                  top: '-40px', // Move above canvas
                  left: '0',
                  backgroundColor: 'rgba(59, 130, 246, 0.9)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  zIndex: 10
                }}>
                  Page {currentPageIndex + 1} of {pages.length}
                </Box>
              )}
            
            {/* Canvas Stage - ONLY Konva components should be children */}
              <CanvasStage
            ref={canvasStageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            zoom={zoom}
            pan={pan}
            onZoom={(newZoom) => {
              setZoom(newZoom);
            }}
            onPan={(newPan) => {
              setPan(newPan);
            }}
            onViewportChange={(newZoom, newPan) => {
              setZoom(newZoom);
              setPan(newPan);
            }}
            readOnly={false}
            showGrid={activeLayout === 'excel' && showGridGuides} // ✅ This looks correct
            gridSize={25}
            gridColor="#e2e8f0"
            enableZoom={true}
            enablePan={true}
            layoutMode={activeLayout} // ✅ This should be 'excel' when in Excel mode
            modeOverrides={{
              canvasColor: activeLayout === 'photoshop' ? customCanvasColor : undefined,
            }}
          >
               {/* Element Renderer */}
            <ElementRenderer
              key={`elements-${selectedLayerId}-${visibleElements.length}`} // Add this
              elements={visibleElements}
              selectedIds={selectedIds}
              hoveredElementId={hoveredElementId}
              onElementSelect={handleElementSelect}
              onElementDrag={handleElementDrag}
              onElementResize={handleElementResize}
              onElementClick={handleTextEditStart}
              onElementHover={handleElementHover}
              renderQuality="high"
              showSelection={true}
              layoutMode={activeLayout}
            />
             {/* Transformer */}
              {selectedIds.length === 1 && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    const minSize = 5;
                    if (newBox.width < minSize || newBox.height < minSize) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  anchorSize={8}
                  anchorStrokeWidth={2}
                  borderStrokeWidth={2}
                  rotateAnchorOffset={20}
                />
              )}
            </CanvasStage>

            {/* Quick Access Toolbar - This should be OUTSIDE the CanvasStage */}
            {showQuickAccess && (
              <QuickAccessToolbar
                selectedIds={selectedIds}
                selectedElements={selectedElements}
                onAlign={handleAlign}
                onGroup={handleGroup}
                onUngroup={(groupId) => handleUngroup(groupId)}
                onDelete={deleteSelectedElement}
                onDuplicate={handleDuplicate}
                onLock={handleLock}
                onHide={handleHide}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
                showContextual={true}
                position="top-right"
                layoutMode={activeLayout}
              />
            )}

            {/* Text Editor Overlay - This should be OUTSIDE the CanvasStage */}
            {textEditingElement && (
              <TextEditorOverlay
                elementId={textEditingElement.id}
                text={textEditingElement.text}
                position={textEditingElement.position}
                style={textEditingElement.style}
                onChange={(newText) => {
                  setTextEditingElement(prev => ({ ...prev, text: newText }));
                }}
                onSave={() => handleTextEditSave(
                  textEditingElement.text,
                  textEditingElement.style
                )}
                onCancel={handleTextEditCancel}
                onStyleChange={(newStyle) => {
                  setTextEditingElement(prev => ({ ...prev, style: newStyle }));
                }}
              />
            )}
          </Box>

          {/* File Upload Dropzone Overlay */}
          {isDragActive && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '4px dashed #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            >
              <Box sx={{ 
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <CloudUpload sx={{ 
                  fontSize: 64, 
                  color: '#3b82f6',
                  mb: 3 
                }} />
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b',
                  mb: 1 
                }}>
                  Drop to Upload
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#475569',
                  mb: 3,
                  maxWidth: 400
                }}>
                  Release the file to upload it to the editor
                </Typography>
                <Chip 
                  label="PDF, Images, Text files supported"
                  sx={{ 
                    backgroundColor: '#f0f9ff',
                    color: '#3b82f6',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Bottom Status Bar - Professional */}
        <Paper 
          elevation={0}
          sx={{ 
            backgroundColor: activeLayout === 'photoshop' ? '#2d2d2d' : '#ffffff',
            borderTop: '1px solid',
            borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '44px',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }} />
              <Typography variant="caption" sx={{ 
                fontWeight: 600, 
                color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                fontSize: '0.8125rem'
              }}>
                {elements.length} Elements
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ZoomIn sx={{ fontSize: 14, color: activeLayout === 'photoshop' ? '#9ca3af' : '#94a3b8' }} />
              <Typography variant="caption" sx={{ 
                fontWeight: 600, 
                color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                fontSize: '0.8125rem'
              }}>
                Zoom: {Math.round(zoom * 100)}%
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AspectRatio sx={{ fontSize: 14, color: activeLayout === 'photoshop' ? '#9ca3af' : '#94a3b8' }} />
              <Typography variant="caption" sx={{ 
                fontWeight: 600, 
                color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                fontSize: '0.8125rem'
              }}>
                Canvas: {canvasSize.width}×{canvasSize.height}px
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GridOn sx={{ fontSize: 14, color: activeLayout === 'photoshop' ? '#9ca3af' : '#94a3b8' }} />
              <Typography variant="caption" sx={{ 
                fontWeight: 600, 
                color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                fontSize: '0.8125rem'
              }}>
                Grid: {showGridGuides ? 'ON' : 'OFF'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {documentMetadata?.fileName && (
              <>
                <Description sx={{ fontSize: 14, color: activeLayout === 'photoshop' ? '#9ca3af' : '#94a3b8' }} />
                <Typography variant="caption" sx={{ 
                  fontWeight: 600, 
                  color: activeLayout === 'photoshop' ? '#d1d5db' : '#475569',
                  fontSize: '0.8125rem',
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  Editing: {documentMetadata.fileName}
                </Typography>
              </>
            )}
            {documentMetadata?.decomposerUsed && (
              <Chip 
                label="AI Enhanced"
                size="small"
                sx={{ 
                  fontWeight: 700,
                  backgroundColor: activeLayout === 'photoshop' ? '#4c1d95' : '#f0f9ff',
                  color: activeLayout === 'photoshop' ? '#ffffff' : '#3b82f6',
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Right Properties Panel */}
      <Box sx={{
        width: showPropertiesPanel ? 320 : 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        backgroundColor: activeLayout === 'photoshop' ? '#2d2d2d' : '#ffffff',
        borderLeft: '1px solid',
        borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.04)'
      }}>
        {showPropertiesPanel && (
          <>
            <Box sx={{ 
              p: 2.5, 
              borderBottom: '1px solid',
              borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc'
            }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 700, 
                color: activeLayout === 'photoshop' ? '#f3f4f6' : '#1e293b',
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}>
                <Settings sx={{ fontSize: 18, color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b' }} />
                Properties Inspector
              </Typography>
            </Box>
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-track': {
                background: activeLayout === 'photoshop' ? '#374151' : '#f1f5f9',
                borderRadius: '3px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: activeLayout === 'photoshop' ? '#4b5563' : '#cbd5e1',
                borderRadius: '3px',
                '&:hover': {
                  background: activeLayout === 'photoshop' ? '#6b7280' : '#94a3b8'
                }
              }
            }}>
           <PropertyPanel
            selectedElements={selectedElements}
            activeTool={selectedTool}
            toolProperties={toolProperties[selectedTool] || {}}
            onPropertyChange={(property, value) => {
              console.log('Property changed:', property, value);
            }}
            onElementUpdate={(elementId, updates) => {
              // Use your existing handleElementUpdate function
              handleElementUpdate(elementId, updates);
            }}
            onToolPropertyChange={(property, value) => {
              // Update tool properties for current tool
              setToolProperties(prev => ({
                ...prev,
                [selectedTool]: {
                  ...prev[selectedTool],
                  [property]: value
                }
              }));
              
              // Update konva tool manager if needed
              konvaToolManager.updateToolProperty(property, value);
            }}
            showAdvanced={true}
            layoutMode={activeLayout} // This is the key prop
          />
            </Box>
          </>
        )}
        <Button
          sx={{
            position: 'absolute',
            right: showPropertiesPanel ? 320 : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            backgroundColor: activeLayout === 'photoshop' ? '#2d2d2d' : '#ffffff',
            border: '1px solid',
            borderColor: activeLayout === 'photoshop' ? '#4b5563' : '#e2e8f0',
            borderRadius: '0 6px 6px 0',
            minWidth: 'auto',
            padding: '12px 6px',
            boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
            '&:hover': {
              backgroundColor: activeLayout === 'photoshop' ? '#374151' : '#f8fafc'
            },
            transition: 'all 0.2s'
          }}
          onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          size="small"
        >
          {showPropertiesPanel ? 
            <ChevronRight sx={{ fontSize: 18, color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b' }} /> : 
            <ChevronLeft sx={{ fontSize: 18, color: activeLayout === 'photoshop' ? '#9ca3af' : '#64748b' }} />
          }
        </Button>
      </Box>
    </Box>

    {/* Save/Export Dialog */}
    <SaveDialog
      open={saveDialogOpen}
      onClose={() => setSaveDialogOpen(false)}
      onSave={handleSaveWithFormat}
      selectedFormat={selectedFormat}
      setSelectedFormat={setSelectedFormat}
      isExporting={isExporting}
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
      exportQuality={exportQuality}
      setExportQuality={setExportQuality}
    />

    {/* Snackbar for notifications */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
      }}
    >
      <Alert 
        severity={snackbar.severity} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        sx={{
          fontWeight: 600,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>

    {/* Hidden file input */}
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileInputChange}
      style={{ display: 'none' }}
      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.txt"
      multiple={false}
    />
  </Box>
);
};

export default PDFEditor;