import React, { useCallback } from 'react';
import { ELEMENT_TYPES, ELEMENT_DEFAULTS } from '../utils/elementTypes';

/**
 * Comprehensive element converter utility for PDF Editor
 * Converts element definitions to Konva-compatible formats
 */

// =================== SHAPE DRAWERS ===================

const shapeDrawers = {
  heart: (context, shape) => {
    const width = shape.width();
    const height = shape.height();
    context.beginPath();
    context.moveTo(width / 2, height / 4);
    context.bezierCurveTo(width / 2, 0, 0, height / 3, 0, height / 2);
    context.bezierCurveTo(0, height * 0.75, width / 2, height, width / 2, height);
    context.bezierCurveTo(width / 2, height, width, height * 0.75, width, height / 2);
    context.bezierCurveTo(width, height / 3, width / 2, 0, width / 2, height / 4);
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  cloud: (context, shape) => {
    const width = shape.width();
    const height = shape.height();
    const cloudiness = shape.getAttr('cloudiness') || 5;
    context.beginPath();
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;
    
    for (let i = 0; i < cloudiness; i++) {
      const angle = (i * 2 * Math.PI) / cloudiness;
      const radius = maxRadius * (0.6 + Math.random() * 0.4);
      const x = centerX + Math.cos(angle) * radius * 0.5;
      const y = centerY + Math.sin(angle) * radius * 0.5;
      if (i === 0) context.moveTo(x + radius, y);
      context.arc(x, y, radius, 0, Math.PI * 2);
    }
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  gear: (context, shape) => {
    const width = shape.width();
    const height = shape.height();
    const teeth = shape.getAttr('teeth') || 12;
    const innerRadius = shape.getAttr('innerRadius') || Math.min(width, height) * 0.3;
    const outerRadius = shape.getAttr('outerRadius') || Math.min(width, height) * 0.45;
    
    context.beginPath();
    for (let i = 0; i < teeth; i++) {
      const angle = (i * 2 * Math.PI) / teeth;
      const nextAngle = ((i + 1) * 2 * Math.PI) / teeth;
      const innerX = width / 2 + innerRadius * Math.cos(angle);
      const innerY = height / 2 + innerRadius * Math.sin(angle);
      const outerX = width / 2 + outerRadius * Math.cos(angle + Math.PI / teeth);
      const outerY = height / 2 + outerRadius * Math.sin(angle + Math.PI / teeth);
      const nextInnerX = width / 2 + innerRadius * Math.cos(nextAngle);
      const nextInnerY = height / 2 + innerRadius * Math.sin(nextAngle);
      
      if (i === 0) context.moveTo(innerX, innerY);
      context.lineTo(outerX, outerY);
      context.lineTo(nextInnerX, nextInnerY);
    }
    context.closePath();
    context.fillStrokeShape(shape);
  }
};

// =================== HELPER FUNCTIONS ===================

/**
 * Creates drag handlers for elements
 */
const createDragHandlers = (elementId, setElements) => ({
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

/**
 * Get layout-specific element defaults
 */
const getLayoutSpecificDefaults = (type, activeLayout) => {
  const layoutDefaults = {
    word: {
      [ELEMENT_TYPES.TEXT]: { fontSize: 12, fontFamily: 'Calibri' },
      [ELEMENT_TYPES.PARAGRAPH]: { fontSize: 11, fontFamily: 'Times New Roman' },
      [ELEMENT_TYPES.HEADING]: { fontSize: 16, fontWeight: 'bold' },
      [ELEMENT_TYPES.TABLE]: { showGrid: false },
      [ELEMENT_TYPES.STYLE]: { fontSize: 12, fontFamily: 'Arial' },
      [ELEMENT_TYPES.HYPERLINK]: { fontSize: 12, fill: '#3498db', underline: true },
    },
    powerpoint: {
      [ELEMENT_TYPES.SHAPE]: { fill: '#d24726', strokeWidth: 0 },
      [ELEMENT_TYPES.RECTANGLE]: { fill: '#d24726', cornerRadius: 4 },
      [ELEMENT_TYPES.CIRCLE]: { fill: '#2a9d8f' },
      [ELEMENT_TYPES.TRIANGLE]: { fill: '#e9c46a' },
      [ELEMENT_TYPES.STAR]: { fill: '#f1c40f' },
      [ELEMENT_TYPES.ARROW]: { stroke: '#3498db', strokeWidth: 3 },
      [ELEMENT_TYPES.SLIDE]: { fill: '#ffffff', stroke: '#cccccc' },
    },
    photoshop: {
      [ELEMENT_TYPES.SHAPE]: { stroke: '#2980b9' },
      [ELEMENT_TYPES.RECTANGLE]: { shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.3)' },
      [ELEMENT_TYPES.BRUSH]: { stroke: '#000000', strokeWidth: 5 },
      [ELEMENT_TYPES.PEN]: { stroke: '#000000', strokeWidth: 1 },
      [ELEMENT_TYPES.PENCIL]: { stroke: '#333333', strokeWidth: 2 },
      [ELEMENT_TYPES.HIGHLIGHTER]: { stroke: '#ffff00', strokeWidth: 10, opacity: 0.3 },
      [ELEMENT_TYPES.LAYER]: { opacity: 1, blendMode: 'normal' },
      [ELEMENT_TYPES.SMART_OBJECT]: { fill: '#2c3e50', stroke: '#3498db' },
    },
    excel: {
      [ELEMENT_TYPES.TABLE]: { showGrid: true, cellWidth: 80, cellHeight: 25 },
      [ELEMENT_TYPES.SPREADSHEET]: { rows: 10, columns: 5 },
      [ELEMENT_TYPES.CELL_RANGE]: { fill: '#f1f5f9', stroke: '#e2e8f0' },
      [ELEMENT_TYPES.FORMULA]: { fontSize: 12, fontFamily: 'Courier New', fill: '#2c3e50' },
      [ELEMENT_TYPES.CHART]: { width: 300, height: 200 },
      [ELEMENT_TYPES.PIVOT_TABLE]: { showGrid: true },
    }
  };
  
  return layoutDefaults[activeLayout]?.[type] || {};
};

/**
 * Merge element properties with defaults
 */
const mergeElementProperties = (element, activeLayout, selectedLayerId, setElements) => {
  const typeDefaults = ELEMENT_DEFAULTS[element.type] || {};
  const layoutDefaults = getLayoutSpecificDefaults(element.type, activeLayout);
  
  const merged = {
    ...typeDefaults,
    ...layoutDefaults,
    ...element,
    id: element.id || `${element.type}-${Date.now()}`,
    x: element.x || 50,
    y: element.y || 50,
    draggable: true,
    layerId: selectedLayerId,
    visible: true,
    ...createDragHandlers(element.id, setElements)
  };
  
  return merged;
};

/**
 * Create enhanced shape element with additional properties
 */
export const createEnhancedShapeElement = (docElement) => {
  const enhancedElement = { ...docElement };
  
  // Add enhanced shape properties if missing
  if (docElement.type === ELEMENT_TYPES.RECTANGLE || docElement.type === ELEMENT_TYPES.SHAPE) {
    enhancedElement.cornerRadius = docElement.cornerRadius || 0;
    enhancedElement.shadowEnabled = docElement.shadowEnabled || false;
    enhancedElement.gradient = docElement.gradient || null;
    enhancedElement.fillPatternImage = docElement.fillPatternImage || null;
  }
  
  // Add enhanced text properties
  if (docElement.type === ELEMENT_TYPES.TEXT || docElement.type === ELEMENT_TYPES.HEADING) {
    enhancedElement.textShadow = docElement.textShadow || false;
    enhancedElement.textStroke = docElement.textStroke || null;
    enhancedElement.textStrokeWidth = docElement.textStrokeWidth || 0;
    enhancedElement.letterSpacing = docElement.letterSpacing || 0;
    enhancedElement.lineHeight = docElement.lineHeight || 1.2;
  }
  
  return enhancedElement;
};

// =================== ELEMENT TYPE HANDLERS ===================

/**
 * Handle text-based elements
 */
const handleTextElement = (element, canvasSize, createTextInputForEditing) => {
  const merged = { ...element };
  
  return {
    ...merged,
    type: 'text',
    text: element.text || 'New Text',
    fontSize: element.fontSize || 12,
    fontFamily: element.fontFamily || 'Arial',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    fill: element.fill || '#000000',
    textAlign: element.textAlign || 'left',
    width: element.width || canvasSize.width - 100,
    onDblClick: (e) => {
      const node = e.target;
      createTextInputForEditing({
        id: element.id,
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
};

/**
 * Handle shape elements
 */
const handleShapeElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.RECTANGLE:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 100,
        height: element.height || 100,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1,
        cornerRadius: element.cornerRadius || 0
      };
      
    case ELEMENT_TYPES.CIRCLE:
      return {
        ...merged,
        type: 'circle',
        radius: element.radius || 50,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.ELLIPSE:
      return {
        ...merged,
        type: 'ellipse',
        radiusX: element.radiusX || 60,
        radiusY: element.radiusY || 40,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.LINE:
      return {
        ...merged,
        type: 'line',
        points: element.points || [0, 0, 100, 0],
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 2,
        lineCap: element.lineCap || 'butt',
        lineJoin: element.lineJoin || 'miter'
      };
      
    case ELEMENT_TYPES.ARROW:
      return {
        ...merged,
        type: 'arrow',
        points: element.points || [0, 0, 100, 0],
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 2,
        pointerLength: element.pointerLength || 10,
        pointerWidth: element.pointerWidth || 10
      };
      
    case ELEMENT_TYPES.TRIANGLE:
      return {
        ...merged,
        type: 'triangle',
        width: element.width || 80,
        height: element.height || 80,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.STAR:
      return {
        ...merged,
        type: 'star',
        numPoints: element.numPoints || 5,
        innerRadius: element.innerRadius || 20,
        outerRadius: element.outerRadius || 40,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.HEXAGON:
      return {
        ...merged,
        type: 'regularpolygon',
        sides: 6,
        radius: element.radius || 40,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.OCTAGON:
      return {
        ...merged,
        type: 'regularpolygon',
        sides: 8,
        radius: element.radius || 40,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.POLYGON:
      return {
        ...merged,
        type: 'regularpolygon',
        sides: element.sides || 5,
        radius: element.radius || 40,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.BORDER:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 100,
        height: element.height || 100,
        fill: 'transparent',
        stroke: element.borderColor || '#000000',
        strokeWidth: element.borderWidth || 1,
        dash: element.borderType === 'dashed' ? [5, 5] : 
              element.borderType === 'dotted' ? [2, 2] : [],
        cornerRadius: element.borderRadius || 0
      };
      
    default:
      return merged;
  }
};

/**
 * Handle special shapes (heart, cloud, gear, etc.)
 */
const handleSpecialShapeElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.HEART:
      return {
        ...merged,
        type: 'shape',
        sceneFunc: shapeDrawers.heart,
        width: element.width || 100,
        height: element.height || 100,
        fill: element.fill || '#e74c3c',
        stroke: element.stroke || '#c0392b',
        strokeWidth: element.strokeWidth || 1
      };
      
    case ELEMENT_TYPES.CLOUD:
      return {
        ...merged,
        type: 'shape',
        sceneFunc: shapeDrawers.cloud,
        width: element.width || 120,
        height: element.height || 80,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#ecf0f1',
        strokeWidth: element.strokeWidth || 2,
        cloudiness: element.cloudiness || 5
      };
      
    case ELEMENT_TYPES.GEAR:
      return {
        ...merged,
        type: 'shape',
        sceneFunc: shapeDrawers.gear,
        width: element.width || 100,
        height: element.height || 100,
        fill: element.fill || '#95a5a6',
        stroke: element.stroke || '#7f8c8d',
        strokeWidth: element.strokeWidth || 2,
        teeth: element.teeth || 12,
        innerRadius: element.innerRadius || 30,
        outerRadius: element.outerRadius || 50
      };
      
    case ELEMENT_TYPES.DIAMOND:
      return {
        ...merged,
        type: 'shape',
        width: element.width || 60,
        height: element.height || 60,
        fill: element.fill || '#9b59b6',
        stroke: element.stroke || '#8e44ad',
        strokeWidth: element.strokeWidth || 2,
        rotation: 45
      };
      
    case ELEMENT_TYPES.CROSS:
      return {
        ...merged,
        type: 'path',
        data: 'M 10,10 L 40,40 M 40,10 L 10,40',
        scaleX: (element.size || 40) / 50,
        scaleY: (element.size || 40) / 50,
        stroke: element.stroke || '#e74c3c',
        strokeWidth: element.strokeWidth || 3
      };
      
    case ELEMENT_TYPES.CHECKMARK:
      return {
        ...merged,
        type: 'path',
        data: 'M 10,25 L 20,35 L 40,15',
        scaleX: (element.size || 40) / 50,
        scaleY: (element.size || 40) / 50,
        stroke: element.stroke || '#2ecc71',
        strokeWidth: element.strokeWidth || 4
      };
      
    case ELEMENT_TYPES.SPEECH_BUBBLE:
      return {
        ...merged,
        type: 'group',
        width: element.width || 200,
        height: element.height || 100,
        text: element.text || 'Hello!',
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#cccccc',
        strokeWidth: 1,
        cornerRadius: element.cornerRadius || 8,
        padding: element.padding || 12
      };
      
    case ELEMENT_TYPES.CALL_OUT:
      return {
        ...merged,
        type: 'group',
        width: element.width || 200,
        height: element.height || 100,
        text: element.text || 'Call out',
        fill: element.fill || '#fffacd',
        stroke: element.stroke || '#f39c12',
        strokeWidth: 2,
        pointerLength: element.pointerLength || 20,
        pointerWidth: element.pointerWidth || 15
      };
      
    case ELEMENT_TYPES.SPIRAL:
      return {
        ...merged,
        type: 'path',
        data: generateSpiralPath(element.width || 100, element.height || 100, element.revolutions || 3),
        stroke: element.stroke || '#3498db',
        strokeWidth: element.strokeWidth || 2,
        fill: 'transparent'
      };
      
    case ELEMENT_TYPES.WAVE:
      return {
        ...merged,
        type: 'path',
        data: generateWavePath(element.width || 100, element.height || 50, element.amplitude || 20, element.wavelength || 100),
        stroke: element.stroke || '#3498db',
        strokeWidth: element.strokeWidth || 3,
        fill: element.fill || 'rgba(52, 152, 219, 0.2)'
      };
      
    case ELEMENT_TYPES.SHAPE:
      return {
        ...merged,
        type: 'shape',
        width: element.width || 100,
        height: element.height || 100,
        fill: element.fill || '#3498db',
        stroke: element.stroke || '#2980b9',
        strokeWidth: element.strokeWidth || 2,
        cornerRadius: element.cornerRadius || 0
      };
      
    case ELEMENT_TYPES.ICON:
      return {
        ...merged,
        type: 'group',
        width: element.size || 24,
        height: element.size || 24,
        fill: element.fill || '#f1c40f',
        stroke: element.stroke || '#e67e22',
        strokeWidth: element.strokeWidth || 1,
        iconType: element.iconType || 'star'
      };
      
    default:
      return merged;
  }
};

// Helper functions for spiral and wave paths
const generateSpiralPath = (width, height, revolutions) => {
  const centerX = width / 2;
  const centerY = height / 2;
  let path = `M ${centerX} ${centerY}`;
  const turns = revolutions || 3;
  const pointsPerTurn = 20;
  
  for (let i = 0; i <= turns * pointsPerTurn; i++) {
    const angle = (i * 2 * Math.PI) / pointsPerTurn;
    const radius = (i / (turns * pointsPerTurn)) * Math.min(width, height) * 0.4;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    path += ` L ${x} ${y}`;
  }
  return path;
};

const generateWavePath = (width, height, amplitude, wavelength) => {
  let path = `M 0 ${height / 2}`;
  const segments = 5;
  const segmentWidth = width / segments;
  const amp = amplitude || 20;
  const waveLength = wavelength || 100;
  
  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth;
    const y = height / 2 + Math.sin(i * Math.PI) * amp;
    path += ` L ${x} ${y}`;
  }
  return path;
};

/**
 * Handle drawing tools (FIXED - ensures points array exists)
 */
const handleDrawingElement = (element) => {
  const merged = { ...element };
  
  // Ensure points array exists for drawing tools
  if (!merged.points && ![ELEMENT_TYPES.ERASER].includes(element.type)) {
    merged.points = [];
  }
  
  switch (element.type) {
    case ELEMENT_TYPES.BRUSH:
    case ELEMENT_TYPES.PEN:
    case ELEMENT_TYPES.PENCIL:
    case ELEMENT_TYPES.HIGHLIGHTER:
      return {
        ...merged,
        type: 'line',
        points: merged.points,
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 
          (element.type === ELEMENT_TYPES.HIGHLIGHTER ? 10 : 
           element.type === ELEMENT_TYPES.BRUSH ? 5 : 
           element.type === ELEMENT_TYPES.PEN ? 2 : 1),
        lineCap: 'round',
        lineJoin: 'round',
        tension: 0.5,
        opacity: element.opacity || (element.type === ELEMENT_TYPES.HIGHLIGHTER ? 0.3 : 1)
      };
      
    case ELEMENT_TYPES.ERASER:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 20,
        height: element.height || 20,
        fill: element.fill || '#ffffff',
        stroke: element.stroke || '#cccccc',
        strokeWidth: 1
      };
      
    default:
      return merged;
  }
};

/**
 * Handle SVG Path element (separate from drawing)
 */
const handlePathElement = (element) => {
  return {
    ...element,
    type: 'path',
    data: element.data || '',
    fill: element.fill || 'transparent',
    stroke: element.stroke || '#000000',
    strokeWidth: element.strokeWidth || 2,
    lineCap: element.lineCap || 'round',
    lineJoin: element.lineJoin || 'round'
  };
};

/**
 * Handle list elements
 */
const handleListElement = (element) => {
  const merged = { ...element };
  
  const isBullet = element.type === ELEMENT_TYPES.BULLET_LIST;
  const items = element.items || ['Item 1', 'Item 2', 'Item 3'];
  const indent = element.indent || 20;
  
  return {
    ...merged,
    type: 'group',
    items: items,
    bulletType: isBullet ? 'bullet' : 'number',
    indent: indent,
    fontSize: element.fontSize || 14,
    lineHeight: element.lineHeight || 1.5
  };
};

/**
 * Handle quote element
 */
const handleQuoteElement = (element) => {
  return {
    ...element,
    type: 'text',
    text: element.text || '"Quote text here"',
    fontSize: element.fontSize || 16,
    fontStyle: 'italic',
    fill: element.fill || '#666666',
    paddingLeft: element.paddingLeft || 16,
    borderLeft: element.borderLeft || '4px solid #3498db',
    background: element.background || '#f9f9f9',
    width: element.width || 400
  };
};

/**
 * Handle image elements with dynamic loading
 */
const handleImageElement = (element, setElements) => {
  console.log('🖼️ Converting image element:', {
    id: element.id,
    hasImage: !!element.image,
    imageComplete: element.image?.complete,
    dimensions: {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    }
  });
  
  const merged = { ...element };
  
  const konvaImage = {
    ...merged,
    type: 'image',
    x: element.x || 50,
    y: element.y || 50,
    width: element.width || 200,
    height: element.height || 200,
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
  if (element.image instanceof HTMLImageElement) {
    konvaImage.image = element.image;
    console.log('✅ Using pre-loaded HTMLImageElement:', {
      complete: element.image.complete,
      naturalSize: `${element.image.naturalWidth}x${element.image.naturalHeight}`,
      displaySize: `${element.width}x${element.height}`
    });
  }
  // If we have a src, we'll load it dynamically
  else if (element.src) {
    konvaImage.src = element.src;
    console.log('📄 Image will load from src');
    
    // Dynamically load the image
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      console.log('🖼️ Dynamically loaded image:', {
        id: element.id,
        naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
        displaySize: `${element.width}x${element.height}`
      });
      
      // Update the element with the loaded image
      setElements(prev => prev.map(el => 
        el.id === element.id ? { ...el, image: img } : el
      ));
    };
    img.onerror = (err) => {
      console.error('❌ Failed to load image:', element.src, err);
    };
    img.src = element.src;
  }
  
  return konvaImage;
};

/**
 * Handle table elements
 */
const handleTableElement = (element) => {
  const merged = { ...element };
  
  return {
    ...merged,
    type: 'group',
    width: element.width || 240,
    height: element.height || 90,
    rows: element.rows || 3,
    columns: element.columns || 3,
    cellWidth: element.cellWidth || 80,
    cellHeight: element.cellHeight || 30,
    borderColor: element.borderColor || '#cccccc',
    borderWidth: element.borderWidth || 1,
    headerBackground: element.headerBackground || '#f5f5f5'
  };
};

/**
 * Handle chart elements
 */
const handleChartElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.CHART:
    case ELEMENT_TYPES.BAR_CHART:
    case ELEMENT_TYPES.PIE_CHART:
    case ELEMENT_TYPES.LINE_CHART:
    case ELEMENT_TYPES.SCATTER_PLOT:
    case ELEMENT_TYPES.PIVOT_CHART:
      return {
        ...merged,
        type: 'group',
        width: element.width || 300,
        height: element.height || 200,
        chartType: element.chartType || 
          (element.type === ELEMENT_TYPES.PIE_CHART ? 'pie' : 
           element.type === ELEMENT_TYPES.LINE_CHART ? 'line' :
           element.type === ELEMENT_TYPES.SCATTER_PLOT ? 'scatter' : 'bar'),
        data: element.data || {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [{
            label: 'Data',
            data: [65, 59, 80, 81],
            backgroundColor: '#3498db'
          }]
        },
        background: element.background || '#ffffff',
        borderColor: element.borderColor || '#dddddd',
        borderWidth: element.borderWidth || 1
      };
      
    case ELEMENT_TYPES.GAUGE:
      return {
        ...merged,
        type: 'group',
        width: element.width || 150,
        height: element.height || 150,
        value: element.value || 75,
        min: element.min || 0,
        max: element.max || 100,
        segments: element.segments || 3,
        showValue: element.showValue !== undefined ? element.showValue : true
      };
      
    case ELEMENT_TYPES.SPARKLINE:
      return {
        ...merged,
        type: 'group',
        width: element.width || 100,
        height: element.height || 30,
        data: element.data || [65, 59, 80, 81, 56, 55, 40],
        type: element.type || 'line',
        color: element.color || '#3498db'
      };
      
    default:
      return merged;
  }
};

/**
 * Handle UI elements
 */
const handleUIElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.BUTTON:
      return {
        ...merged,
        type: 'group',
        width: element.width || 100,
        height: element.height || 40,
        text: element.text || 'Button',
        background: element.background || '#3498db',
        color: element.color || '#ffffff',
        borderRadius: element.borderRadius || 4,
        padding: element.padding || '8px 16px'
      };
      
    case ELEMENT_TYPES.CHECKBOX:
      return {
        ...merged,
        type: 'group',
        width: 16,
        height: 16,
        checked: element.checked || false,
        label: element.label || 'Checkbox',
        disabled: element.disabled || false
      };
      
    case ELEMENT_TYPES.RADIO_BUTTON:
      return {
        ...merged,
        type: 'group',
        width: 16,
        height: 16,
        checked: element.checked || false,
        label: element.label || 'Radio button',
        disabled: element.disabled || false,
        group: element.group || 'default'
      };
      
    case ELEMENT_TYPES.TEXT_INPUT:
      return {
        ...merged,
        type: 'group',
        width: element.width || 200,
        height: element.height || 32,
        value: element.value || '',
        placeholder: element.placeholder || 'Enter text',
        border: element.border || '1px solid #cccccc',
        borderRadius: element.borderRadius || 4,
        padding: element.padding || '4px 8px'
      };
      
    case ELEMENT_TYPES.SLIDER:
      return {
        ...merged,
        type: 'group',
        width: element.width || 200,
        height: 20,
        value: element.value || 50,
        min: element.min || 0,
        max: element.max || 100,
        step: element.step || 1,
        showValue: element.showValue !== undefined ? element.showValue : true
      };
      
    case ELEMENT_TYPES.TOGGLE_SWITCH:
      return {
        ...merged,
        type: 'group',
        width: element.width || 50,
        height: element.height || 24,
        checked: element.checked || false,
        label: element.label || 'Toggle'
      };
      
    case ELEMENT_TYPES.RATING_STARS:
      return {
        ...merged,
        type: 'group',
        rating: element.rating || 3,
        maxRating: element.maxRating || 5,
        size: element.size || 24,
        color: element.color || '#f1c40f',
        editable: element.editable || false
      };
      
    case ELEMENT_TYPES.CHIP:
      return {
        ...merged,
        type: 'group',
        width: element.width || 80,
        height: element.height || 32,
        text: element.text || 'Chip',
        background: element.background || '#e0e0e0',
        color: element.color || '#333333',
        borderRadius: element.borderRadius || 16,
        padding: element.padding || '4px 12px',
        deletable: element.deletable || false
      };
      
    case ELEMENT_TYPES.DROPDOWN:
      return {
        ...merged,
        type: 'group',
        width: element.width || 200,
        height: element.height || 32,
        options: element.options || ['Option 1', 'Option 2', 'Option 3'],
        selected: element.selected || 0,
        placeholder: element.placeholder || 'Select an option'
      };
      
    default:
      return merged;
  }
};

/**
 * Handle progress elements
 */
const handleProgressElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.PROGRESS_BAR:
      return {
        ...merged,
        type: 'group',
        width: element.width || 200,
        height: element.height || 20,
        value: element.value || 50,
        max: element.max || 100,
        showPercentage: element.showPercentage !== undefined ? element.showPercentage : true,
        color: element.color || '#3498db',
        background: element.background || '#ecf0f1'
      };
      
    case ELEMENT_TYPES.PROGRESS_CIRCLE:
      return {
        ...merged,
        type: 'group',
        width: element.size || 80,
        height: element.size || 80,
        value: element.value || 75,
        thickness: element.thickness || 8,
        showPercentage: element.showPercentage !== undefined ? element.showPercentage : true
      };
      
    default:
      return merged;
  }
};

/**
 * Handle media elements
 */
const handleMediaElement = (element, setElements) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.IMAGE:
      return handleImageElement(merged, setElements);
      
    case ELEMENT_TYPES.VIDEO:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 320,
        height: element.height || 180,
        fill: '#000000',
        stroke: '#cccccc',
        strokeWidth: 1,
        src: element.src || '',
        poster: element.poster || '',
        controls: element.controls !== undefined ? element.controls : true
      };
      
    case ELEMENT_TYPES.AUDIO:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 300,
        height: element.height || 50,
        fill: '#f8f9fa',
        stroke: '#dee2e6',
        strokeWidth: 1,
        src: element.src || '',
        controls: element.controls !== undefined ? element.controls : true
      };
      
    case ELEMENT_TYPES.IFRAME:
    case ELEMENT_TYPES.EMBED:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 400,
        height: element.height || 300,
        fill: '#ffffff',
        stroke: '#cccccc',
        strokeWidth: 1,
        src: element.src || element.code || '',
        border: element.border !== undefined ? element.border : true
      };
      
    default:
      return merged;
  }
};

