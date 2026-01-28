// src/app/features/ocr/components/TextEditor.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogActions,
  Button, Box, Typography, Paper,
  ToggleButtonGroup, ToggleButton, Slider, FormControl,
  InputLabel, Select, MenuItem, Grid, Chip, IconButton,
  Tooltip, Divider, useTheme, useMediaQuery, Tab, Tabs,
  Popover, Fab, Card, CardContent,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  FormatBold, FormatItalic, FormatUnderlined,
  FormatAlignLeft, FormatAlignCenter, FormatAlignRight,
  FormatListBulleted, FormatListNumbered, Link,
  Image, TableChart, Code, Save, Close,
  Download, Upload, Undo, Redo, ZoomIn, ZoomOut,
  Psychology, SmartToy, AutoFixHigh,
  BarChart, PieChart, ShowChart, TableRows,
  TextFields, Analytics, Timeline, Refresh, Add,
  Palette, FormatColorText, FormatColorFill,
  ShapeLine, Rectangle, Circle, ChangeHistory,
  HorizontalRule, Draw, GridView, TextFormat,
  PictureAsPdf, Description, CloudDownload,
  ExpandMore, Brush, AutoAwesome, Dashboard,
  ViewModule, ViewQuilt, ViewWeek, Crop,
  Transform, AspectRatio, BorderAll,
  BorderClear, BorderInner, BorderOuter, ChevronLeft,
  ChevronRight,  CropFree,
  
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// Enhanced sample data
const sampleChartData = [
  { name: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
  { name: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
  { name: 'Mar', revenue: 9800, expenses: 2000, profit: 7800 },
  { name: 'Apr', revenue: 3908, expenses: 2780, profit: 1128 },
  { name: 'May', revenue: 4800, expenses: 1890, profit: 2910 },
  { name: 'Jun', revenue: 3800, expenses: 2390, profit: 1410 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Shape types for canvas drawing
const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  TRIANGLE: 'triangle',
  TEXT: 'text'
};

// Color Picker Popover Component - MOVED OUTSIDE to fix render issue
const ColorPickerPopover = ({ 
  open, 
  anchorEl, 
  onClose, 
  colorType, 
  onColorChange, 
  onCanvasBackgroundChange 
}) => (
  <Popover
    open={open}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
  >
    <Box sx={{ p: 2, width: 200 }}>
      <Typography variant="subtitle2" gutterBottom>
        {colorType === 'text' ? 'Text Color' : 
         colorType === 'background' ? 'Background Color' : 
         'Canvas Background'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
        {[
          '#2D3748', '#4A5568', '#718096', '#A0AEC0',
          '#E53E3E', '#DD6B20', '#D69E2E', '#38A169',
          '#319795', '#3182CE', '#5A67D8', '#805AD5',
          '#FFFFFF', '#F7FAFC', '#EDF2F7', '#E2E8F0'
        ].map((color) => (
          <Box
            key={color}
            sx={{
              width: 30,
              height: 30,
              backgroundColor: color,
              borderRadius: 1,
              cursor: 'pointer',
              border: color === '#FFFFFF' ? '1px solid #E2E8F0' : 'none',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }
            }}
            onClick={() => {
              if (colorType === 'canvas') {
                onCanvasBackgroundChange(color);
              } else {
                onColorChange(color, colorType);
              }
              onClose();
            }}
          />
        ))}
      </Box>
    </Box>
  </Popover>
);

const TextEditor = ({ open, onClose, content, onSave, documentType, aiResults }) => {
  const [editedContent, setEditedContent] = useState(content || '');
  const [activeTab, setActiveTab] = useState(0);
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
    alignment: 'left',
    lineHeight: 1.6
  });
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState([content || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [chartData, setChartData] = useState(sampleChartData);
  const [tableData, setTableData] = useState([
    { id: 1, product: 'Laptop', sales: 150, growth: 15 },
    { id: 2, product: 'Phone', sales: 200, growth: 8 },
    { id: 3, product: 'Tablet', sales: 80, growth: 25 }
  ]);
  
  // Enhanced state for design features
  const [shapes, setShapes] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState('select');
  const [canvasBackground, setCanvasBackground] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#2D3748');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [colorType, setColorType] = useState('text');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [shapeIdCounter, setShapeIdCounter] = useState(1);

  // NEW: Add sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // NEW: Add editor window state for resizing and maximizing
  const [editorWindow, setEditorWindow] = useState({
    isMaximized: false,
    width: '100%',
    height: '100%',
    position: { x: 0, y: 0 },
    isResizing: false,
    resizeDirection: null
  });
  
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // NEW: Editor window resize and maximize handlers
const handleMaximizeToggle = () => {
  setEditorWindow(prev => ({
    ...prev,
    isMaximized: !prev.isMaximized,
    width: !prev.isMaximized ? '100%' : '100%',
    height: !prev.isMaximized ? '100%' : '100%',
    position: { x: 0, y: 0 }
  }));
};

const handleResizeStart = (e, direction) => {
  e.preventDefault();
  setEditorWindow(prev => ({
    ...prev,
    isResizing: true,
    resizeDirection: direction
  }));
};

const handleResize = useCallback((e) => {
  if (!editorWindow.isResizing) return;

  const container = document.querySelector('.editor-container');
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const newWidth = Math.max(400, e.clientX - containerRect.left);
  const newHeight = Math.max(300, e.clientY - containerRect.top);

  setEditorWindow(prev => ({
    ...prev,
    width: newWidth,
    height: newHeight
  }));
}, [editorWindow.isResizing]);

const handleResizeEnd = useCallback(() => {
  setEditorWindow(prev => ({
    ...prev,
    isResizing: false,
    resizeDirection: null
  }));
}, []);

useEffect(() => {
  if (editorWindow.isResizing) {
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  } else {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  }

  return () => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
}, [editorWindow.isResizing, handleResize, handleResizeEnd]);



  // Enhanced font families
  const fontFamilies = [
    'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
    'Verdana', 'Tahoma', 'Courier New', 'Trebuchet MS', 'Roboto',
    'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Merriweather'
  ];

  // Initialize editor
  const initializeEditor = useCallback(() => {
    if (open && content) {
      setTimeout(() => {
        setEditedContent(content);
        setHistory([content]);
        setHistoryIndex(0);
      }, 0);
    }
  }, [open, content]);

  useEffect(() => {
    initializeEditor();
  }, [initializeEditor]);

  // Enhanced formatting handlers
  const handleFormatChange = (property, value) => {
    setFormatting(prev => ({ ...prev, [property]: value }));
  };

  const handleColorChange = (color, type) => {
    if (type === 'text') {
      setTextColor(color);
      handleFormatChange('color', color);
    } else {
      setBackgroundColor(color);
      handleFormatChange('backgroundColor', color);
    }
    setColorPickerAnchor(null);
  };

  const openColorPicker = (event, type) => {
    setColorPickerAnchor(event.currentTarget);
    setColorType(type);
  };

  // Enhanced save functionality
  const handleSave = () => {
    const enhancedContent = {
      text: editedContent,
      formatting: formatting,
      shapes: shapes,
      canvasBackground: canvasBackground,
      timestamp: new Date().toISOString()
    };
    onSave(JSON.stringify(enhancedContent));
    onClose();
  };

  // History management
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditedContent(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditedContent(history[newIndex]);
    }
  };

  const handleContentChange = (newContent) => {
    setEditedContent(newContent);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // FIXED: Removed unused insertText function to eliminate the warning

  // Chart data manipulation functions
  const addChartDataPoint = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = months[chartData.length % 12];
    const newDataPoint = {
      name: currentMonth,
      revenue: Math.floor(Math.random() * 10000) + 1000,
      expenses: Math.floor(Math.random() * 5000) + 500,
      profit: 0
    };
    newDataPoint.profit = newDataPoint.revenue - newDataPoint.expenses;
    
    setChartData(prev => [...prev, newDataPoint]);
  };

  const addTableRow = () => {
    const newRow = {
      id: tableData.length + 1,
      product: `Product ${tableData.length + 1}`,
      sales: Math.floor(Math.random() * 300) + 50,
      growth: Math.floor(Math.random() * 30) + 1
    };
    setTableData(prev => [...prev, newRow]);
  };

  // Canvas drawing functionality
    const startDrawing = (shapeType) => {
      console.log('Start drawing called with:', shapeType);
      setSelectedTool(shapeType);
      setIsDrawing(true);
      
      // Create a new shape with pure ID
      const newShapeId = shapeIdCounter;
      setShapeIdCounter(prev => prev + 1);
      
      const newShape = {
        type: shapeType,
        id: newShapeId,
        x: 50,
        y: 50,
        width: shapeType === 'line' ? 100 : 150,
        height: shapeType === 'line' ? 5 : 100,
        color: textColor,
        strokeWidth: 2,
        text: shapeType === 'text' ? 'New Text' : ''
      };
      
      console.log('Auto-created shape:', newShape);
      setCurrentShape(newShape);
      setShapes(prev => [...prev, newShape]);
    };

  const removeShape = (shapeId) => {
    setShapes(prev => prev.filter(shape => shape.id !== shapeId));
    if (currentShape && currentShape.id === shapeId) {
      setCurrentShape(null);
    }
  };

  // Canvas background change
  const handleCanvasBackgroundChange = (color) => {
    setCanvasBackground(color);
  };

  // Drawing on canvas
  const handleCanvasMouseDown = (e) => {
    console.log('Canvas clicked, selected tool:', selectedTool);
    
    if (!selectedTool || selectedTool === 'select') {
      console.log('No drawing tool selected or select tool active');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref not found');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('Creating shape at:', { x, y }, 'type:', selectedTool);

    const newShapeId = shapeIdCounter;
    setShapeIdCounter(prev => prev + 1);

    const newShape = {
      type: selectedTool,
      id: newShapeId,
      x: x,
      y: y,
      width: selectedTool === 'line' ? 100 : 150,
      height: selectedTool === 'line' ? 5 : 100,
      color: textColor,
      strokeWidth: 2,
      text: selectedTool === 'text' ? 'New Text' : ''
    };

    console.log('New shape created:', newShape);
    setCurrentShape(newShape);
    setShapes(prev => [...prev, newShape]);
    setIsDrawing(true);
  };

  // Render shapes on canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw shapes
    shapes.forEach(shape => {
      ctx.fillStyle = shape.color;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;

      switch (shape.type) {
        case 'rectangle':
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(shape.x, shape.y);
          ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
          ctx.stroke();
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(shape.x + shape.width / 2, shape.y);
          ctx.lineTo(shape.x, shape.y + shape.height);
          ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
          ctx.closePath();
          ctx.stroke();
          break;
        case 'text':
          ctx.fillStyle = shape.color;
          ctx.font = `${formatting.fontSize}px ${formatting.fontFamily}`;
          ctx.fillText(shape.text || 'Text', shape.x, shape.y);
          break;
        default:
          break;
      }
    });
  }, [shapes, canvasBackground, formatting.fontSize, formatting.fontFamily]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Document type color function
  const getDocumentTypeColor = () => {
    const colors = {
      receipt: '#48BB78',
      resume: '#4299E1',
      id_card: '#ED8936',
      document: '#9F7AEA',
      book: '#A0AEC0',
      translation: '#F56565',
      price_tag: '#38B2AC',
      package: '#718096',
      medicine: '#FC8181',
      handwriting: '#68D391'
    };
    return colors[documentType] || '#667eea';
  };

  // Export handler
  const handleExport = (format) => {
    if (!format) {
      console.error("handleExport called without a valid format.");
      return;
    }

    let blob = null;
    let filename = null;
    let htmlContent = "";

    try {
      switch (format) {
        case "pdf": {
          const contentToExport = {
            text: editedContent ?? "",
            formatting: formatting ?? {},
            shapes: shapes ?? [],
            timestamp: new Date().toISOString(),
          };

          blob = new Blob([JSON.stringify(contentToExport, null, 2)], {
            type: "application/json",
          });
          filename = `document-${Date.now()}.json`;
          break;
        }

        case "html": {
          const safeContent = (editedContent || "")
            .replace(/\n/g, "<br>")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exported Document</title>
  <style>
    body {
      font-family: ${formatting?.fontFamily || "Arial"};
      font-size: ${formatting?.fontSize || 16}px;
      color: ${formatting?.color || "#000"};
      background-color: ${formatting?.backgroundColor || "#fff"};
      line-height: ${formatting?.lineHeight || 1.5};
    }
    .content {
      white-space: normal;
    }
  </style>
</head>
<body>
  <div class="content">${safeContent}</div>
</body>
</html>
        `.trim();

          blob = new Blob([htmlContent], { type: "text/html" });
          filename = `document-${Date.now()}.html`;
          break;
        }

        default: {
          const defaultContent = {
            text: editedContent ?? "",
            formatting: formatting ?? {},
            shapes: shapes ?? [],
            timestamp: new Date().toISOString(),
          };

          blob = new Blob([JSON.stringify(defaultContent, null, 2)], {
            type: "application/json",
          });
          filename = `document-${Date.now()}.json`;
          break;
        }
      }

      // Trigger File Download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error("Error generating export:", err);
    }
  };

  // Enhanced formatting toolbar
// Enhanced formatting toolbar with dark theme and maximize button
const FormattingToolbar = () => (
  <Box sx={{ 
    p: 2, 
    borderBottom: '1px solid #4A5568', 
    backgroundColor: '#1A202C',
    color: 'white',
    boxShadow: '0 2px 20px rgba(0,0,0,0.3)'
  }}>
    <Grid container spacing={2} alignItems="center">
      {/* Font Controls */}
      <Grid item xs={12} md={3}>
        <FormControl fullWidth size="small" sx={{ 
          backgroundColor: '#2D3748', 
          borderRadius: 1,
          '& .MuiInputLabel-root': { color: '#CBD5E0' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#4A5568' },
            '&:hover fieldset': { borderColor: '#667eea' },
            '&.Mui-focused fieldset': { borderColor: '#667eea' }
          },
          '& .MuiSelect-select': { color: 'white' }
        }}>
          <InputLabel sx={{ color: '#CBD5E0', fontWeight: 600 }}>Font Family</InputLabel>
          <Select
            value={formatting.fontFamily}
            onChange={(e) => handleFormatChange('fontFamily', e.target.value)}
            sx={{ fontSize: '0.875rem', color: 'white' }}
            label="Font Family"
          >
            {fontFamilies.map(font => (
              <MenuItem key={font} value={font} style={{ fontFamily: font, color: 'white', backgroundColor: '#2D3748' }}>
                {font}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Font Size */}
      <Grid item xs={6} md={2}>
        <FormControl fullWidth size="small" sx={{ 
          backgroundColor: '#2D3748', 
          borderRadius: 1,
          '& .MuiInputLabel-root': { color: '#CBD5E0' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#4A5568' },
            '&:hover fieldset': { borderColor: '#667eea' },
            '&.Mui-focused fieldset': { borderColor: '#667eea' }
          },
          '& .MuiSelect-select': { color: 'white' }
        }}>
          <InputLabel sx={{ color: '#CBD5E0', fontWeight: 600 }}>Font Size</InputLabel>
          <Select
            value={formatting.fontSize}
            onChange={(e) => handleFormatChange('fontSize', e.target.value)}
            sx={{ fontSize: '0.875rem', color: 'white' }}
            label="Font Size"
          >
            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
              <MenuItem key={size} value={size} sx={{ color: 'white', backgroundColor: '#2D3748' }}>
                {size}px
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Color Controls */}
      <Grid item xs={6} md={2}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Text Color">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                onClick={(e) => openColorPicker(e, 'text')}
                sx={{ 
                  backgroundColor: '#2D3748',
                  border: `2px solid ${textColor}`,
                  '&:hover': { backgroundColor: '#4A5568' }
                }}
              >
                <FormatColorText sx={{ color: textColor }} />
              </IconButton>
              <Typography variant="caption" sx={{ color: '#CBD5E0', mt: 0.5, fontSize: '0.7rem' }}>
                Text
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Background Color">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                onClick={(e) => openColorPicker(e, 'background')}
                sx={{ 
                  backgroundColor: '#2D3748',
                  border: `2px solid ${backgroundColor}`,
                  '&:hover': { backgroundColor: '#4A5568' }
                }}
              >
                <FormatColorFill sx={{ color: backgroundColor }} />
              </IconButton>
              <Typography variant="caption" sx={{ color: '#CBD5E0', mt: 0.5, fontSize: '0.7rem' }}>
                Background
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Canvas Background">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                onClick={(e) => openColorPicker(e, 'canvas')}
                sx={{ 
                  backgroundColor: '#2D3748',
                  border: `2px solid ${canvasBackground}`,
                  '&:hover': { backgroundColor: '#4A5568' }
                }}
              >
                <Palette sx={{ color: canvasBackground }} />
              </IconButton>
              <Typography variant="caption" sx={{ color: '#CBD5E0', mt: 0.5, fontSize: '0.7rem' }}>
                Canvas
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>

      {/* Window Controls */}
      <Grid item xs={12} md={2}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title={editorWindow.isMaximized ? "Restore Window" : "Maximize Window"}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton 
                size="small" 
                onClick={handleMaximizeToggle}
                sx={{ 
                  backgroundColor: '#2D3748',
                  color: '#667eea',
                  '&:hover': { backgroundColor: '#4A5568' }
                }}
              >
                {editorWindow.isMaximized ? <Crop /> : <CropFree />}
              </IconButton>
              <Typography variant="caption" sx={{ color: '#CBD5E0', mt: 0.5, fontSize: '0.7rem' }}>
                {editorWindow.isMaximized ? "Restore" : "Maximize"}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Grid>

      {/* Export Controls */}
      <Grid item xs={12} md={2}>
        <FormControl fullWidth size="small" sx={{ 
          backgroundColor: '#2D3748', 
          borderRadius: 1,
          '& .MuiInputLabel-root': { color: '#CBD5E0' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#4A5568' },
            '&:hover fieldset': { borderColor: '#667eea' },
            '&.Mui-focused fieldset': { borderColor: '#667eea' }
          },
          '& .MuiSelect-select': { color: 'white' }
        }}>
          <InputLabel sx={{ color: '#CBD5E0', fontWeight: 600 }}>Export Format</InputLabel>
          <Select
            value=""
            onChange={(e) => handleExport(e.target.value)}
            sx={{ fontSize: '0.875rem', color: 'white' }}
            label="Export Format"
          >
            <MenuItem value="pdf" sx={{ color: 'white', backgroundColor: '#2D3748' }}>Export as PDF</MenuItem>
            <MenuItem value="html" sx={{ color: 'white', backgroundColor: '#2D3748' }}>Export as HTML</MenuItem>
            <MenuItem value="json" sx={{ color: 'white', backgroundColor: '#2D3748' }}>Export as JSON</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Text Formatting */}
      <Grid item xs={12} md={3}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ToggleButtonGroup
              size="small"
              value={[
                ...(formatting.bold ? ['bold'] : []),
                ...(formatting.italic ? ['italic'] : []),
                ...(formatting.underline ? ['underline'] : [])
              ]}
              onChange={(e, newFormats) => {
                setFormatting(prev => ({
                  ...prev,
                  bold: newFormats.includes('bold'),
                  italic: newFormats.includes('italic'),
                  underline: newFormats.includes('underline')
                }));
              }}
              sx={{ 
                backgroundColor: '#2D3748', 
                borderRadius: 1,
                '& .MuiToggleButton-root': {
                  color: '#CBD5E0',
                  borderColor: '#4A5568',
                  '&.Mui-selected': {
                    backgroundColor: '#667eea',
                    color: 'white'
                  },
                  '&:hover': {
                    backgroundColor: '#4A5568'
                  }
                }
              }}
            >
              <ToggleButton value="bold" title="Bold">
                <FormatBold fontSize="small" />
              </ToggleButton>
              <ToggleButton value="italic" title="Italic">
                <FormatItalic fontSize="small" />
              </ToggleButton>
              <ToggleButton value="underline" title="Underline">
                <FormatUnderlined fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ color: '#CBD5E0', mt: 0.5, fontSize: '0.7rem' }}>
              Format
            </Typography>
          </Box>

          {/* Alignment */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={formatting.alignment}
              onChange={(e, value) => handleFormatChange('alignment', value)}
              sx={{ 
                backgroundColor: '#2D3748', 
                borderRadius: 1,
                '& .MuiToggleButton-root': {
                  color: '#CBD5E0',
                  borderColor: '#4A5568',
                  '&.Mui-selected': {
                    backgroundColor: '#667eea',
                    color: 'white'
                  },
                  '&:hover': {
                    backgroundColor: '#4A5568'
                  }
                }
              }}
            >
              <ToggleButton value="left" title="Align Left">
                <FormatAlignLeft fontSize="small" />
              </ToggleButton>
              <ToggleButton value="center" title="Align Center">
                <FormatAlignCenter fontSize="small" />
              </ToggleButton>
              <ToggleButton value="right" title="Align Right">
                <FormatAlignRight fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" sx={{ color: '#CBD5E0', mt: 0.5, fontSize: '0.7rem' }}>
              Alignment
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  </Box>
);

  // Canvas Drawing Component
  const CanvasDrawingArea = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>
        Canvas Drawing Area
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">
          Background: 
        </Typography>
        <Box
          sx={{
            width: 30,
            height: 30,
            backgroundColor: canvasBackground,
            border: '2px solid #E2E8F0',
            borderRadius: 1,
            cursor: 'pointer'
          }}
          onClick={(e) => openColorPicker(e, 'canvas')}
        />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Selected: {selectedTool || 'None'}
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          Shapes: {shapes.length}
        </Typography>
      </Box>

      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          backgroundColor: '#F7FAFC',
          border: `2px dashed ${getDocumentTypeColor()}`,
          borderRadius: 2
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleCanvasMouseDown}
          style={{
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            backgroundColor: canvasBackground,
            cursor: isDrawing ? 'crosshair' : 'default',
            maxWidth: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        />
      </Paper>

      {shapes.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Shapes ({shapes.length})
          </Typography>
          <Grid container spacing={1}>
            {shapes.map(shape => (
              <Grid item xs={6} md={4} key={shape.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    p: 1,
                    backgroundColor: shape.id === currentShape?.id ? '#EBF8FF' : 'white'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {shape.type} 
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => removeShape(shape.id)}
                      color="error"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );

 // Enhanced text editor with resizable and maximizable editor area
const renderTextEditor = () => (
  <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
      position: 'relative',
      width: '100vw'
  }}>
    <FormattingToolbar />
    
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
       overflow: 'auto',
      position: 'relative'
    }}>
      {/* Design Tools Sidebar - Left Side */}
      {!isMobile && (
        <Paper 
          elevation={4}
          sx={{ 
            width: sidebarCollapsed ? 60 : 320,
            minWidth: sidebarCollapsed ? 60 : 320,
            backgroundColor: '#2D3748',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            borderRight: '2px solid #4A5568',
            overflow: 'auto',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Collapse Toggle Button */}
          <Box sx={{ 
            p: 1, 
            borderBottom: '1px solid #4A5568',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1A202C'
          }}>
            {!sidebarCollapsed && (
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: 'white',
                fontSize: '0.9rem'
              }}>
                Design Tools
              </Typography>
            )}
            <IconButton 
              size="small"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              sx={{ 
                color: 'white',
                backgroundColor: '#4A5568',
                '&:hover': { backgroundColor: '#718096' }
              }}
            >
              {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Box>

          {/* Sidebar Content */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            p: sidebarCollapsed ? 1 : 2,
            display: sidebarCollapsed ? 'flex' : 'block',
            flexDirection: sidebarCollapsed ? 'column' : 'row',
            alignItems: sidebarCollapsed ? 'center' : 'flex-start',
            gap: sidebarCollapsed ? 1 : 2
          }}>
            
            {/* Shape Tools - Always visible, compact when collapsed */}
            {sidebarCollapsed ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { icon: <Rectangle />, tool: 'rectangle', label: 'Rectangle' },
                  { icon: <Circle />, tool: 'circle', label: 'Circle' },
                  { icon: <ChangeHistory />, tool: 'triangle', label: 'Triangle' },
                  { icon: <HorizontalRule />, tool: 'line', label: 'Line' },
                  { icon: <TextFormat />, tool: 'text', label: 'Text' }
                ].map((item) => (
                  <Tooltip key={item.tool} title={item.label} placement="right">
                    <IconButton
                      size="small"
                      onClick={() => startDrawing(item.tool)}
                      sx={{
                        border: selectedTool === item.tool ? '2px solid #667eea' : '1px solid #4A5568',
                        borderRadius: 1,
                        color: 'white',
                        backgroundColor: selectedTool === item.tool ? '#667eea' : 'transparent',
                        '&:hover': { backgroundColor: '#4A5568' }
                      }}
                    >
                      {item.icon}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
            ) : (
              <>
                {/* Shape Tools - Expanded */}
              <Accordion 
                defaultExpanded 
                sx={{ 
                  backgroundColor: '#4A5568',
                  color: 'white',
                  boxShadow: 'none',
                  border: '1px solid #718096',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                  sx={{ 
                    minHeight: 48,
                    '& .MuiAccordionSummary-content': { 
                      alignItems: 'center',
                      gap: 1 
                    }
                  }}
                >
                  <ShapeLine sx={{ color: '#667eea' }} />
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                    Shapes & Elements
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  backgroundColor: '#2D3748', 
                  borderTop: '1px solid #718096',
                  p: 1, // Reduced padding
                  maxHeight: '200px', // Reduced height
                  overflow: 'auto'
                }}>
                  <Grid container spacing={1}>
                    {[
                      { icon: <Rectangle />, tool: 'rectangle', label: 'Rectangle' },
                      { icon: <Circle />, tool: 'circle', label: 'Circle' },
                      { icon: <ChangeHistory />, tool: 'triangle', label: 'Triangle' },
                      { icon: <HorizontalRule />, tool: 'line', label: 'Line' },
                      { icon: <TextFormat />, tool: 'text', label: 'Text Box' }
                    ].map((item) => (
                      <Grid item xs={4} key={item.tool}>
                        <Tooltip title={item.label}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              console.log('Starting drawing:', item.tool);
                              startDrawing(item.tool);
                            }}
                            sx={{
                              border: selectedTool === item.tool ? '2px solid #667eea' : '1px solid #718096',
                              borderRadius: 2,
                              width: '100%',
                              height: 40,
                              color: 'white',
                              backgroundColor: selectedTool === item.tool ? '#667eea' : 'transparent',
                              '&:hover': { backgroundColor: '#4A5568' }
                            }}
                          >
                            {item.icon}
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Canvas Settings */}
              <Accordion sx={{ 
                backgroundColor: '#4A5568',
                color: 'white',
                boxShadow: 'none',
                border: '1px solid #718096',
                '&:before': { display: 'none' }
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                  sx={{ 
                    minHeight: 48,
                    '& .MuiAccordionSummary-content': { 
                      alignItems: 'center',
                      gap: 1 
                    }
                  }}
                >
                  <Palette sx={{ color: '#667eea' }} />
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                    Canvas Settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  backgroundColor: '#2D3748', 
                  borderTop: '1px solid #718096',
                  p: 1, // Reduced padding
                  maxHeight: '200px', // Reduced height
                  overflow: 'auto'
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}> {/* Reduced gap */}
                    <Box>
                      <Typography variant="caption" display="block" gutterBottom sx={{ color: '#CBD5E0', fontWeight: 600 }}>
                        Background Color
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}> {/* Reduced gap */}
                        {['#FFFFFF', '#F7FAFC', '#EDF2F7', '#E2E8F0', '#667eea', '#764ba2'].map(color => (
                          <Box
                            key={color}
                            sx={{
                              width: 25, // Smaller
                              height: 25, // Smaller
                              backgroundColor: color,
                              borderRadius: 1,
                              cursor: 'pointer',
                              border: color === canvasBackground ? '2px solid #fff' : '1px solid #718096',
                              '&:hover': { 
                                transform: 'scale(1.1)',
                                boxShadow: '0 2px 8px rgba(255,255,255,0.3)'
                              }
                            }}
                            onClick={() => {
                              console.log('Changing canvas background to:', color);
                              handleCanvasBackgroundChange(color);
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" display="block" gutterBottom sx={{ color: '#CBD5E0', fontWeight: 600 }}>
                        Canvas Size: {canvasSize.width}px
                      </Typography>
                      <Slider
                        value={canvasSize.width}
                        onChange={(e, newValue) => {
                          console.log('Changing canvas size to:', newValue);
                          setCanvasSize(prev => ({ ...prev, width: newValue }));
                        }}
                        min={400}
                        max={1200}
                        step={50}
                        sx={{
                          color: '#667eea',
                          '& .MuiSlider-track': { backgroundColor: '#667eea' },
                          '& .MuiSlider-thumb': { backgroundColor: '#667eea' }
                        }}
                      />
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Quick Actions */}
              <Accordion sx={{ 
                backgroundColor: '#4A5568',
                color: 'white',
                boxShadow: 'none',
                border: '1px solid #718096',
                '&:before': { display: 'none' }
              }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                  sx={{ 
                    minHeight: 48,
                    '& .MuiAccordionSummary-content': { 
                      alignItems: 'center',
                      gap: 1 
                    }
                  }}
                >
                  <AutoAwesome sx={{ color: '#667eea' }} />
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                    Quick Actions
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ 
                  backgroundColor: '#2D3748', 
                  borderTop: '1px solid #718096',
                  p: 1, // Reduced padding
                  maxHeight: '150px', // Reduced height
                  overflow: 'auto'
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}> {/* Reduced gap */}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        console.log('Clearing all shapes');
                        setShapes([]);
                      }}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none',
                        color: 'white',
                        borderColor: '#718096',
                        fontSize: '0.75rem', // Smaller font
                        minHeight: '32px', // Smaller height
                        '&:hover': { 
                          borderColor: '#667eea',
                          backgroundColor: 'rgba(102, 126, 234, 0.1)'
                        }
                      }}
                    >
                      Clear All Shapes
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        console.log('Setting select tool');
                        setSelectedTool('select');
                      }}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none',
                        color: 'white',
                        borderColor: '#718096',
                        fontSize: '0.75rem', // Smaller font
                        minHeight: '32px', // Smaller height
                        '&:hover': { 
                          borderColor: '#667eea',
                          backgroundColor: 'rgba(102, 126, 234, 0.1)'
                        }
                      }}
                    >
                      Select Tool
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        console.log('Refreshing canvas');
                        renderCanvas();
                      }}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none',
                        color: 'white',
                        borderColor: '#718096',
                        fontSize: '0.75rem', // Smaller font
                        minHeight: '32px', // Smaller height
                        '&:hover': { 
                          borderColor: '#667eea',
                          backgroundColor: 'rgba(102, 126, 234, 0.1)'
                        }
                      }}
                    >
                      Refresh Canvas
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Document Stats */}
              <Card sx={{ 
                backgroundColor: '#4A5568', 
                border: '1px solid #718096',
                color: 'white'
              }}>
                <CardContent sx={{ p: 1.5 }}> {/* Reduced padding */}
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#CBD5E0', fontWeight: 600, fontSize: '0.8rem' }}>
                    Document Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}> {/* Reduced gap */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#CBD5E0', fontSize: '0.7rem' }}>Words:</Typography>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: 'white', fontSize: '0.7rem' }}>
                        {editedContent.split(/\s+/).filter(word => word.length > 0).length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#CBD5E0', fontSize: '0.7rem' }}>Characters:</Typography>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: 'white', fontSize: '0.7rem' }}>
                        {editedContent.length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#CBD5E0', fontSize: '0.7rem' }}>Shapes:</Typography>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: 'white', fontSize: '0.7rem' }}>
                        {shapes.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Main Editor Container - Now resizable and maximizable */}
      <Box 
         className="editor-container"
          sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 0,
           overflow: 'auto',
          backgroundColor: '#1A202C',
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '100%' // ADD THIS LINE
          }}
      >
        {/* Resizable Editor Window */}
        <Box
          sx={{
             width: '100%', // CHANGE TO 100%
            height: '100%', // CHANGE TO 100%
            minWidth: '100%', // CHANGE TO 100%
            minHeight: '100%', // CHANGE TO 100%
            maxWidth: '100%',
            maxHeight: '100%',
            position: 'relative', // CHANGE TO RELATIVE
            zIndex: 5,
            transition: editorWindow.isResizing ? 'none' : 'all 0.2s ease',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            borderRadius: 2,
             overflow: 'auto',
            border: '2px solid #4A5568',
            cursor: 'default'
          }}
        >
          <Paper 
            elevation={8}
            sx={{ 
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: editorWindow.isMaximized ? 0 : 2,
              backgroundColor: formatting.backgroundColor,
              background: `linear-gradient(45deg, ${formatting.backgroundColor} 0%, ${formatting.backgroundColor}dd 100%)`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              position: 'relative',
               overflow: 'auto',
              '&::before': {
                content: '""',
                position: 'relative',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: '2px 2px 0 0'
              }
            }}
          >
            {/* Resize Handles */}
            {!editorWindow.isMaximized && (
              <>
                {/* Bottom Right Handle */}
                <Box
                  onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                  sx={{
                    position: 'relative',
                    bottom: 0,
                    right: 0,
                    width: 20,
                    height: 20,
                    cursor: 'nwse-resize',
                    backgroundColor: '#667eea',
                    borderTopLeftRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 12,
                    zIndex: 20,
                    '&:hover': {
                      backgroundColor: '#764ba2',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  ↙
                </Box>
                
                {/* Bottom Handle */}
                <Box
                  onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 10,
                    right: 10,
                    height: 10,
                    cursor: 'ns-resize',
                    zIndex: 15,
                    '&:hover': {
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 40,
                        height: 4,
                        backgroundColor: '#667eea',
                        borderRadius: 2
                      }
                    }
                  }}
                />
                
                {/* Right Handle */}
                <Box
                  onMouseDown={(e) => handleResizeStart(e, 'right')}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    bottom: 10,
                    right: 0,
                    width: 10,
                    cursor: 'ew-resize',
                    zIndex: 15,
                    '&:hover': {
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: 40,
                        backgroundColor: '#667eea',
                        borderRadius: 2
                      }
                    }
                  }}
                />
              </>
            )}

       {/* Editor Content */}
        <textarea
          ref={editorRef}
          value={editedContent}
          onChange={(e) => handleContentChange(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: formatting.fontFamily,
            fontSize: `${formatting.fontSize}px`,
            fontWeight: formatting.bold ? 'bold' : 'normal',
            fontStyle: formatting.italic ? 'italic' : 'normal',
            textDecoration: formatting.underline ? 'underline' : 'none',
            color: formatting.color,
            textAlign: formatting.alignment,
            lineHeight: `${formatting.lineHeight}`,
            backgroundColor: 'transparent',
            padding: '32px',
            boxSizing: 'border-box',
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
            backgroundSize: '100% 1.6em',
            backgroundPositionY: '32px',
            // ADD THESE FOR HORIZONTAL SCROLLING:
            overflowX: 'auto', // Enable horizontal scrolling
            overflowY: 'auto', // Keep vertical scrolling
            whiteSpace: 'pre', // Preserve whitespace and line breaks
            wordWrap: 'normal', // Don't wrap words
            overflowWrap: 'normal' // Don't break words
          }}
          placeholder="Start writing your document... Use the design tools on the left to add shapes and customize your canvas. Drag the edges to resize or use maximize button for fullscreen editing."
        />
          </Paper>
        </Box>

        {/* Canvas Drawing Area for Mobile */}
        {isMobile && activeTab === 0 && (
          <CanvasDrawingArea />
        )}
      </Box>
    </Box>

    {/* Floating Action Buttons for Mobile */}
    {isMobile && (
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Fab
          color="primary"
          size="medium"
          onClick={() => setSelectedTool('text')}
          sx={{ boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)' }}
        >
          <TextFormat />
        </Fab>
        <Fab
          color="secondary"
          size="medium"
          onClick={() => setSelectedTool('rectangle')}
          sx={{ boxShadow: '0 4px 20px rgba(118, 75, 162, 0.3)' }}
        >
          <ShapeLine />
        </Fab>
      </Box>
    )}
  </Box>
);

  // Chart rendering function
  const renderCharts = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Chart Controls */}
      <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
            Chart Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={addChartDataPoint}
              startIcon={<Add />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Add Data Point
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setChartData(sampleChartData)}
              startIcon={<Refresh />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Reset Data
            </Button>
          </Box>
        </Box>

        {/* Bar Chart */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
          Monthly Revenue Analysis
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" stroke="#4A5568" />
            <YAxis stroke="#4A5568" />
            <ChartTooltip 
              contentStyle={{ 
                borderRadius: 8, 
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }} 
            />
            <Legend />
            <Bar dataKey="revenue" fill="#667eea" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#764ba2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#f093fb" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );

  // Table rendering function
  const renderTables = () => (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#2D3748' }}>
            Sales Performance
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={addTableRow}
            startIcon={<Add />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add Row
          </Button>
        </Box>
        <Box sx={{ overflow: 'auto', borderRadius: 2 }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            borderRadius: 8,
             overflow: 'auto',
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#667eea', 
                color: 'white',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <th style={{ padding: '16px', textAlign: 'left', border: '1px solid #E2E8F0', fontWeight: 600 }}>Product</th>
                <th style={{ padding: '16px', textAlign: 'left', border: '1px solid #E2E8F0', fontWeight: 600 }}>Sales</th>
                <th style={{ padding: '16px', textAlign: 'left', border: '1px solid #E2E8F0', fontWeight: 600 }}>Growth %</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.id} style={{ 
                  borderBottom: '1px solid #E2E8F0',
                  backgroundColor: row.id % 2 === 0 ? '#F7FAFC' : 'white'
                }}>
                  <td style={{ padding: '16px', border: '1px solid #E2E8F0', fontWeight: 500 }}>{row.product}</td>
                  <td style={{ padding: '16px', border: '1px solid #E2E8F0' }}>${row.sales}K</td>
                  <td style={{ padding: '16px', border: '1px solid #E2E8F0' }}>{row.growth}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Box>
  );

  // Analysis rendering function
  const renderAnalysis = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Key Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          backgroundColor: '#e8f5e8',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #C6F6D5 0%, #9AE6B4 100%)'
        }}>
          <Typography variant="h4" color="success.main" fontWeight="bold">
            ${chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
            Total Revenue
          </Typography>
        </Paper>
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          backgroundColor: '#e3f2fd',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #BEE3F8 0%, #90CDF4 100%)'
        }}>
          <Typography variant="h4" color="primary.main" fontWeight="bold">
            {((chartData[chartData.length - 1]?.revenue - chartData[0]?.revenue) / chartData[0]?.revenue * 100 || 0).toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
            Growth Rate
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  // Enhanced tabs with better styling
  const tabContent = [
    { 
      label: 'Document Editor', 
      icon: <TextFields />, 
      content: renderTextEditor(),
      description: 'Write and design your document with advanced formatting'
    },
    { 
      label: 'Charts & Analytics', 
      icon: <BarChart />, 
      content: renderCharts(),
      description: 'Visualize data with interactive charts'
    },
    { 
      label: 'Data Tables', 
      icon: <TableRows />, 
      content: renderTables(),
      description: 'Manage and analyze tabular data'
    },
    { 
      label: 'AI Analysis', 
      icon: <Analytics />, 
      content: renderAnalysis(),
      description: 'Get AI-powered insights and recommendations'
    },
  ];

  return (
    <Dialog 
       open={open} 
      onClose={onClose} 
      maxWidth="false"
      fullWidth
      fullScreen={fullScreen}
      sx={{
        '& .MuiDialog-paper': {
          height: '100vh', // Full viewport height
          maxHeight: fullScreen ? '100vh' : '95vh',
          borderRadius: fullScreen ? 0 : 3,
           overflow: 'auto',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      }}
    >
      {/* Enhanced Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoAwesome sx={{ fontSize: 32 }} />
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #FFFFFF, #E2E8F0)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Document Design Studio
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                Professional document creation with AI-powered tools
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={documentType?.replace('_', ' ').toUpperCase() || 'DOCUMENT'} 
              size="medium"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }}
            />
            {aiResults && (
              <Chip 
                icon={<Psychology />}
                label="AI Enhanced" 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)'
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ 
        p: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        backgroundColor: '#F7FAFC',
         overflow: 'auto',
      }}>
        {/* Enhanced Navigation */}
        <Paper 
          elevation={2}
          sx={{ 
            p: 1,
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: 'white',
            border: 'none'
          }}
        >
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} md={8}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    minHeight: 48,
                    color: '#4A5568',
                    '&.Mui-selected': {
                      color: '#667eea',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#667eea',
                    height: 3,
                    borderRadius: '2px 2px 0 0'
                  }
                }}
              >
                {tabContent.map((tab, index) => (
                  <Tab 
                    key={index}
                    icon={tab.icon}
                    label={isMobile ? '' : tab.label}
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                ))}
              </Tabs>
            </Grid>

            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Tooltip title="Undo">
                <IconButton 
                  size="small" 
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  sx={{ 
                    backgroundColor: '#F7FAFC',
                    '&:hover': { backgroundColor: '#EDF2F7' }
                  }}
                >
                  <Undo fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Redo">
                <IconButton 
                  size="small" 
                  onClick={handleRedo}
                  disabled={historyIndex === history.length - 1}
                  sx={{ 
                    backgroundColor: '#F7FAFC',
                    '&:hover': { backgroundColor: '#EDF2F7' }
                  }}
                >
                  <Redo fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem />
              
              <Tooltip title="Zoom Out">
                <IconButton 
                  size="small" 
                  onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                  sx={{ 
                    backgroundColor: '#F7FAFC',
                    '&:hover': { backgroundColor: '#EDF2F7' }
                  }}
                >
                  <ZoomOut fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ 
                minWidth: 45, 
                textAlign: 'center', 
                lineHeight: '40px',
                fontWeight: 600,
                color: '#4A5568'
              }}>
                {zoom}%
              </Typography>
              <Tooltip title="Zoom In">
                <IconButton 
                  size="small" 
                  onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                  sx={{ 
                    backgroundColor: '#F7FAFC',
                    '&:hover': { backgroundColor: '#EDF2F7' }
                  }}
                >
                  <ZoomIn fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Content Area */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
           overflow: 'auto',
          transform: activeTab === 0 ? `scale(${zoom / 100})` : 'none',
          transformOrigin: 'top left',
          width: activeTab === 0 ? `${100 * (100 / zoom)}%` : '100%',
          height: activeTab === 0 ? `${100 * (100 / zoom)}%` : '100%'
        }}>
          {tabContent[activeTab].content}
        </Box>
      </DialogContent>
     
     {/* Enhanced Footer - Reduced Height */}
      <DialogActions sx={{ 
        p: 1, // Reduced from p: 3
        borderTop: '1px solid #E2E8F0',
        backgroundColor: 'white',
        minHeight: '60px' // Fixed height
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="#718096" sx={{ fontWeight: 500 }}>
              {tabContent[activeTab].label} • Auto-saved: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}> {/* Reduced gap from 2 to 1 */}
            <Button 
              onClick={onClose} 
              startIcon={<Close />}
              size="small" // Added small size
              sx={{ 
                color: '#718096',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#F7FAFC' }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              startIcon={<Save />}
              size="small" // Added small size
              sx={{ 
                minWidth: 120, // Reduced from 140
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Save Document
            </Button>
          </Box>
        </Box>
      </DialogActions>

      {/* Color Picker - FIXED: Now using external component */}
      <ColorPickerPopover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={() => setColorPickerAnchor(null)}
        colorType={colorType}
        onColorChange={handleColorChange}
        onCanvasBackgroundChange={handleCanvasBackgroundChange}
      />
    </Dialog>
  );
};

export default TextEditor;