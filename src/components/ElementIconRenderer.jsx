// src/app/features/ocr/components/ElementRenderer.jsx - COMPLETE IMPLEMENTATION
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { 
  Group, Rect, Circle, Text, Image as KonvaImage, 
  Line, Arrow, Ellipse, Star, RegularPolygon,
  Path, Shape, Wedge, Ring, Label, Tag,
  Transformer, TextPath, Sprite
} from 'react-konva';
import { useDrop, useDrag } from 'react-dnd';
import { HTML } from 'react-konva-utils';

// Import element types
import { 
  ELEMENT_TYPES, 
  getElementTypeName,
  getElementCategory,
  getElementIcon,
  getDefaultElementDimensions,
  ELEMENT_DEFAULTS
} from '../../utils/elementTypes';

// Custom shape drawing functions
const shapeDrawers = {
  heart: (context, shape, width, height) => {
    context.beginPath();
    const topCurveHeight = height * 0.3;
    context.moveTo(width / 2, height / 3);
    
    // Top left curve
    context.bezierCurveTo(
      5, -topCurveHeight,
      -width / 2, height / 3,
      width / 2, height
    );
    
    // Top right curve
    context.bezierCurveTo(
      width + width / 2, height / 3,
      width - 5, -topCurveHeight,
      width / 2, height / 3
    );
    
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  cloud: (context, shape, width, height) => {
    const cloudiness = shape.getAttr('cloudiness') || 5;
    context.beginPath();
    
    // Draw multiple arcs to create cloud effect
    for (let i = 0; i < cloudiness; i++) {
      const x = (width / cloudiness) * i;
      const y = height / 2;
      const radius = Math.random() * (height / 3) + height / 6;
      context.arc(x, y, radius, 0, Math.PI * 2, false);
    }
    
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  gear: (context, shape, width, height) => {
    const teeth = shape.getAttr('teeth') || 12;
    const innerRadius = shape.getAttr('innerRadius') || Math.min(width, height) * 0.3;
    const outerRadius = shape.getAttr('outerRadius') || Math.min(width, height) * 0.5;
    
    context.beginPath();
    
    for (let i = 0; i < teeth; i++) {
      const angle = (i * 2 * Math.PI) / teeth;
      const nextAngle = ((i + 1) * 2 * Math.PI) / teeth;
      
      // Tooth outer point
      const x1 = width/2 + outerRadius * Math.cos(angle - Math.PI/teeth);
      const y1 = height/2 + outerRadius * Math.sin(angle - Math.PI/teeth);
      
      // Tooth inner point
      const x2 = width/2 + innerRadius * Math.cos(angle);
      const y2 = height/2 + innerRadius * Math.sin(angle);
      
      if (i === 0) {
        context.moveTo(x1, y1);
      } else {
        context.lineTo(x1, y1);
      }
      
      context.lineTo(x2, y2);
    }
    
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  speechBubble: (context, shape, width, height) => {
    const tailPosition = shape.getAttr('tailPosition') || 'bottom-right';
    const cornerRadius = shape.getAttr('cornerRadius') || 8;
    
    context.beginPath();
    
    // Main bubble rectangle
    context.roundRect(0, 0, width, height * 0.8, cornerRadius);
    
    // Speech bubble tail
    context.moveTo(width * 0.7, height * 0.8);
    context.lineTo(width * 0.6, height);
    context.lineTo(width * 0.8, height * 0.8);
    
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  callOut: (context, shape, width, height) => {
    const pointerLength = shape.getAttr('pointerLength') || 20;
    const pointerWidth = shape.getAttr('pointerWidth') || 15;
    
    context.beginPath();
    
    // Main rectangle
    context.rect(0, 0, width, height - pointerLength);
    
    // Pointer
    context.moveTo(width * 0.5 - pointerWidth / 2, height - pointerLength);
    context.lineTo(width * 0.5, height);
    context.lineTo(width * 0.5 + pointerWidth / 2, height - pointerLength);
    
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  spiral: (context, shape, width, height) => {
    const revolutions = shape.getAttr('revolutions') || 3;
    const radius = Math.min(width, height) * 0.4;
    const centerX = width / 2;
    const centerY = height / 2;
    
    context.beginPath();
    context.moveTo(centerX, centerY);
    
    for (let i = 0; i <= 360 * revolutions; i++) {
      const angle = (i * Math.PI) / 180;
      const distance = (radius * i) / (360 * revolutions);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      context.lineTo(x, y);
    }
    
    context.strokeShape(shape);
  },
  
  wave: (context, shape, width, height) => {
    const amplitude = shape.getAttr('amplitude') || height * 0.2;
    const wavelength = shape.getAttr('wavelength') || width / 2;
    
    context.beginPath();
    context.moveTo(0, height / 2);
    
    for (let x = 0; x <= width; x++) {
      const y = height / 2 + amplitude * Math.sin((x / wavelength) * Math.PI * 2);
      context.lineTo(x, y);
    }
    
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.closePath();
    context.fillStrokeShape(shape);
  },
  
  cross: (context, shape, width, height) => {
    const strokeWidth = shape.getAttr('strokeWidth') || 3;
    const size = Math.min(width, height) * 0.6;
    
    context.beginPath();
    
    // Vertical line
    context.moveTo(width / 2, height / 2 - size / 2);
    context.lineTo(width / 2, height / 2 + size / 2);
    
    // Horizontal line
    context.moveTo(width / 2 - size / 2, height / 2);
    context.lineTo(width / 2 + size / 2, height / 2);
    
    context.strokeShape(shape);
  },
  
  checkmark: (context, shape, width, height) => {
    const strokeWidth = shape.getAttr('strokeWidth') || 4;
    const size = Math.min(width, height) * 0.6;
    
    context.beginPath();
    context.moveTo(width / 2 - size / 3, height / 2);
    context.lineTo(width / 2, height / 2 + size / 3);
    context.lineTo(width / 2 + size / 2, height / 2 - size / 3);
    
    context.strokeShape(shape);
  }
};

// Component mapping for Konva elements
const componentMap = {
  // Basic shapes
  [ELEMENT_TYPES.RECTANGLE]: Rect,
  [ELEMENT_TYPES.CIRCLE]: Circle,
  [ELEMENT_TYPES.ELLIPSE]: Ellipse,
  [ELEMENT_TYPES.LINE]: Line,
  [ELEMENT_TYPES.ARROW]: Arrow,
  [ELEMENT_TYPES.STAR]: Star,
  [ELEMENT_TYPES.TRIANGLE]: RegularPolygon,
  [ELEMENT_TYPES.POLYGON]: RegularPolygon,
  [ELEMENT_TYPES.HEXAGON]: RegularPolygon,
  [ELEMENT_TYPES.OCTAGON]: RegularPolygon,
  [ELEMENT_TYPES.DIAMOND]: RegularPolygon,
  [ELEMENT_TYPES.PATH]: Path,
  [ELEMENT_TYPES.RING]: Ring,
  [ELEMENT_TYPES.WEDGE]: Wedge,
  
  // Custom shapes (will use Shape component)
  [ELEMENT_TYPES.HEART]: Shape,
  [ELEMENT_TYPES.CLOUD]: Shape,
  [ELEMENT_TYPES.GEAR]: Shape,
  [ELEMENT_TYPES.SPEECH_BUBBLE]: Shape,
  [ELEMENT_TYPES.CALL_OUT]: Shape,
  [ELEMENT_TYPES.SPIRAL]: Shape,
  [ELEMENT_TYPES.WAVE]: Shape,
  [ELEMENT_TYPES.CROSS]: Shape,
  [ELEMENT_TYPES.CHECKMARK]: Shape,
  [ELEMENT_TYPES.SHAPE]: Shape,
  [ELEMENT_TYPES.ICON]: Shape,
  
  // Drawing tools
  [ELEMENT_TYPES.BRUSH]: Path,
  [ELEMENT_TYPES.PEN]: Path,
  [ELEMENT_TYPES.PENCIL]: Path,
  [ELEMENT_TYPES.HIGHLIGHTER]: Path,
  
  // Media
  [ELEMENT_TYPES.IMAGE]: KonvaImage,
  [ELEMENT_TYPES.PATTERN]: KonvaImage,
  
  // Text elements
  [ELEMENT_TYPES.TEXT]: Text,
  [ELEMENT_TYPES.TEXTBOX]: Group,
  [ELEMENT_TYPES.PARAGRAPH]: Text,
  [ELEMENT_TYPES.HEADING]: Text,
  [ELEMENT_TYPES.QUOTE]: Group,
  [ELEMENT_TYPES.CAPTION]: Text,
  [ELEMENT_TYPES.FOOTNOTE]: Text,
  [ELEMENT_TYPES.WATERMARK]: Text,
  [ELEMENT_TYPES.PAGE_NUMBER]: Text,
  [ELEMENT_TYPES.BULLET_LIST]: Group,
  [ELEMENT_TYPES.NUMBERED_LIST]: Group,
  
  // Groups & containers
  [ELEMENT_TYPES.GROUP]: Group,
  [ELEMENT_TYPES.FRAME]: Group,
  [ELEMENT_TYPES.CARD]: Group,
  [ELEMENT_TYPES.MODAL]: Group,
  [ELEMENT_TYPES.SLIDE]: Group,
  
  // Default fallback
  default: Group
};

// Helper to get component for element type
const getComponentForType = (type) => {
  return componentMap[type] || componentMap.default;
};

// Helper to create gradient fill
const createGradient = (gradientConfig, width, height) => {
  if (!gradientConfig) return null;
  
  const { gradientType = 'linear', colors = ['#3498db', '#2ecc71'], angle = 0, stops = [0, 1] } = gradientConfig;
  
  if (gradientType === 'linear') {
    const startX = 0;
    const startY = 0;
    const endX = width * Math.cos(angle * Math.PI / 180);
    const endY = height * Math.sin(angle * Math.PI / 180);
    
    const gradient = {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      colorStops: colors.map((color, index) => stops[index] || index / (colors.length - 1), color)
    };
    
    return `linear-gradient(${angle}deg, ${colors.join(', ')})`;
  }
  
  // Radial gradient
  return `radial-gradient(circle at ${width/2}px ${height/2}px, ${colors.join(', ')})`;
};

const ElementRenderer = ({
  elements = [],
  selectedIds = [],
  hoveredElementId = null,
  onElementSelect,
  onElementDrag,
  onElementResize,
  onElementClick,
  onElementHover,
  renderQuality = 'high',
  showSelection = true,
  layoutMode = 'word',
  modeConfig = {},
  stageRef,
  transformerRef
}) => {
  // Layout mode specific rendering configurations
  const renderConfigs = useMemo(() => ({
    word: {
      selectionStyle: {
        stroke: '#3b82f6',
        strokeWidth: 2,
        dash: [4, 4],
        cornerRadius: 4
      },
      hoverStyle: {
        stroke: '#94a3b8',
        strokeWidth: 1,
        dash: [2, 2]
      },
      textPadding: 8,
      lineHeight: 1.5,
      letterSpacing: 0,
      autoSpacing: true
    },
    powerpoint: {
      selectionStyle: {
        stroke: '#f59e0b',
        strokeWidth: 3,
        dash: [6, 3],
        cornerRadius: 8
      },
      hoverStyle: {
        stroke: '#fbbf24',
        strokeWidth: 2,
        dash: [3, 3]
      },
      textPadding: 4,
      lineHeight: 1.2,
      letterSpacing: 0
    },
    photoshop: {
      selectionStyle: {
        stroke: '#8b5cf6',
        strokeWidth: 1,
        dash: [2, 2],
        cornerRadius: 0
      },
      hoverStyle: {
        stroke: '#a78bfa',
        strokeWidth: 1,
        dash: [1, 1]
      },
      textPadding: 0,
      lineHeight: 1.1,
      letterSpacing: 0
    },
    excel: {
      selectionStyle: {
        stroke: '#10b981',
        strokeWidth: 1,
        dash: [],
        cornerRadius: 0
      },
      hoverStyle: {
        stroke: '#34d399',
        strokeWidth: 1,
        dash: []
      },
      textPadding: 2,
      lineHeight: 1,
      letterSpacing: 0
    }
  }), []);

  const currentConfig = renderConfigs[layoutMode] || renderConfigs.word;

  // Apply layout-specific styles
  const applyLayoutStyles = useCallback((element, props, allElements) => {
    const styleProps = { ...props };
    
    // Apply type-specific defaults
    const defaults = ELEMENT_DEFAULTS[element.type] || {};
    Object.keys(defaults).forEach(key => {
      if (styleProps[key] === undefined) {
        styleProps[key] = defaults[key];
      }
    });
    
    // Apply layout mode specific styles
    switch (layoutMode) {
      case 'powerpoint':
        if (element.type === ELEMENT_TYPES.RECTANGLE || element.type === ELEMENT_TYPES.SHAPE) {
          styleProps.shadowColor = 'rgba(0,0,0,0.1)';
          styleProps.shadowBlur = 10;
          styleProps.shadowOffset = { x: 0, y: 4 };
          styleProps.shadowEnabled = true;
        }
        break;
      case 'photoshop':
        if (element.type.includes('text')) {
          styleProps.shadowColor = 'rgba(0,0,0,0.5)';
          styleProps.shadowBlur = 2;
          styleProps.shadowOffset = { x: 1, y: 1 };
          styleProps.shadowEnabled = true;
        }
        break;
      case 'excel':
        if (element.type === ELEMENT_TYPES.RECTANGLE || element.type === ELEMENT_TYPES.TEXT) {
          styleProps.x = Math.round(element.x / 25) * 25;
          styleProps.y = Math.round(element.y / 25) * 25;
        }
        break;
    }
    
    return styleProps;
  }, [layoutMode]);

  // Event handlers
  const handleElementClick = useCallback((e, element, additive = false) => {
    e.cancelBubble = true;
    onElementSelect?.(element.id, additive);
    onElementClick?.(element);
  }, [onElementSelect, onElementClick]);

  const handleElementTap = useCallback((e, element) => {
    e.cancelBubble = true;
    onElementSelect?.(element.id, false);
    onElementClick?.(element);
  }, [onElementSelect, onElementClick]);

  const handleDragStart = useCallback((e, element) => {
    if (element.locked) {
      e.target.stopDrag();
      return;
    }
    
    const node = e.target;
    node.setAttrs({
      shadowOffset: { x: 2, y: 2 },
      shadowBlur: 6,
      shadowColor: 'rgba(0,0,0,0.2)'
    });
  }, []);

  const handleDragEnd = useCallback((e, element) => {
    const node = e.target;
    node.setAttrs({
      shadowOffset: { x: 0, y: 0 },
      shadowBlur: 0
    });
    
    if (!element.locked) {
      onElementDrag?.(element.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation()
      });
    }
  }, [onElementDrag]);

  const handleTransformEnd = useCallback((e, element) => {
    if (element.locked) {
      e.target.scaleX(1);
      e.target.scaleY(1);
      e.target.rotation(0);
      return;
    }
    
    const node = e.target;
    onElementResize?.(element.id, {
      x: node.x(),
      y: node.y(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
      rotation: node.rotation(),
      scaleX: 1,
      scaleY: 1
    });
    node.scaleX(1);
    node.scaleY(1);
  }, [onElementResize]);

  const handleMouseEnter = useCallback((elementId) => {
    onElementHover?.(elementId, true);
  }, [onElementHover]);

  const handleMouseLeave = useCallback((elementId) => {
    onElementHover?.(elementId, false);
  }, [onElementHover]);

  const handleContextMenu = useCallback((e) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
  }, []);

  // Create selection/hover overlays
  const createSelectionOverlay = useCallback((props, isHover = false) => {
    const config = isHover ? currentConfig.hoverStyle : currentConfig.selectionStyle;
    const elementType = props.elementType;
    
    switch (elementType) {
      case ELEMENT_TYPES.CIRCLE:
      case ELEMENT_TYPES.ELLIPSE:
        return (
          <Circle
            x={props.x}
            y={props.y}
            radius={props.radius + (isHover ? 1 : 2)}
            stroke={config.stroke}
            strokeWidth={config.strokeWidth}
            dash={config.dash}
            listening={false}
            opacity={isHover ? 0.5 : 1}
          />
        );
        
      case ELEMENT_TYPES.LINE:
      case ELEMENT_TYPES.ARROW:
        return (
          <Line
            points={props.points}
            stroke={config.stroke}
            strokeWidth={config.strokeWidth + (isHover ? 1 : 2)}
            dash={config.dash}
            lineCap="round"
            lineJoin="round"
            listening={false}
            opacity={isHover ? 0.3 : 0.5}
          />
        );
        
      default:
        return (
          <Rect
            x={props.x}
            y={props.y}
            width={props.width}
            height={props.height}
            stroke={config.stroke}
            strokeWidth={config.strokeWidth}
            dash={config.dash}
            cornerRadius={config.cornerRadius}
            listening={false}
            opacity={isHover ? 0.5 : 1}
          />
        );
    }
  }, [currentConfig]);

  // Custom shape drawer
  const drawCustomShape = useCallback((context, shape) => {
    const customType = shape.getAttr('customType');
    const width = shape.width();
    const height = shape.height();
    
    if (shapeDrawers[customType]) {
      shapeDrawers[customType](context, shape, width, height);
    } else {
      // Default rectangle
      context.beginPath();
      context.rect(0, 0, width, height);
      context.closePath();
      context.fillStrokeShape(shape);
    }
  }, []);

  // Render text-based elements
  const renderTextElement = useCallback((element, baseProps, isSelected, isHovered) => {
    const defaults = ELEMENT_DEFAULTS[element.type] || {};
    
    const elementProps = applyLayoutStyles(element, {
      ...baseProps,
      text: element.text || element.content || defaults.text || '',
      fontSize: element.fontSize || defaults.fontSize || 16,
      fontFamily: element.fontFamily || defaults.fontFamily || 'Arial, sans-serif',
      fill: element.fill || defaults.fill || '#000000',
      align: element.align || defaults.align || 'left',
      verticalAlign: element.verticalAlign || defaults.verticalAlign || 'top',
      width: element.width || defaults.width || 200,
      height: element.height || defaults.height,
      wrap: 'word',
      padding: element.padding || defaults.padding || currentConfig.textPadding,
      lineHeight: element.lineHeight || defaults.lineHeight || currentConfig.lineHeight,
      letterSpacing: element.letterSpacing || defaults.letterSpacing || currentConfig.letterSpacing,
      listening: true,
      perfectDrawEnabled: renderQuality === 'high',
      fontStyle: element.fontStyle || defaults.fontStyle,
      fontWeight: element.fontWeight || defaults.fontWeight,
      textDecoration: element.textDecoration || defaults.textDecoration
    }, elements);
    
    let renderedElement;
    
    switch (element.type) {
      case ELEMENT_TYPES.TEXTBOX:
        renderedElement = (
          <Group key={element.id}>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width}
              height={elementProps.height}
              fill={element.background || defaults.background || '#ffffff'}
              stroke={element.borderColor || defaults.borderColor || '#cccccc'}
              strokeWidth={element.borderWidth || defaults.borderWidth || 1}
              cornerRadius={element.borderRadius || defaults.borderRadius || 4}
            />
            <Text
              {...elementProps}
              x={elementProps.x + (element.padding || defaults.padding || 12)}
              y={elementProps.y + (element.padding || defaults.padding || 12)}
              width={elementProps.width - ((element.padding || defaults.padding || 12) * 2)}
              height={elementProps.height - ((element.padding || defaults.padding || 12) * 2)}
            />
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.QUOTE:
        renderedElement = (
          <Group key={element.id}>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width}
              height={elementProps.height}
              fill={element.background || defaults.background || '#f9f9f9'}
              stroke={element.borderColor || defaults.borderColor || '#3498db'}
              strokeWidth={element.borderLeft || defaults.borderLeft ? 4 : 0}
              cornerRadius={element.borderRadius || defaults.borderRadius || 0}
            />
            <Text
              {...elementProps}
              x={elementProps.x + (element.paddingLeft || defaults.paddingLeft || 20)}
              y={elementProps.y + 10}
              width={elementProps.width - 30}
              fontStyle="italic"
            />
          </Group>
        );
        break;
        
      default:
        renderedElement = <Text key={element.id} {...elementProps} />;
        break;
    }
    
    // Calculate height for selection overlay
    const lineCount = (elementProps.text || '').split('\n').length || 1;
    const estimatedHeight = elementProps.fontSize * lineCount * elementProps.lineHeight;
    
    return (
      <Group>
        {renderedElement}
        {isSelected && showSelection && createSelectionOverlay({
          ...elementProps,
          width: elementProps.width,
          height: estimatedHeight,
          elementType: element.type
        }, false)}
        {isHovered && createSelectionOverlay({
          ...elementProps,
          width: elementProps.width,
          height: estimatedHeight,
          elementType: element.type
        }, true)}
      </Group>
    );
  }, [applyLayoutStyles, createSelectionOverlay, currentConfig, elements, renderQuality, showSelection]);

  // Render shape elements
  const renderShapeElement = useCallback((element, baseProps, isSelected, isHovered) => {
    const defaults = ELEMENT_DEFAULTS[element.type] || {};
    const Component = getComponentForType(element.type);
    let elementProps = {};
    let renderedElement;
    
    switch (element.type) {
      case ELEMENT_TYPES.RECTANGLE:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || defaults.width || 100,
          height: element.height || defaults.height || 60,
          fill: element.fill || defaults.fill || '#3498db',
          stroke: element.stroke || defaults.stroke || '#2980b9',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2,
          cornerRadius: element.cornerRadius || defaults.cornerRadius || 0,
          shadowEnabled: element.shadowEnabled || defaults.shadowEnabled,
          shadowColor: element.shadowColor || defaults.shadowColor,
          shadowBlur: element.shadowBlur || defaults.shadowBlur,
          shadowOffset: element.shadowOffset || defaults.shadowOffset
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.CIRCLE:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          radius: element.radius || defaults.radius || 40,
          fill: element.fill || defaults.fill || '#e74c3c',
          stroke: element.stroke || defaults.stroke || '#c0392b',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.ELLIPSE:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          radiusX: element.radiusX || defaults.radiusX || 60,
          radiusY: element.radiusY || defaults.radiusY || 40,
          fill: element.fill || defaults.fill || '#2ecc71',
          stroke: element.stroke || defaults.stroke || '#27ae60',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.LINE:
      case ELEMENT_TYPES.ARROW:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          points: element.points || defaults.points || [0, 0, 100, 0],
          stroke: element.stroke || defaults.stroke || '#000000',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2,
          fill: element.type === ELEMENT_TYPES.ARROW ? 
            (element.stroke || defaults.stroke || '#000000') : 
            (element.fill || defaults.fill || 'transparent'),
          pointerLength: element.type === ELEMENT_TYPES.ARROW ? 
            (element.pointerLength || defaults.pointerLength || 10) : undefined,
          pointerWidth: element.type === ELEMENT_TYPES.ARROW ? 
            (element.pointerWidth || defaults.pointerWidth || 10) : undefined,
          pointerAtBeginning: element.pointerAtBeginning || defaults.pointerAtBeginning,
          pointerAtEnding: element.pointerAtEnding || defaults.pointerAtEnding,
          lineCap: element.lineCap || defaults.lineCap || 'butt',
          lineJoin: element.lineJoin || defaults.lineJoin || 'miter',
          dash: element.dash || defaults.dash || []
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.STAR:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          numPoints: element.numPoints || defaults.numPoints || 5,
          innerRadius: element.innerRadius || defaults.innerRadius || 20,
          outerRadius: element.outerRadius || defaults.outerRadius || 40,
          fill: element.fill || defaults.fill || '#f1c40f',
          stroke: element.stroke || defaults.stroke || '#f39c12',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.TRIANGLE:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          sides: 3,
          radius: Math.min(element.width || defaults.width || 80, element.height || defaults.height || 80) / 2,
          fill: element.fill || defaults.fill || '#1abc9c',
          stroke: element.stroke || defaults.stroke || '#16a085',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.POLYGON:
      case ELEMENT_TYPES.HEXAGON:
      case ELEMENT_TYPES.OCTAGON:
      case ELEMENT_TYPES.DIAMOND:
        const sides = element.type === ELEMENT_TYPES.HEXAGON ? 6 : 
                     element.type === ELEMENT_TYPES.OCTAGON ? 8 : 
                     element.type === ELEMENT_TYPES.DIAMOND ? 4 : 
                     (element.sides || defaults.sides || 5);
        
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          sides,
          radius: element.radius || defaults.radius || 40,
          fill: element.fill || defaults.fill || '#9b59b6',
          stroke: element.stroke || defaults.stroke || '#8e44ad',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.PATH:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          data: element.data || defaults.data || '',
          stroke: element.stroke || defaults.stroke || '#000000',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2,
          fill: element.fill || defaults.fill || 'transparent',
          lineCap: element.lineCap || defaults.lineCap || 'round',
          lineJoin: element.lineJoin || defaults.lineJoin || 'round',
          tension: element.tension || defaults.tension
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      // Custom shapes using Shape component
      case ELEMENT_TYPES.HEART:
      case ELEMENT_TYPES.CLOUD:
      case ELEMENT_TYPES.GEAR:
      case ELEMENT_TYPES.SPEECH_BUBBLE:
      case ELEMENT_TYPES.CALL_OUT:
      case ELEMENT_TYPES.SPIRAL:
      case ELEMENT_TYPES.WAVE:
      case ELEMENT_TYPES.CROSS:
      case ELEMENT_TYPES.CHECKMARK:
      case ELEMENT_TYPES.SHAPE:
      case ELEMENT_TYPES.ICON:
        const shapeType = element.type.replace('shape-', '').toLowerCase();
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || defaults.width || 100,
          height: element.height || defaults.height || 100,
          fill: element.fill || defaults.fill || '#3498db',
          stroke: element.stroke || defaults.stroke || '#2980b9',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 2,
          sceneFunc: drawCustomShape,
          customType: element.shapeType || shapeType,
          cloudiness: element.cloudiness || defaults.cloudiness,
          teeth: element.teeth || defaults.teeth,
          innerRadius: element.innerRadius || defaults.innerRadius,
          outerRadius: element.outerRadius || defaults.outerRadius,
          tailPosition: element.tailPosition || defaults.tailPosition,
          cornerRadius: element.cornerRadius || defaults.cornerRadius,
          pointerLength: element.pointerLength || defaults.pointerLength,
          pointerWidth: element.pointerWidth || defaults.pointerWidth,
          revolutions: element.revolutions || defaults.revolutions,
          amplitude: element.amplitude || defaults.amplitude,
          wavelength: element.wavelength || defaults.wavelength
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.BRUSH:
      case ELEMENT_TYPES.PEN:
      case ELEMENT_TYPES.PENCIL:
      case ELEMENT_TYPES.HIGHLIGHTER:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          points: element.points || defaults.points || [],
          stroke: element.stroke || defaults.stroke || '#000000',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 
            (element.type === ELEMENT_TYPES.HIGHLIGHTER ? 10 : 
             element.type === ELEMENT_TYPES.BRUSH ? 5 : 2),
          fill: element.fill || defaults.fill || 'transparent',
          lineCap: element.lineCap || defaults.lineCap || 'round',
          lineJoin: element.lineJoin || defaults.lineJoin || 'round',
          tension: element.tension || defaults.tension || 0.5,
          opacity: element.opacity || defaults.opacity || 
            (element.type === ELEMENT_TYPES.HIGHLIGHTER ? 0.3 : 1),
          globalCompositeOperation: element.type === ELEMENT_TYPES.ERASER ? 
            'destination-out' : 'source-over'
        }, elements);
        
        renderedElement = <Component {...elementProps} />;
        break;
        
      case ELEMENT_TYPES.ERASER:
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || defaults.width || 20,
          height: element.height || defaults.height || 20,
          fill: element.fill || defaults.fill || '#ffffff',
          stroke: element.stroke || defaults.stroke || '#cccccc',
          strokeWidth: element.strokeWidth || defaults.strokeWidth || 1
        }, elements);
        
        renderedElement = <Rect {...elementProps} />;
        break;
        
      default:
        // Generic shape fallback
        elementProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || 100,
          height: element.height || 100,
          fill: element.fill || '#3498db',
          stroke: element.stroke || '#2980b9',
          strokeWidth: element.strokeWidth || 2
        }, elements);
        
        renderedElement = <Rect {...elementProps} />;
        break;
    }
    
    return (
      <Group key={element.id}>
        {renderedElement}
        {isSelected && showSelection && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, false)}
        {isHovered && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, true)}
      </Group>
    );
  }, [applyLayoutStyles, createSelectionOverlay, drawCustomShape, elements, showSelection]);

  // Render media elements
  const renderMediaElement = useCallback((element, baseProps, isSelected, isHovered) => {
    const defaults = ELEMENT_DEFAULTS[element.type] || {};
    
    switch (element.type) {
      case ELEMENT_TYPES.IMAGE:
      case ELEMENT_TYPES.PATTERN:
        const elementProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || defaults.width || 200,
          height: element.height || defaults.height || 150,
          image: element.image,
          opacity: element.opacity || defaults.opacity || 1,
          cornerRadius: element.cornerRadius || defaults.cornerRadius
        }, elements);
        
        return (
          <Group key={element.id}>
            {element.image || element.src ? (
              <KonvaImage {...elementProps} />
            ) : (
              <Rect
                x={elementProps.x}
                y={elementProps.y}
                width={elementProps.width}
                height={elementProps.height}
                fill="#f0f0f0"
                stroke="#ccc"
                strokeWidth={1}
                cornerRadius={elementProps.cornerRadius}
              />
            )}
            {isSelected && showSelection && createSelectionOverlay({
              ...elementProps,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              ...elementProps,
              elementType: element.type
            }, true)}
          </Group>
        );
        
      case ELEMENT_TYPES.VIDEO:
      case ELEMENT_TYPES.AUDIO:
      case ELEMENT_TYPES.IFRAME:
      case ELEMENT_TYPES.EMBED:
        // For complex media, render a placeholder with HTML overlay
        const mediaProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || defaults.width || 300,
          height: element.height || defaults.height || 
            (element.type === ELEMENT_TYPES.AUDIO ? 50 : 180),
          fill: element.background || defaults.background || '#f8f9fa',
          stroke: element.borderColor || defaults.borderColor || '#dee2e6',
          strokeWidth: element.borderWidth || defaults.borderWidth || 1,
          cornerRadius: element.borderRadius || defaults.borderRadius || 4
        }, elements);
        
        return (
          <Group key={element.id}>
            <Rect {...mediaProps} />
            <Text
              x={mediaProps.x + 10}
              y={mediaProps.y + mediaProps.height / 2 - 10}
              width={mediaProps.width - 20}
              text={`${getElementTypeName(element.type)}: ${element.src || 'No source'}`}
              fontSize={12}
              fill="#6c757d"
              align="center"
              listening={false}
            />
            {isSelected && showSelection && createSelectionOverlay({
              ...mediaProps,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              ...mediaProps,
              elementType: element.type
            }, true)}
          </Group>
        );
        
      default:
        return null;
    }
  }, [applyLayoutStyles, createSelectionOverlay, elements, showSelection]);

  // Render data elements (charts, tables, etc.)
  const renderDataElement = useCallback((element, baseProps, isSelected, isHovered) => {
    const defaults = ELEMENT_DEFAULTS[element.type] || {};
    
    const elementProps = applyLayoutStyles(element, {
      ...baseProps,
      width: element.width || defaults.width || 300,
      height: element.height || defaults.height || 200,
      fill: element.background || defaults.background || '#ffffff',
      stroke: element.borderColor || defaults.borderColor || '#dee2e6',
      strokeWidth: element.borderWidth || defaults.borderWidth || 1,
      cornerRadius: element.borderRadius || defaults.borderRadius || 4
    }, elements);
    
    let content;
    
    switch (element.type) {
      case ELEMENT_TYPES.TABLE:
        // Simple table rendering
        const rows = element.rows || defaults.rows || 3;
        const cols = element.columns || defaults.columns || 3;
        const cellWidth = element.cellWidth || defaults.cellWidth || 80;
        const cellHeight = element.cellHeight || defaults.cellHeight || 30;
        
        content = (
          <Group>
            {/* Table grid */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
              Array.from({ length: cols }).map((_, colIndex) => (
                <Rect
                  key={`${rowIndex}-${colIndex}`}
                  x={elementProps.x + colIndex * cellWidth}
                  y={elementProps.y + rowIndex * cellHeight}
                  width={cellWidth}
                  height={cellHeight}
                  fill={rowIndex === 0 ? '#f5f5f5' : '#ffffff'}
                  stroke="#cccccc"
                  strokeWidth={1}
                />
              ))
            ))}
            {/* Cell text */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
              Array.from({ length: cols }).map((_, colIndex) => (
                <Text
                  key={`text-${rowIndex}-${colIndex}`}
                  x={elementProps.x + colIndex * cellWidth + 4}
                  y={elementProps.y + rowIndex * cellHeight + 8}
                  text={`Cell ${rowIndex+1}-${colIndex+1}`}
                  fontSize={10}
                  fill="#333333"
                  width={cellWidth - 8}
                  listening={false}
                />
              ))
            ))}
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.CHART:
      case ELEMENT_TYPES.BAR_CHART:
      case ELEMENT_TYPES.PIE_CHART:
      case ELEMENT_TYPES.LINE_CHART:
      case ELEMENT_TYPES.SCATTER_PLOT:
        // Chart placeholder
        content = (
          <Group>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width}
              height={elementProps.height}
              fill="#ffffff"
              stroke="#dee2e6"
              strokeWidth={1}
            />
            <Text
              x={elementProps.x}
              y={elementProps.y + elementProps.height / 2 - 20}
              width={elementProps.width}
              text={getElementTypeName(element.type)}
              fontSize={14}
              fontStyle="bold"
              fill="#3b82f6"
              align="center"
              listening={false}
            />
            <Text
              x={elementProps.x}
              y={elementProps.y + elementProps.height / 2}
              width={elementProps.width}
              text="Chart visualization"
              fontSize={12}
              fill="#6b7280"
              align="center"
              listening={false}
            />
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.SPREADSHEET:
        // Spreadsheet placeholder
        content = (
          <Group>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width}
              height={elementProps.height}
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth={2}
            />
            {/* Grid lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[
                  elementProps.x,
                  elementProps.y + i * 25,
                  elementProps.x + elementProps.width,
                  elementProps.y + i * 25
                ]}
                stroke="#e5e7eb"
                strokeWidth={1}
                listening={false}
              />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[
                  elementProps.x + i * 80,
                  elementProps.y,
                  elementProps.x + i * 80,
                  elementProps.y + elementProps.height
                ]}
                stroke="#e5e7eb"
                strokeWidth={1}
                listening={false}
              />
            ))}
            {/* Column headers */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Rect
                key={`header-${i}`}
                x={elementProps.x + i * 80}
                y={elementProps.y}
                width={80}
                height={25}
                fill="#f3f4f6"
                stroke="#d1d5db"
                strokeWidth={1}
                listening={false}
              />
            ))}
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.PROGRESS_BAR:
        const value = element.value || defaults.value || 50;
        const max = element.max || defaults.max || 100;
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        
        content = (
          <Group>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width}
              height={elementProps.height}
              fill={element.background || defaults.background || '#ecf0f1'}
              cornerRadius={elementProps.cornerRadius}
            />
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={(elementProps.width * percentage) / 100}
              height={elementProps.height}
              fill={element.color || defaults.color || '#3498db'}
              cornerRadius={elementProps.cornerRadius}
            />
            {element.showPercentage !== false && (
              <Text
                x={elementProps.x}
                y={elementProps.y + elementProps.height / 2 - 8}
                width={elementProps.width}
                text={`${percentage.toFixed(0)}%`}
                fontSize={12}
                fill="#ffffff"
                align="center"
                fontStyle="bold"
                listening={false}
              />
            )}
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.GAUGE:
        // Simple gauge visualization
        content = (
          <Group>
            <Circle
              x={elementProps.x + elementProps.width / 2}
              y={elementProps.y + elementProps.height / 2}
              radius={Math.min(elementProps.width, elementProps.height) / 2 - 10}
              stroke="#e5e7eb"
              strokeWidth={10}
              fill="transparent"
            />
            <Wedge
              x={elementProps.x + elementProps.width / 2}
              y={elementProps.y + elementProps.height / 2}
              radius={Math.min(elementProps.width, elementProps.height) / 2 - 10}
              angle={120}
              rotation={-150}
              fill="#3498db"
            />
            <Text
              x={elementProps.x + elementProps.width / 2}
              y={elementProps.y + elementProps.height / 2 - 20}
              text={`${element.value || defaults.value || 75}%`}
              fontSize={16}
              fontStyle="bold"
              fill="#1e293b"
              align="center"
              listening={false}
              offsetX={20}
              offsetY={8}
            />
          </Group>
        );
        break;
        
      default:
        content = (
          <Group>
            <Rect {...elementProps} />
            <Text
              x={elementProps.x + 10}
              y={elementProps.y + elementProps.height / 2 - 10}
              width={elementProps.width - 20}
              text={getElementTypeName(element.type)}
              fontSize={12}
              fill="#6b7280"
              align="center"
              listening={false}
            />
          </Group>
        );
    }
    
    return (
      <Group key={element.id}>
        {content}
        {isSelected && showSelection && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, false)}
        {isHovered && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, true)}
      </Group>
    );
  }, [applyLayoutStyles, createSelectionOverlay, elements, showSelection]);

  // Render UI elements
  const renderUIElement = useCallback((element, baseProps, isSelected, isHovered) => {
    const defaults = ELEMENT_DEFAULTS[element.type] || {};
    
    const elementProps = applyLayoutStyles(element, {
      ...baseProps,
      width: element.width || defaults.width || 100,
      height: element.height || defaults.height || 40,
      fill: element.background || defaults.background || '#3498db',
      stroke: element.borderColor || defaults.borderColor || '#2980b9',
      strokeWidth: element.borderWidth || defaults.borderWidth || 1,
      cornerRadius: element.borderRadius || defaults.borderRadius || 4
    }, elements);
    
    let content;
    
    switch (element.type) {
      case ELEMENT_TYPES.BUTTON:
        content = (
          <Group>
            <Rect {...elementProps} />
            <Text
              x={elementProps.x}
              y={elementProps.y + elementProps.height / 2 - 10}
              width={elementProps.width}
              text={element.text || defaults.text || 'Button'}
              fontSize={14}
              fill={element.color || defaults.color || '#ffffff'}
              align="center"
              fontStyle="bold"
              listening={false}
            />
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.CHECKBOX:
        const isChecked = element.checked || defaults.checked || false;
        content = (
          <Group>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={element.size || defaults.size || 16}
              height={element.size || defaults.size || 16}
              fill="#ffffff"
              stroke="#cccccc"
              strokeWidth={2}
              cornerRadius={3}
            />
            {isChecked && (
              <Text
                x={elementProps.x + 2}
                y={elementProps.y - 2}
                text="✓"
                fontSize={14}
                fill="#3498db"
                fontStyle="bold"
                listening={false}
              />
            )}
            <Text
              x={elementProps.x + 25}
              y={elementProps.y + 10}
              text={element.label || defaults.label || 'Checkbox'}
              fontSize={12}
              fill="#333333"
              listening={false}
            />
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.SLIDER:
        const value = element.value || defaults.value || 50;
        const min = element.min || defaults.min || 0;
        const max = element.max || defaults.max || 100;
        const position = ((value - min) / (max - min)) * (elementProps.width - 20);
        
        content = (
          <Group>
            <Rect
              x={elementProps.x}
              y={elementProps.y + elementProps.height / 2 - 2}
              width={elementProps.width}
              height={4}
              fill="#e5e7eb"
              cornerRadius={2}
            />
            <Rect
              x={elementProps.x}
              y={elementProps.y + elementProps.height / 2 - 2}
              width={position}
              height={4}
              fill="#3498db"
              cornerRadius={2}
            />
            <Circle
              x={elementProps.x + position}
              y={elementProps.y + elementProps.height / 2}
              radius={8}
              fill="#ffffff"
              stroke="#3498db"
              strokeWidth={2}
            />
            {element.showValue !== false && (
              <Text
                x={elementProps.x + elementProps.width / 2}
                y={elementProps.y + 25}
                text={`${value}`}
                fontSize={12}
                fill="#6b7280}
                align="center"
                listening={false}
                offsetX={10}
              />
            )}
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.TOGGLE_SWITCH:
        const isOn = element.checked || defaults.checked || false;
        content = (
          <Group>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width}
              height={elementProps.height}
              fill={isOn ? '#10b981' : '#9ca3af'}
              cornerRadius={elementProps.height / 2}
            />
            <Circle
              x={elementProps.x + (isOn ? elementProps.width - elementProps.height / 2 : elementProps.height / 2)}
              y={elementProps.y + elementProps.height / 2}
              radius={elementProps.height / 2 - 2}
              fill="#ffffff"
            />
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.RATING_STARS:
        const rating = element.rating || defaults.rating || 3;
        const maxRating = element.maxRating || defaults.maxRating || 5;
        const starSize = element.size || defaults.size || 24;
        
        content = (
          <Group>
            {Array.from({ length: maxRating }).map((_, i) => (
              <Star
                key={i}
                x={elementProps.x + i * (starSize + 5)}
                y={elementProps.y + starSize / 2}
                numPoints={5}
                innerRadius={starSize * 0.3}
                outerRadius={starSize * 0.5}
                fill={i < rating ? '#fbbf24' : '#e5e7eb'}
                stroke={i < rating ? '#f59e0b' : '#d1d5db'}
                strokeWidth={1}
                listening={false}
              />
            ))}
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.BADGE:
        content = (
          <Group>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width}
              height={elementProps.height}
              fill={elementProps.fill}
              cornerRadius={elementProps.height / 2}
            />
            <Text
              x={elementProps.x + elementProps.width / 2}
              y={elementProps.y + elementProps.height / 2}
              text={element.text || defaults.text || 'Badge'}
              fontSize={12}
              fill="#ffffff"
              align="center"
              fontStyle="bold"
              listening={false}
              offsetX={elementProps.width / 2}
              offsetY={8}
            />
          </Group>
        );
        break;
        
      case ELEMENT_TYPES.AVATAR:
        const size = element.size || defaults.size || 40;
        const shape = element.shape || defaults.shape || 'circle';
        
        content = (
          <Group>
            {shape === 'circle' ? (
              <Circle
                x={elementProps.x + size / 2}
                y={elementProps.y + size / 2}
                radius={size / 2}
                fill={element.src ? undefined : '#3498db'}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ) : (
              <Rect
                x={elementProps.x}
                y={elementProps.y}
                width={size}
                height={size}
                fill={element.src ? undefined : '#3498db'}
                stroke="#ffffff"
                strokeWidth={2}
                cornerRadius={4}
              />
            )}
            {element.src ? (
              <KonvaImage
                x={elementProps.x}
                y={elementProps.y}
                width={size}
                height={size}
                image={element.image}
                cornerRadius={shape === 'circle' ? size / 2 : 4}
              />
            ) : (
              <Text
                x={elementProps.x + size / 2}
                y={elementProps.y + size / 2}
                text="👤"
                fontSize={size * 0.6}
                align="center"
                listening={false}
                offsetX={size * 0.3}
                offsetY={size * 0.4}
              />
            )}
          </Group>
        );
        break;
        
      default:
        content = (
          <Group>
            <Rect {...elementProps} />
            <Text
              x={elementProps.x + 10}
              y={elementProps.y + elementProps.height / 2 - 10}
              width={elementProps.width - 20}
              text={getElementTypeName(element.type)}
              fontSize={12}
              fill="#ffffff"
              align="center"
              listening={false}
            />
          </Group>
        );
    }
    
    return (
      <Group key={element.id}>
        {content}
        {isSelected && showSelection && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, false)}
        {isHovered && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, true)}
      </Group>
    );
  }, [applyLayoutStyles, createSelectionOverlay, elements, showSelection]);

  // Render special elements (groups, frames, etc.)
  const renderSpecialElement = useCallback((element, baseProps, isSelected, isHovered) => {
    const defaults = ELEMENT_DEFAULTS[element.type] || {};
    
    switch (element.type) {
      case ELEMENT_TYPES.GROUP:
        // Groups render their children recursively
        const childElements = elements.filter(el => el.parentId === element.id);
        return (
          <Group
            key={element.id}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            draggable={baseProps.draggable}
            onClick={baseProps.onClick}
            onTap={baseProps.onTap}
            onDragStart={baseProps.onDragStart}
            onDragEnd={baseProps.onDragEnd}
            onTransformEnd={baseProps.onTransformEnd}
            onMouseEnter={baseProps.onMouseEnter}
            onMouseLeave={baseProps.onMouseLeave}
            onContextMenu={baseProps.onContextMenu}
            opacity={element.opacity || 1}
            rotation={element.rotation || 0}
          >
            {/* Group background (optional) */}
            {element.background && (
              <Rect
                width={element.width}
                height={element.height}
                fill={element.background}
                stroke={element.borderColor}
                strokeWidth={element.borderWidth || 1}
                cornerRadius={element.borderRadius}
              />
            )}
            
            {/* Render child elements */}
            {childElements.map(child => renderElement(child))}
            
            {/* Selection overlay */}
            {isSelected && showSelection && createSelectionOverlay({
              x: 0,
              y: 0,
              width: element.width,
              height: element.height,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              x: 0,
              y: 0,
              width: element.width,
              height: element.height,
              elementType: element.type
            }, true)}
          </Group>
        );
        
      case ELEMENT_TYPES.FRAME:
      case ELEMENT_TYPES.CARD:
      case ELEMENT_TYPES.MODAL:
        const frameProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || defaults.width || 400,
          height: element.height || defaults.height || 300,
          fill: element.background || defaults.background || '#ffffff',
          stroke: element.borderColor || defaults.borderColor || '#cccccc',
          strokeWidth: element.borderWidth || defaults.borderWidth || 1,
          cornerRadius: element.borderRadius || defaults.borderRadius || 8,
          shadowColor: element.shadowColor || defaults.shadowColor || 'rgba(0,0,0,0.1)',
          shadowBlur: element.shadowBlur || defaults.shadowBlur || 10,
          shadowOffset: element.shadowOffset || defaults.shadowOffset || { x: 0, y: 4 },
          shadowEnabled: element.shadowEnabled !== false
        }, elements);
        
        return (
          <Group key={element.id}>
            <Rect {...frameProps} />
            {/* Title bar for modal */}
            {element.type === ELEMENT_TYPES.MODAL && (
              <Rect
                x={frameProps.x}
                y={frameProps.y}
                width={frameProps.width}
                height={40}
                fill="#f8f9fa"
                stroke="#dee2e6"
                strokeWidth={1}
                cornerRadius={[frameProps.cornerRadius, frameProps.cornerRadius, 0, 0]}
              />
            )}
            {isSelected && showSelection && createSelectionOverlay({
              ...frameProps,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              ...frameProps,
              elementType: element.type
            }, true)}
          </Group>
        );
        
      case ELEMENT_TYPES.SLIDE:
        const slideProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || defaults.width || 800,
          height: element.height || defaults.height || 450,
          fill: element.background || defaults.background || '#ffffff',
          stroke: element.borderColor || defaults.borderColor || '#000000',
          strokeWidth: element.borderWidth || defaults.borderWidth || 2,
          cornerRadius: element.borderRadius || defaults.borderRadius || 0,
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 20,
          shadowOffset: { x: 0, y: 10 },
          shadowEnabled: true
        }, elements);
        
        return (
          <Group key={element.id}>
            <Rect {...slideProps} />
            {/* Slide number */}
            <Text
              x={slideProps.x + slideProps.width - 40}
              y={slideProps.y + slideProps.height - 30}
              text={element.slideNumber || '1'}
              fontSize={14}
              fill="#666666}
              listening={false}
            />
            {isSelected && showSelection && createSelectionOverlay({
              ...slideProps,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              ...slideProps,
              elementType: element.type
            }, true)}
          </Group>
        );
        
      default:
        // Generic special element
        const elementProps = applyLayoutStyles(element, {
          ...baseProps,
          width: element.width || 100,
          height: element.height || 100,
          fill: '#f8f9fa',
          stroke: '#dee2e6',
          strokeWidth: 2,
          cornerRadius: 4
        }, elements);
        
        return (
          <Group key={element.id}>
            <Rect {...elementProps} />
            <Text
              x={elementProps.x + 10}
              y={elementProps.y + elementProps.height / 2 - 20}
              width={elementProps.width - 20}
              text={getElementTypeName(element.type)}
              fontSize={14}
              fill="#3b82f6}
              align="center"
              listening={false}
            />
            <Text
              x={elementProps.x + 10}
              y={elementProps.y + elementProps.height / 2}
              width={elementProps.width - 20}
              text={getElementIcon(element.type)}
              fontSize={24}
              align="center"
              listening={false}
            />
            {isSelected && showSelection && createSelectionOverlay({
              ...elementProps,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              ...elementProps,
              elementType: element.type
            }, true)}
          </Group>
        );
    }
  }, [applyLayoutStyles, createSelectionOverlay, elements, renderElement, showSelection]);

  // Render unknown elements
  const renderUnknownElement = useCallback((element, baseProps, isSelected, isHovered) => {
    const elementName = getElementTypeName(element.type) || element.type;
    const elementIcon = getElementIcon(element.type) || '❓';
    
    const elementProps = {
      ...baseProps,
      width: element.width || 120,
      height: element.height || 100,
      fill: '#f3f4f6',
      stroke: '#9ca3af',
      strokeWidth: 1,
      dash: [5, 5],
      cornerRadius: 4
    };
    
    return (
      <Group key={element.id}>
        <Rect {...elementProps} />
        <Text
          x={elementProps.x + elementProps.width / 2}
          y={elementProps.y + 20}
          text={elementIcon}
          fontSize={32}
          align="center"
          listening={false}
          offsetX={16}
        />
        <Text
          x={elementProps.x + 10}
          y={elementProps.y + 60}
          text={elementName}
          fontSize={12}
          fill="#6b7280}
          width={elementProps.width - 20}
          wrap="word"
          align="center"
          listening={false}
        />
        <Text
          x={elementProps.x + 10}
          y={elementProps.y + 80}
          text={`Type: ${element.type}`}
          fontSize={10}
          fill="#9ca3af}
          width={elementProps.width - 20}
          wrap="none"
          ellipsis={true}
          align="center"
          listening={false}
        />
        {isSelected && showSelection && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, false)}
        {isHovered && createSelectionOverlay({
          ...elementProps,
          elementType: element.type
        }, true)}
      </Group>
    );
  }, [createSelectionOverlay, showSelection]);

  // Main renderElement function
  const renderElement = useCallback((element) => {
    if (!element || element.visible === false) return null;
    
    const isSelected = selectedIds.includes(element.id);
    const isHovered = hoveredElementId === element.id;
    
    const baseProps = {
      id: element.id,
      x: element.x || 0,
      y: element.y || 0,
      draggable: element.draggable !== false && !element.locked,
      onClick: (e) => handleElementClick(e, element, e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey),
      onTap: (e) => handleElementTap(e, element),
      onDragStart: (e) => handleDragStart(e, element),
      onDragEnd: (e) => handleDragEnd(e, element),
      onTransformEnd: (e) => handleTransformEnd(e, element),
      onMouseEnter: () => handleMouseEnter(element.id),
      onMouseLeave: () => handleMouseLeave(element.id),
      onContextMenu: handleContextMenu,
      opacity: element.opacity || 1,
      rotation: element.rotation || 0,
      scaleX: element.scaleX || 1,
      scaleY: element.scaleY || 1
    };
    
    // Get element category and route to appropriate renderer
    const category = getElementCategory(element.type);
    
    switch (category) {
      case 'text':
        return renderTextElement(element, baseProps, isSelected, isHovered);
        
      case 'shape':
      case 'drawing':
        return renderShapeElement(element, baseProps, isSelected, isHovered);
        
      case 'media':
        return renderMediaElement(element, baseProps, isSelected, isHovered);
        
      case 'data':
        return renderDataElement(element, baseProps, isSelected, isHovered);
        
      case 'ui':
      case 'web':
        return renderUIElement(element, baseProps, isSelected, isHovered);
        
      case 'special':
      case 'presentation':
      case 'document':
      case 'photoshop':
      case 'excel':
      case 'word':
        return renderSpecialElement(element, baseProps, isSelected, isHovered);
        
      default:
        return renderUnknownElement(element, baseProps, isSelected, isHovered);
    }
  }, [
    selectedIds,
    hoveredElementId,
    handleElementClick,
    handleElementTap,
    handleDragStart,
    handleDragEnd,
    handleTransformEnd,
    handleMouseEnter,
    handleMouseLeave,
    handleContextMenu,
    renderTextElement,
    renderShapeElement,
    renderMediaElement,
    renderDataElement,
    renderUIElement,
    renderSpecialElement,
    renderUnknownElement
  ]);

  // Sort elements by zIndex for proper rendering order
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => {
      const aZ = a.zIndex || 0;
      const bZ = b.zIndex || 0;
      return aZ - bZ;
    });
  }, [elements]);

  // Filter and sort elements with validation
  const validElements = useMemo(() => {
    return sortedElements.filter(element => {
      // Basic validation
      if (!element || typeof element !== 'object') return false;
      if (element.visible === false) return false;
      
      // Position validation
      const hasValidPosition = typeof element.x === 'number' && 
                              typeof element.y === 'number' &&
                              !isNaN(element.x) && !isNaN(element.y);
      
      // Check if element is a child of a group (groups handle their own children)
      if (element.parentId && elements.find(e => e.id === element.parentId)) {
        return false;
      }
      
      return hasValidPosition;
    });
  }, [sortedElements, elements]);

  // Memoize element rendering for performance
  const renderedElements = useMemo(() => {
    return validElements.map(renderElement);
  }, [validElements, renderElement]);

  // Render transformer for selected elements
  const renderTransformer = useCallback(() => {
    if (!transformerRef || !selectedIds.length) return null;
    
    const selectedNodes = [];
    // In a real implementation, you would need to get references to the actual Konva nodes
    
    return (
      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => {
          // Limit resize
          if (newBox.width < 5 || newBox.height < 5) {
            return oldBox;
          }
          return newBox;
        }}
      />
    );
  }, [selectedIds, transformerRef]);

  return (
    <>
      <Group>{renderedElements}</Group>
      {renderTransformer()}
    </>
  );
};

export default ElementRenderer;