/**
 * Handle smart elements (Smart Art, Smart Object)
 */
const handleSmartElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.SMART_ART:
      return {
        ...merged,
        type: 'group',
        width: element.width || 300,
        height: element.height || 200,
        smartType: element.smartType || 'process',
        nodes: element.nodes || [],
        connectors: element.connectors || [],
        background: element.background || '#ffffff',
        padding: element.padding || 20
      };
      
    case ELEMENT_TYPES.SMART_OBJECT:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 200,
        height: element.height || 150,
        fill: element.fill || '#2c3e50',
        stroke: element.stroke || '#3498db',
        strokeWidth: element.strokeWidth || 2,
        linked: element.linked || false,
        updateable: element.updateable !== undefined ? element.updateable : true,
        originalSize: element.originalSize !== undefined ? element.originalSize : true
      };
      
    default:
      return merged;
  }
};

/**
 * Handle document elements (Header, Footer, etc.)
 */
const handleDocumentElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.HEADER:
    case ELEMENT_TYPES.FOOTER:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 800,
        height: element.height || 50,
        fill: element.background || '#f8f9fa',
        stroke: element.stroke || '#dee2e6',
        strokeWidth: 1,
        text: element.text || '',
        position: element.type === ELEMENT_TYPES.HEADER ? 'top' : 'bottom'
      };
      
    case ELEMENT_TYPES.SIDEBAR:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 200,
        height: element.height || 600,
        fill: element.background || '#f8f9fa',
        stroke: element.stroke || '#dee2e6',
        strokeWidth: 1,
        position: element.position || 'left'
      };
      
    case ELEMENT_TYPES.COLUMN:
      return {
        ...merged,
        type: 'group',
        width: element.width || 400,
        height: element.height || 600,
        count: element.count || 2,
        gap: element.gap || 20
      };
      
    case ELEMENT_TYPES.PAGE_BREAK:
      return {
        ...merged,
        type: 'line',
        points: [0, 0, element.width || 800, 0],
        stroke: element.color || '#000000',
        strokeWidth: 1,
        dash: element.style === 'dashed' ? [5, 5] : [],
        visible: element.visible !== undefined ? element.visible : true
      };
      
    case ELEMENT_TYPES.SECTION:
      return {
        ...merged,
        type: 'group',
        width: element.width || 400,
        height: element.height || 300,
        title: element.title || 'Section',
        collapsed: element.collapsed || false,
        background: element.background || '#f8f9fa'
      };
      
    default:
      return merged;
  }
};

/**
 * Handle photoshop elements
 */
const handlePhotoshopElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.LAYER:
    case ELEMENT_TYPES.ADJUSTMENT_LAYER:
      return {
        ...merged,
        type: 'group',
        opacity: element.opacity || 1,
        blendMode: element.blendMode || 'normal',
        locked: element.locked || false,
        visible: element.visible !== undefined ? element.visible : true,
        name: element.name || 'Layer 1'
      };
      
    case ELEMENT_TYPES.FILTER:
      return {
        ...merged,
        type: 'group',
        filterType: element.filterType || 'blur',
        value: element.value || 0,
        intensity: element.intensity || 1
      };
      
    case ELEMENT_TYPES.ADJUSTMENT:
      return {
        ...merged,
        type: 'group',
        adjustmentType: element.adjustmentType || 'brightness',
        brightness: element.brightness || 0,
        contrast: element.contrast || 0,
        hue: element.hue || 0,
        saturation: element.saturation || 0
      };
      
    case ELEMENT_TYPES.LAYER_STYLE:
      return {
        ...merged,
        type: 'group',
        layerStyleType: element.layerStyleType || 'dropShadow',
        effects: element.effects || [],
        blendOptions: element.blendOptions || {}
      };
      
    case ELEMENT_TYPES.SELECTION:
    case ELEMENT_TYPES.MARQUEE:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 100,
        height: element.height || 100,
        fill: 'rgba(100, 149, 237, 0.3)',
        stroke: '#6495ed',
        strokeWidth: 1,
        dash: [5, 5],
        selectionType: element.selectionType || 'rectangle'
      };
      
    case ELEMENT_TYPES.LASSO:
      return {
        ...merged,
        type: 'path',
        points: element.points || [],
        fill: 'rgba(100, 149, 237, 0.3)',
        stroke: '#6495ed',
        strokeWidth: 1,
        closed: true
      };
      
    case ELEMENT_TYPES.MAGIC_WAND:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 100,
        height: element.height || 100,
        fill: 'rgba(100, 149, 237, 0.3)',
        stroke: '#6495ed',
        strokeWidth: 1,
        tolerance: element.tolerance || 32,
        contiguous: element.contiguous !== undefined ? element.contiguous : true
      };
      
    case ELEMENT_TYPES.PATTERN:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 100,
        height: element.height || 100,
        fillPatternImage: element.src || '',
        fillPatternScale: element.scale || 1,
        fillPatternRepeat: element.repeat || 'repeat'
      };
      
    case ELEMENT_TYPES.GRADIENT_MAP:
      return {
        ...merged,
        type: 'shape',
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: element.width || 100, y: element.height || 100 },
        fillLinearGradientColorStops: element.colors || ['#000000', '#ffffff'],
        gradientType: element.gradientType || 'linear'
      };
      
    case ELEMENT_TYPES.COLOR_LOOKUP:
      return {
        ...merged,
        type: 'group',
        lookupType: element.lookupType || '3DLUT',
        file: element.file || ''
      };
      
    case ELEMENT_TYPES.CURVES:
      return {
        ...merged,
        type: 'group',
        points: element.points || [[0,0], [255,255]],
        channel: element.channel || 'rgb'
      };
      
    case ELEMENT_TYPES.LEVELS:
      return {
        ...merged,
        type: 'group',
        input: element.input || [0, 255],
        output: element.output || [0, 255],
        gamma: element.gamma || 1
      };
      
    case ELEMENT_TYPES.BLEND_MODE:
      return {
        ...merged,
        type: 'group',
        mode: element.mode || 'normal',
        opacity: element.opacity || 1
      };
      
    default:
      return merged;
  }
};

/**
 * Handle excel elements
 */
const handleExcelElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.CELL_RANGE:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 240,
        height: element.height || 75,
        fill: element.fill || '#f1f5f9',
        stroke: element.stroke || '#e2e8f0',
        strokeWidth: 1,
        startRow: element.startRow || 0,
        endRow: element.endRow || 5,
        startCol: element.startCol || 0,
        endCol: element.endCol || 3
      };
      
    case ELEMENT_TYPES.FORMULA:
      return {
        ...merged,
        type: 'text',
        text: element.formula || '=SUM(A1:A10)',
        fontSize: 12,
        fontFamily: 'Courier New',
        fill: '#2c3e50',
        result: element.result || 0,
        format: element.format || 'general'
      };
      
    case ELEMENT_TYPES.SPREADSHEET:
      return {
        ...merged,
        type: 'group',
        width: element.width || 400,
        height: element.height || 250,
        rows: element.rows || 10,
        columns: element.columns || 5,
        cellWidth: element.cellWidth || 80,
        cellHeight: element.cellHeight || 25,
        showGrid: element.showGrid !== undefined ? element.showGrid : true,
        data: element.data || []
      };
      
    case ELEMENT_TYPES.PIVOT_TABLE:
      return {
        ...merged,
        type: 'group',
        width: element.width || 350,
        height: element.height || 250,
        rows: element.rows || [],
        columns: element.columns || [],
        values: element.values || [],
        filters: element.filters || [],
        style: element.style || 'light'
      };
      
    case ELEMENT_TYPES.CONDITIONAL_FORMAT:
      return {
        ...merged,
        type: 'group',
        formatType: element.type || 'dataBar',
        rules: element.rules || [],
        applyTo: element.applyTo || ''
      };
      
    case ELEMENT_TYPES.DATA_VALIDATION:
      return {
        ...merged,
        type: 'group',
        validationType: element.type || 'list',
        formula1: element.formula1 || '',
        formula2: element.formula2 || '',
        showInputMessage: element.showInputMessage !== undefined ? element.showInputMessage : true
      };
      
    case ELEMENT_TYPES.SORT_FILTER:
      return {
        ...merged,
        type: 'group',
        sortBy: element.sortBy || [],
        filter: element.filter || ''
      };
      
    case ELEMENT_TYPES.PIVOT_FIELD:
      return {
        ...merged,
        type: 'group',
        field: element.field || '',
        area: element.area || 'row',
        function: element.function || 'sum'
      };
      
    default:
      return merged;
  }
};

/**
 * Handle word elements
 */
const handleWordElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.STYLE:
      return {
        ...merged,
        type: 'text',
        text: element.name || 'Style',
        fontSize: element.fontSize || 12,
        fontFamily: element.fontFamily || 'Arial',
        fill: element.color || '#000000',
        bold: element.bold || false,
        italic: element.italic || false,
        underline: element.underline || false
      };
      
    case ELEMENT_TYPES.HYPERLINK:
      return {
        ...merged,
        type: 'text',
        text: element.text || 'Link',
        fontSize: element.fontSize || 12,
        fill: element.fill || '#3498db',
        underline: element.underline !== undefined ? element.underline : true,
        url: element.url || '',
        target: element.target || '_blank'
      };
      
    case ELEMENT_TYPES.COMMENT:
      return {
        ...merged,
        type: 'group',
        width: element.width || 200,
        height: element.height || 100,
        text: element.text || 'Comment',
        author: element.author || 'User',
        date: element.date || new Date().toISOString(),
        resolved: element.resolved || false
      };
      
    case ELEMENT_TYPES.TRACK_CHANGES:
      return {
        ...merged,
        type: 'group',
        enabled: element.enabled || false,
        showChanges: element.showChanges !== undefined ? element.showChanges : true,
        authorColor: element.authorColor || '#ff0000'
      };
      
    case ELEMENT_TYPES.BOOKMARK:
      return {
        ...merged,
        type: 'text',
        text: element.name || 'bookmark1',
        visible: element.visible !== undefined ? element.visible : false
      };
      
    case ELEMENT_TYPES.CROSS_REFERENCE:
      return {
        ...merged,
        type: 'text',
        text: element.target || '',
        type: element.type || 'page',
        format: element.format || 'page #'
      };
      
    case ELEMENT_TYPES.TEMPLATE:
      return {
        ...merged,
        type: 'group',
        name: element.name || 'Template',
        category: element.category || 'general',
        preview: element.preview || ''
      };
      
    case ELEMENT_TYPES.MAIL_MERGE:
      return {
        ...merged,
        type: 'group',
        dataSource: element.dataSource || '',
        fields: element.fields || [],
        preview: element.preview || false
      };
      
    default:
      return merged;
  }
};

/**
 * Handle web elements (Card, Modal, etc.)
 */
const handleWebElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.CARD:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 300,
        height: element.height || 200,
        fill: element.background || '#ffffff',
        stroke: element.border || '1px solid #e0e0e0',
        strokeWidth: 1,
        cornerRadius: element.borderRadius || 8,
        shadow: element.shadow || '0 2px 4px rgba(0,0,0,0.1)',
        padding: element.padding || 16
      };
      
    case ELEMENT_TYPES.MODAL:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 400,
        height: element.height || 300,
        fill: element.background || '#ffffff',
        stroke: element.border || 'none',
        cornerRadius: element.borderRadius || 8,
        shadow: element.shadow || '0 4px 20px rgba(0,0,0,0.15)',
        backdrop: element.backdrop || 'rgba(0,0,0,0.5)'
      };
      
    case ELEMENT_TYPES.TOOLTIP:
      return {
        ...merged,
        type: 'group',
        width: element.width || 150,
        height: element.height || 40,
        text: element.text || 'Tooltip text',
        background: element.background || '#333333',
        color: element.color || '#ffffff',
        padding: element.padding || '8px 12px',
        borderRadius: element.borderRadius || 4,
        arrow: element.arrow !== undefined ? element.arrow : true
      };
      
    case ELEMENT_TYPES.BADGE:
      return {
        ...merged,
        type: 'group',
        width: element.width || 60,
        height: element.height || 24,
        text: element.text || 'Badge',
        background: element.background || '#e74c3c',
        color: element.color || '#ffffff',
        borderRadius: element.borderRadius || 12,
        padding: element.padding || '2px 8px'
      };
      
    case ELEMENT_TYPES.AVATAR:
      return {
        ...merged,
        type: 'group',
        width: element.size || 40,
        height: element.size || 40,
        src: element.src || '',
        shape: element.shape || 'circle',
        border: element.border || '2px solid #ffffff'
      };
      
    case ELEMENT_TYPES.DIVIDER:
      return {
        ...merged,
        type: 'line',
        points: [0, 0, element.width || 200, 0],
        stroke: element.color || '#e0e0e0',
        strokeWidth: element.thickness || 1,
        dash: element.style === 'dashed' ? [5, 5] : 
              element.style === 'dotted' ? [2, 2] : []
      };
      
    case ELEMENT_TYPES.ACCORDION:
      return {
        ...merged,
        type: 'group',
        items: element.items || [],
        multiple: element.multiple || false,
        activeIndex: element.activeIndex || 0
      };
      
    case ELEMENT_TYPES.CAROUSEL:
      return {
        ...merged,
        type: 'group',
        items: element.items || [],
        autoplay: element.autoplay || false,
        interval: element.interval || 3000,
        showIndicators: element.showIndicators !== undefined ? element.showIndicators : true
      };
      
    case ELEMENT_TYPES.TIMELINE:
      return {
        ...merged,
        type: 'group',
        events: element.events || [],
        orientation: element.orientation || 'vertical',
        lineColor: element.lineColor || '#3498db'
      };
      
    case ELEMENT_TYPES.STEPPER:
      return {
        ...merged,
        type: 'group',
        steps: element.steps || [],
        currentStep: element.currentStep || 0,
        orientation: element.orientation || 'horizontal'
      };
      
    case ELEMENT_TYPES.BREADCRUMB:
      return {
        ...merged,
        type: 'group',
        items: element.items || [],
        separator: element.separator || '/',
        showHome: element.showHome !== undefined ? element.showHome : true
      };
      
    case ELEMENT_TYPES.PAGINATION:
      return {
        ...merged,
        type: 'group',
        total: element.total || 10,
        current: element.current || 1,
        pageSize: element.pageSize || 10,
        showNumbers: element.showNumbers !== undefined ? element.showNumbers : true
      };
      
    default:
      return merged;
  }
};

/**
 * Handle presentation elements
 */
const handlePresentationElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.SLIDE:
      return {
        ...merged,
        type: 'rect',
        width: element.width || 800,
        height: element.height || 450,
        fill: element.background || '#ffffff',
        stroke: element.stroke || '#cccccc',
        strokeWidth: 1,
        title: element.title || 'Slide 1',
        transition: element.transition || 'fade',
        duration: element.duration || 0.5
      };
      
    case ELEMENT_TYPES.SLIDE_MASTER:
      return {
        ...merged,
        type: 'group',
        background: element.background || '#ffffff',
        layout: element.layout || 'title-content',
        placeholders: element.placeholders || []
      };
      
    case ELEMENT_TYPES.TRANSITION:
      return {
        ...merged,
        type: 'group',
        width: element.width || 100,
        height: element.height || 100,
        transitionType: element.type || 'fade',
        duration: element.duration || 0.5,
        direction: element.direction || 'in'
      };
      
    case ELEMENT_TYPES.ANIMATION:
      return {
        ...merged,
        type: 'group',
        width: element.width || 100,
        height: element.height || 100,
        animationType: element.type || 'fadeIn',
        duration: element.duration || 1,
        delay: element.delay || 0,
        easing: element.easing || 'linear'
      };
      
    case ELEMENT_TYPES.PRESENTER_NOTES:
      return {
        ...merged,
        type: 'text',
        text: element.text || 'Presenter notes...',
        visible: element.visible !== undefined ? element.visible : false
      };
      
    case ELEMENT_TYPES.TIMER:
      return {
        ...merged,
        type: 'group',
        duration: element.duration || 300,
        running: element.running || false,
        showMilliseconds: element.showMilliseconds || false
      };
      
    case ELEMENT_TYPES.POLL:
      return {
        ...merged,
        type: 'group',
        question: element.question || 'Poll question',
        options: element.options || ['Option 1', 'Option 2'],
        multiple: element.multiple || false
      };
      
    default:
      return merged;
  }
};

/**
 * Handle special effects elements
 */
const handleSpecialEffectsElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.SHADOW:
      return {
        ...merged,
        type: 'group',
        color: element.color || 'rgba(0,0,0,0.5)',
        blur: element.blur || 5,
        offsetX: element.offsetX || 2,
        offsetY: element.offsetY || 2,
        spread: element.spread || 0
      };
      
    case ELEMENT_TYPES.GLOW:
      return {
        ...merged,
        type: 'group',
        color: element.color || '#ffff00',
        blur: element.blur || 10,
        intensity: element.intensity || 1
      };
      
    case ELEMENT_TYPES.REFLECTION:
      return {
        ...merged,
        type: 'group',
        opacity: element.opacity || 0.3,
        distance: element.distance || 10,
        blur: element.blur || 5
      };
      
    case ELEMENT_TYPES.TRANSPARENCY:
      return {
        ...merged,
        type: 'group',
        alpha: element.alpha || 1,
        mask: element.mask || null
      };
      
    case ELEMENT_TYPES.GRID:
      return {
        ...merged,
        type: 'group',
        width: element.width || 400,
        height: element.height || 300,
        size: element.size || 20,
        color: element.color || 'rgba(0,0,0,0.1)',
        snap: element.snap !== undefined ? element.snap : true,
        visible: element.visible !== undefined ? element.visible : true
      };
      
    case ELEMENT_TYPES.GUIDE:
      return {
        ...merged,
        type: 'line',
        points: element.orientation === 'vertical' ? 
                [element.position || 100, 0, element.position || 100, 600] :
                [0, element.position || 100, 800, element.position || 100],
        stroke: element.color || '#ff0000',
        strokeWidth: 1,
        dash: [5, 5]
      };
      
    case ELEMENT_TYPES.RULER:
      return {
        ...merged,
        type: 'group',
        width: element.width || 800,
        height: element.height || 20,
        unit: element.unit || 'px',
        visible: element.visible !== undefined ? element.visible : true,
        showUnits: element.showUnits !== undefined ? element.showUnits : true
      };
      
    default:
      return merged;
  }
};

/**
 * Handle gradient elements
 */
const handleGradientElement = (element) => {
  const merged = { ...element };
  
  switch (element.type) {
    case ELEMENT_TYPES.GRADIENT:
      return {
        ...merged,
        type: 'shape',
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: element.width || 100, y: element.height || 100 },
        fillLinearGradientColorStops: element.colors || ['#3498db', '#2ecc71'],
        gradientType: element.gradientType || 'linear',
        angle: element.angle || 0,
        stops: element.stops || [0, 1],
        opacity: element.opacity || 1
      };
      
    case ELEMENT_TYPES.GRADIENT_MAP:
      return {
        ...merged,
        type: 'shape',
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: element.width || 100, y: element.height || 100 },
        fillLinearGradientColorStops: element.colors || ['#000000', '#ffffff'],
        gradientType: element.gradientType || 'linear'
      };
      
    default:
      return merged;
  }
};

/**
 * Handle spreadsheet elements
 */
const handleSpreadsheetElement = (element) => {
  const merged = { ...element };
  
  return {
    ...merged,
    type: 'group',
    width: element.width || 400,
    height: element.height || 250,
    rows: element.rows || 10,
    columns: element.columns || 5,
    cellWidth: element.cellWidth || 80,
    cellHeight: element.cellHeight || 25,
    showGrid: element.showGrid !== undefined ? element.showGrid : true,
    data: element.data || []
  };
};

/**
 * Handle data table elements
 */
const handleDataTableElement = (element) => {
  const merged = { ...element };
  
  return {
    ...merged,
    type: 'group',
    width: element.width || 400,
    height: element.height || 300,
    columns: element.columns || [],
    rows: element.rows || [],
    pagination: element.pagination !== undefined ? element.pagination : true,
    pageSize: element.pageSize || 10,
    sortable: element.sortable !== undefined ? element.sortable : true,
    filterable: element.filterable !== undefined ? element.filterable : true
  };
};

// =================== MAIN CONVERTER HOOK ===================

/**
 * Main hook for converting elements to Konva format
 */
export const useElementConverter = ({
  canvasSize,
  textProperties,
  setElements,
  createTextInputForEditing,
  selectedLayerId,
  activeLayout,
  konvaToolManager
}) => {
  /**
   * Convert any document element to Konva-compatible format
   */
  const convertToKonvaElement = useCallback((docElement) => {
    if (!docElement) return null;
    
    console.log('🔄 CONVERTING element:', {
      id: docElement.id,
      type: docElement.type,
      originalType: docElement.type
    });
    
    // Merge element with defaults
    const mergedElement = mergeElementProperties(
      docElement, 
      activeLayout, 
      selectedLayerId, 
      setElements
    );
    
    // Apply type-specific handling
    let konvaElement;
    
    // Text elements (13 types)
    if ([
      ELEMENT_TYPES.TEXT,
      ELEMENT_TYPES.TEXTBOX,
      ELEMENT_TYPES.PARAGRAPH,
      ELEMENT_TYPES.HEADING,
      ELEMENT_TYPES.CAPTION,
      ELEMENT_TYPES.FOOTNOTE,
      ELEMENT_TYPES.WATERMARK,
      ELEMENT_TYPES.PAGE_NUMBER,
      ELEMENT_TYPES.PRESENTER_NOTES,
      ELEMENT_TYPES.TOC,
      ELEMENT_TYPES.INDEX,
      ELEMENT_TYPES.BIBLIOGRAPHY,
      ELEMENT_TYPES.HYPERLINK
    ].includes(docElement.type)) {
      konvaElement = handleTextElement(mergedElement, canvasSize, createTextInputForEditing);
      konvaElement.originalType = docElement.type;
    }
    // List elements (2 types)
    else if ([
      ELEMENT_TYPES.BULLET_LIST,
      ELEMENT_TYPES.NUMBERED_LIST
    ].includes(docElement.type)) {
      konvaElement = handleListElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Quote element (1 type)
    else if (docElement.type === ELEMENT_TYPES.QUOTE) {
      konvaElement = handleQuoteElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Basic shapes (12 types)
    else if ([
      ELEMENT_TYPES.RECTANGLE,
      ELEMENT_TYPES.CIRCLE,
      ELEMENT_TYPES.ELLIPSE,
      ELEMENT_TYPES.LINE,
      ELEMENT_TYPES.ARROW,
      ELEMENT_TYPES.TRIANGLE,
      ELEMENT_TYPES.STAR,
      ELEMENT_TYPES.HEXAGON,
      ELEMENT_TYPES.OCTAGON,
      ELEMENT_TYPES.POLYGON,
      ELEMENT_TYPES.BORDER,
      ELEMENT_TYPES.DIAMOND
    ].includes(docElement.type)) {
      konvaElement = handleShapeElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Special shapes (12 types)
    else if ([
      ELEMENT_TYPES.HEART,
      ELEMENT_TYPES.CLOUD,
      ELEMENT_TYPES.GEAR,
      ELEMENT_TYPES.CROSS,
      ELEMENT_TYPES.CHECKMARK,
      ELEMENT_TYPES.SPEECH_BUBBLE,
      ELEMENT_TYPES.CALL_OUT,
      ELEMENT_TYPES.SPIRAL,
      ELEMENT_TYPES.WAVE,
      ELEMENT_TYPES.SHAPE,
      ELEMENT_TYPES.ICON
    ].includes(docElement.type)) {
      konvaElement = handleSpecialShapeElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Drawing tools (5 types) - FIXED
    else if ([
      ELEMENT_TYPES.BRUSH,
      ELEMENT_TYPES.PEN,
      ELEMENT_TYPES.PENCIL,
      ELEMENT_TYPES.HIGHLIGHTER,
      ELEMENT_TYPES.ERASER
    ].includes(docElement.type)) {
      konvaElement = handleDrawingElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // SVG Path (1 type) - SEPARATE
    else if (docElement.type === ELEMENT_TYPES.PATH) {
      konvaElement = handlePathElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Media elements (4 types)
    else if ([
      ELEMENT_TYPES.IMAGE,
      ELEMENT_TYPES.VIDEO,
      ELEMENT_TYPES.AUDIO,
      ELEMENT_TYPES.IFRAME,
      ELEMENT_TYPES.EMBED
    ].includes(docElement.type)) {
      konvaElement = handleMediaElement(mergedElement, setElements);
      konvaElement.originalType = docElement.type;
    }
    // UI elements (9 types)
    else if ([
      ELEMENT_TYPES.BUTTON,
      ELEMENT_TYPES.CHECKBOX,
      ELEMENT_TYPES.RADIO_BUTTON,
      ELEMENT_TYPES.DROPDOWN,
      ELEMENT_TYPES.TEXT_INPUT,
      ELEMENT_TYPES.SLIDER,
      ELEMENT_TYPES.TOGGLE_SWITCH,
      ELEMENT_TYPES.RATING_STARS,
      ELEMENT_TYPES.CHIP
    ].includes(docElement.type)) {
      konvaElement = handleUIElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Progress elements (2 types)
    else if ([
      ELEMENT_TYPES.PROGRESS_BAR,
      ELEMENT_TYPES.PROGRESS_CIRCLE
    ].includes(docElement.type)) {
      konvaElement = handleProgressElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Chart elements (9 types)
    else if ([
      ELEMENT_TYPES.CHART,
      ELEMENT_TYPES.BAR_CHART,
      ELEMENT_TYPES.PIE_CHART,
      ELEMENT_TYPES.LINE_CHART,
      ELEMENT_TYPES.SCATTER_PLOT,
      ELEMENT_TYPES.GAUGE,
      ELEMENT_TYPES.SPARKLINE,
      ELEMENT_TYPES.PIVOT_CHART,
      ELEMENT_TYPES.SMART_ART
    ].includes(docElement.type)) {
      konvaElement = handleChartElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Table elements (2 types)
    else if ([
      ELEMENT_TYPES.TABLE,
      ELEMENT_TYPES.DATA_TABLE
    ].includes(docElement.type)) {
      if (docElement.type === ELEMENT_TYPES.TABLE) {
        konvaElement = handleTableElement(mergedElement);
      } else {
        konvaElement = handleDataTableElement(mergedElement);
      }
      konvaElement.originalType = docElement.type;
    }
    // Spreadsheet (1 type)
    else if (docElement.type === ELEMENT_TYPES.SPREADSHEET) {
      konvaElement = handleSpreadsheetElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Smart elements (1 type)
    else if (docElement.type === ELEMENT_TYPES.SMART_OBJECT) {
      konvaElement = handleSmartElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Group elements (1 type)
    else if (docElement.type === ELEMENT_TYPES.GROUP) {
      konvaElement = {
        ...mergedElement,
        type: 'group',
        children: docElement.children || [],
        width: docElement.width || 200,
        height: docElement.height || 150,
        originalType: docElement.type
      };
    }
    // Frame elements (1 type)
    else if (docElement.type === ELEMENT_TYPES.FRAME) {
      konvaElement = {
        ...mergedElement,
        type: 'rect',
        width: docElement.width || 400,
        height: docElement.height || 300,
        fill: docElement.background || '#ffffff',
        stroke: docElement.border || '1px solid #cccccc',
        strokeWidth: 1,
        padding: docElement.padding || 20,
        originalType: docElement.type
      };
    }
    // Mask/Clip elements (2 types)
    else if ([
      ELEMENT_TYPES.MASK,
      ELEMENT_TYPES.CLIP_PATH
    ].includes(docElement.type)) {
      konvaElement = {
        ...mergedElement,
        type: 'shape',
        fill: 'rgba(0,0,0,0.5)',
        stroke: '#000000',
        strokeWidth: 1,
        originalType: docElement.type
      };
    }
    // Document elements (7 types)
    else if ([
      ELEMENT_TYPES.HEADER,
      ELEMENT_TYPES.FOOTER,
      ELEMENT_TYPES.SIDEBAR,
      ELEMENT_TYPES.COLUMN,
      ELEMENT_TYPES.PAGE_BREAK,
      ELEMENT_TYPES.SECTION
    ].includes(docElement.type)) {
      konvaElement = handleDocumentElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Photoshop elements (13 types)
    else if ([
      ELEMENT_TYPES.LAYER,
      ELEMENT_TYPES.ADJUSTMENT_LAYER,
      ELEMENT_TYPES.FILTER,
      ELEMENT_TYPES.BLEND_MODE,
      ELEMENT_TYPES.ADJUSTMENT,
      ELEMENT_TYPES.LAYER_STYLE,
      ELEMENT_TYPES.SELECTION,
      ELEMENT_TYPES.MARQUEE,
      ELEMENT_TYPES.LASSO,
      ELEMENT_TYPES.MAGIC_WAND,
      ELEMENT_TYPES.PATTERN,
      ELEMENT_TYPES.GRADIENT_MAP,
      ELEMENT_TYPES.COLOR_LOOKUP,
      ELEMENT_TYPES.CURVES,
      ELEMENT_TYPES.LEVELS
    ].includes(docElement.type)) {
      konvaElement = handlePhotoshopElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Excel elements (8 types)
    else if ([
      ELEMENT_TYPES.CELL_RANGE,
      ELEMENT_TYPES.FORMULA,
      ELEMENT_TYPES.CONDITIONAL_FORMAT,
      ELEMENT_TYPES.DATA_VALIDATION,
      ELEMENT_TYPES.PIVOT_TABLE,
      ELEMENT_TYPES.SORT_FILTER,
      ELEMENT_TYPES.PIVOT_FIELD,
      ELEMENT_TYPES.PIVOT_CHART
    ].includes(docElement.type)) {
      konvaElement = handleExcelElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Word elements (8 types)
    else if ([
      ELEMENT_TYPES.STYLE,
      ELEMENT_TYPES.TEMPLATE,
      ELEMENT_TYPES.MAIL_MERGE,
      ELEMENT_TYPES.COMMENT,
      ELEMENT_TYPES.TRACK_CHANGES,
      ELEMENT_TYPES.BOOKMARK,
      ELEMENT_TYPES.CROSS_REFERENCE
    ].includes(docElement.type)) {
      konvaElement = handleWordElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Web elements (12 types)
    else if ([
      ELEMENT_TYPES.CARD,
      ELEMENT_TYPES.MODAL,
      ELEMENT_TYPES.TOOLTIP,
      ELEMENT_TYPES.BADGE,
      ELEMENT_TYPES.AVATAR,
      ELEMENT_TYPES.DIVIDER,
      ELEMENT_TYPES.ACCORDION,
      ELEMENT_TYPES.CAROUSEL,
      ELEMENT_TYPES.TIMELINE,
      ELEMENT_TYPES.STEPPER,
      ELEMENT_TYPES.BREADCRUMB,
      ELEMENT_TYPES.PAGINATION
    ].includes(docElement.type)) {
      konvaElement = handleWebElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Presentation elements (6 types)
    else if ([
      ELEMENT_TYPES.SLIDE,
      ELEMENT_TYPES.SLIDE_MASTER,
      ELEMENT_TYPES.TRANSITION,
      ELEMENT_TYPES.ANIMATION,
      ELEMENT_TYPES.TIMER,
      ELEMENT_TYPES.POLL
    ].includes(docElement.type)) {
      konvaElement = handlePresentationElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Special effects elements (6 types)
    else if ([
      ELEMENT_TYPES.SHADOW,
      ELEMENT_TYPES.GLOW,
      ELEMENT_TYPES.REFLECTION,
      ELEMENT_TYPES.TRANSPARENCY,
      ELEMENT_TYPES.GRID,
      ELEMENT_TYPES.GUIDE,
      ELEMENT_TYPES.RULER
    ].includes(docElement.type)) {
      konvaElement = handleSpecialEffectsElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Gradient elements (2 types)
    else if ([
      ELEMENT_TYPES.GRADIENT,
      ELEMENT_TYPES.GRADIENT_MAP
    ].includes(docElement.type)) {
      konvaElement = handleGradientElement(mergedElement);
      konvaElement.originalType = docElement.type;
    }
    // Fallback for any remaining types
    else {
      console.warn('⚠️ Unhandled element type (using fallback):', docElement.type, docElement);
      
      konvaElement = {
        ...mergedElement,
        type: 'rect',
        width: docElement.width || 100,
        height: docElement.height || 100,
        fill: '#f8f9fa',
        stroke: '#dee2e6',
        strokeWidth: 1,
        originalType: docElement.type
      };
    }
    
    // Log final converted element
    console.log('✅ CONVERTED element:', {
      id: konvaElement.id,
      originalType: konvaElement.originalType,
      konvaType: konvaElement.type,
      dimensions: { x: konvaElement.x, y: konvaElement.y, width: konvaElement.width, height: konvaElement.height }
    });
    
    return konvaElement;
  }, [
    canvasSize,
    setElements,
    createTextInputForEditing,
    selectedLayerId,
    activeLayout
  ]);
  
  // ... rest of your existing addElement function and return statement
  /**
   * Add new element to canvas
   */
  const addElement = useCallback((type, customProps = {}) => {
    // Get layout-specific defaults
    const getLayoutSpecificElementDefaults = (type) => {
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
    };
    
    const layoutDefaults = getLayoutSpecificElementDefaults(type);
    const toolConfig = konvaToolManager?.getCurrentToolConfig?.() || {};
    
    const baseProps = { 
      ...layoutDefaults, 
      ...toolConfig, 
      ...customProps 
    };
    
    const baseElement = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      x: baseProps.x || 50,
      y: baseProps.y || 50,
      draggable: true,
      layerId: selectedLayerId,
      visible: true
    };
    
    // Handle different element types
    let finalElement;
    
    // Text-based elements
    if ([
      'text', 'heading', 'subheading', 'paragraph'
    ].includes(type)) {
      const textTypeMap = {
        'text': ELEMENT_TYPES.TEXT,
        'heading': ELEMENT_TYPES.HEADING,
        'subheading': ELEMENT_TYPES.TEXT,
        'paragraph': ELEMENT_TYPES.PARAGRAPH
      };
      
      const mappedType = textTypeMap[type] || ELEMENT_TYPES.TEXT;
      
      finalElement = {
        ...baseElement,
        type: mappedType,
        text: baseProps.text || 'New Text',
        fontSize: type === 'heading' ? 24 : type === 'subheading' ? 18 : (baseProps.fontSize || 16),
        fontFamily: baseProps.fontFamily || textProperties.fontFamily,
        fontWeight: baseProps.fontWeight || textProperties.fontWeight,
        fontStyle: baseProps.fontStyle || textProperties.fontStyle,
        fill: baseProps.fill || textProperties.fill,
        textAlign: baseProps.textAlign || textProperties.textAlign,
        width: baseProps.width || canvasSize.width - 100
      };
    }
    // Shape elements
    else if ([
      'rectangle', 'circle', 'line', 'arrow', 'triangle', 'star',
      'hexagon', 'heart', 'cloud', 'shape'
    ].includes(type)) {
      const elementTypeMap = {
        'rectangle': ELEMENT_TYPES.RECTANGLE,
        'circle': ELEMENT_TYPES.CIRCLE,
        'line': ELEMENT_TYPES.LINE,
        'arrow': ELEMENT_TYPES.ARROW,
        'triangle': ELEMENT_TYPES.TRIANGLE,
        'star': ELEMENT_TYPES.STAR,
        'hexagon': ELEMENT_TYPES.HEXAGON,
        'heart': ELEMENT_TYPES.HEART,
        'cloud': ELEMENT_TYPES.CLOUD,
        'shape': ELEMENT_TYPES.SHAPE
      };
      
      const mappedType = elementTypeMap[type] || ELEMENT_TYPES.SHAPE;
      
      finalElement = {
        ...baseElement,
        type: mappedType,
        width: baseProps.width || 100,
        height: baseProps.height || 100,
        radius: baseProps.radius || 50,
        fill: baseProps.fill || (type === 'line' || type === 'arrow' ? 'transparent' : '#ffffff'),
        stroke: baseProps.stroke || '#000000',
        strokeWidth: baseProps.strokeWidth || 2,
        ...customProps
      };
    }
    // Image element
    else if (type === 'image') {
      finalElement = {
        ...baseElement,
        type: ELEMENT_TYPES.IMAGE,
        width: baseProps.width || 200,
        height: baseProps.height || 200,
        ...customProps
      };
    }
    // Default case
    else {
      finalElement = {
        ...baseElement,
        ...customProps
      };
    }
    
    // Apply layout-specific enhancements
    if (activeLayout === 'photoshop') {
      if (['rectangle', 'shape'].includes(type)) {
        finalElement.cornerRadius = baseProps.cornerRadius || 0;
        finalElement.shadowBlur = baseProps.shadowBlur || 0;
        finalElement.shadowColor = baseProps.shadowColor || 'rgba(0,0,0,0.5)';
        finalElement.shadowOffsetX = baseProps.shadowOffsetX || 2;
        finalElement.shadowOffsetY = baseProps.shadowOffsetY || 2;
        finalElement.blendMode = baseProps.blendMode || 'normal';
      }
    } else if (activeLayout === 'powerpoint') {
      if (['rectangle', 'shape'].includes(type)) {
        finalElement.shadowEnabled = baseProps.shadowEnabled || false;
        finalElement.reflection = baseProps.reflection || false;
        finalElement.gradient = baseProps.gradient || null;
      }
    }
    
    // Create enhanced element
    const enhancedElement = createEnhancedShapeElement(finalElement);
    
    // Add to elements list
    setElements(prev => {
      const updated = [...prev, enhancedElement];
      return updated;
    });
    
    // Select the new element
    return enhancedElement;
  }, [
    canvasSize.width,
    textProperties,
    konvaToolManager,
    selectedLayerId,
    activeLayout,
    setElements
  ]);
  
  return {
    convertToKonvaElement,
    addElement,
    createEnhancedShapeElement
  };
};

export default useElementConverter;