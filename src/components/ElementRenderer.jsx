import React, { useMemo, useCallback } from 'react';
import {
  Group, Rect, Circle, Text, Image as KonvaImage,
  Line, Arrow, Ellipse, Star, RegularPolygon,
  Path, Shape, Wedge, Ring, Label, Tag, Arc, Transformer
} from 'react-konva';

// Import element types
import {
  ELEMENT_TYPES,
  getElementTypeName,
  getElementCategory,
  ELEMENT_DEFAULTS
} from '../utils/elementTypes';

// ==================== CUSTOM SHAPE DRAWERS ====================
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

// ==================== HELPER FUNCTIONS ====================
const getElementDefaults = (type) => {
  return ELEMENT_DEFAULTS[type] || {};
};

// Map Konva types to render components
const TYPE_TO_COMPONENT = {
  // Basic Konva types
  'rect': Rect,
  'rectangle': Rect,
  'circle': Circle,
  'ellipse': Ellipse,
  'line': Line,
  'arrow': Arrow,
  'text': Text,
  'image': KonvaImage,
  'path': Path,
  'star': Star,
  'regularpolygon': RegularPolygon,
  'triangle': RegularPolygon, // Triangle is a regular polygon with 3 sides
  'shape': Shape,
  'group': Group,
  'arc': Arc,
  'wedge': Wedge,
  'ring': Ring,
  'label': Label,
  'tag': Tag
};

// Map element types to Konva types - UPDATED WITH ALL TYPES
const ELEMENT_TYPE_TO_KONVA_TYPE = {
  // Text elements
  [ELEMENT_TYPES.TEXT]: 'text',
  [ELEMENT_TYPES.TEXTBOX]: 'text',
  [ELEMENT_TYPES.PARAGRAPH]: 'text',
  [ELEMENT_TYPES.HEADING]: 'text',
  [ELEMENT_TYPES.BULLET_LIST]: 'group',
  [ELEMENT_TYPES.NUMBERED_LIST]: 'group',
  [ELEMENT_TYPES.QUOTE]: 'text',
  [ELEMENT_TYPES.CAPTION]: 'text',
  [ELEMENT_TYPES.FOOTNOTE]: 'text',
  [ELEMENT_TYPES.WATERMARK]: 'text',
  [ELEMENT_TYPES.PAGE_NUMBER]: 'text',
  
  // Shape elements
  [ELEMENT_TYPES.RECTANGLE]: 'rect',
  [ELEMENT_TYPES.CIRCLE]: 'circle',
  [ELEMENT_TYPES.ELLIPSE]: 'ellipse',
  [ELEMENT_TYPES.LINE]: 'line',
  [ELEMENT_TYPES.ARROW]: 'arrow',
  [ELEMENT_TYPES.POLYGON]: 'regularpolygon',
  [ELEMENT_TYPES.STAR]: 'star',
  [ELEMENT_TYPES.TRIANGLE]: 'triangle',
  [ELEMENT_TYPES.SHAPE]: 'shape',
  [ELEMENT_TYPES.ICON]: 'shape',
  [ELEMENT_TYPES.GRADIENT]: 'shape',
  [ELEMENT_TYPES.BORDER]: 'rect',
  [ELEMENT_TYPES.HEXAGON]: 'regularpolygon',
  [ELEMENT_TYPES.OCTAGON]: 'regularpolygon',
  [ELEMENT_TYPES.HEART]: 'shape',
  [ELEMENT_TYPES.DIAMOND]: 'shape',
  [ELEMENT_TYPES.SPEECH_BUBBLE]: 'group',
  [ELEMENT_TYPES.CALL_OUT]: 'group',
  [ELEMENT_TYPES.CLOUD]: 'shape',
  [ELEMENT_TYPES.SPIRAL]: 'path',
  [ELEMENT_TYPES.WAVE]: 'path',
  [ELEMENT_TYPES.GEAR]: 'shape',
  [ELEMENT_TYPES.CROSS]: 'path',
  [ELEMENT_TYPES.CHECKMARK]: 'path',
  
  // Drawing elements
  [ELEMENT_TYPES.PATH]: 'path',
  [ELEMENT_TYPES.BRUSH]: 'line',
  [ELEMENT_TYPES.PEN]: 'line',
  [ELEMENT_TYPES.PENCIL]: 'line',
  [ELEMENT_TYPES.HIGHLIGHTER]: 'line',
  [ELEMENT_TYPES.ERASER]: 'rect',
  
  // Media elements
  [ELEMENT_TYPES.IMAGE]: 'image',
  [ELEMENT_TYPES.VIDEO]: 'rect',
  [ELEMENT_TYPES.AUDIO]: 'rect',
  [ELEMENT_TYPES.IFRAME]: 'rect',
  [ELEMENT_TYPES.EMBED]: 'rect',
  
  // Data & Charts
  [ELEMENT_TYPES.TABLE]: 'group',
  [ELEMENT_TYPES.CHART]: 'group',
  [ELEMENT_TYPES.SMART_ART]: 'group',
  [ELEMENT_TYPES.PIVOT_TABLE]: 'group',
  [ELEMENT_TYPES.SPREADSHEET]: 'group',
  [ELEMENT_TYPES.DATA_TABLE]: 'group',
  [ELEMENT_TYPES.BAR_CHART]: 'group',
  [ELEMENT_TYPES.PIE_CHART]: 'group',
  [ELEMENT_TYPES.LINE_CHART]: 'group',
  [ELEMENT_TYPES.SCATTER_PLOT]: 'group',
  [ELEMENT_TYPES.GAUGE]: 'group',
  [ELEMENT_TYPES.PROGRESS_BAR]: 'group',
  
  // UI & Interactive
  [ELEMENT_TYPES.BUTTON]: 'group',
  [ELEMENT_TYPES.CHECKBOX]: 'group',
  [ELEMENT_TYPES.RADIO_BUTTON]: 'group',
  [ELEMENT_TYPES.DROPDOWN]: 'group',
  [ELEMENT_TYPES.TEXT_INPUT]: 'group',
  [ELEMENT_TYPES.SLIDER]: 'group',
  [ELEMENT_TYPES.TOGGLE_SWITCH]: 'group',
  [ELEMENT_TYPES.PROGRESS_CIRCLE]: 'group',
  [ELEMENT_TYPES.RATING_STARS]: 'group',
  
  // Special & Effects
  [ELEMENT_TYPES.GROUP]: 'group',
  [ELEMENT_TYPES.FRAME]: 'rect',
  [ELEMENT_TYPES.MASK]: 'shape',
  [ELEMENT_TYPES.CLIP_PATH]: 'path',
  [ELEMENT_TYPES.LAYER]: 'group',
  [ELEMENT_TYPES.ADJUSTMENT_LAYER]: 'group',
  [ELEMENT_TYPES.FILTER]: 'group',
  [ELEMENT_TYPES.BLEND_MODE]: 'group',
  [ELEMENT_TYPES.SHADOW]: 'group',
  [ELEMENT_TYPES.GLOW]: 'group',
  [ELEMENT_TYPES.REFLECTION]: 'group',
  [ELEMENT_TYPES.TRANSPARENCY]: 'group',
  [ELEMENT_TYPES.GRID]: 'group',
  [ELEMENT_TYPES.GUIDE]: 'line',
  [ELEMENT_TYPES.RULER]: 'group',
  
  // Presentation
  [ELEMENT_TYPES.SLIDE]: 'rect',
  [ELEMENT_TYPES.SLIDE_MASTER]: 'group',
  [ELEMENT_TYPES.TRANSITION]: 'group',
  [ELEMENT_TYPES.ANIMATION]: 'group',
  [ELEMENT_TYPES.PRESENTER_NOTES]: 'text',
  [ELEMENT_TYPES.TIMER]: 'group',
  [ELEMENT_TYPES.POLL]: 'group',
  
  // Document Elements
  [ELEMENT_TYPES.HEADER]: 'rect',
  [ELEMENT_TYPES.FOOTER]: 'rect',
  [ELEMENT_TYPES.SIDEBAR]: 'rect',
  [ELEMENT_TYPES.COLUMN]: 'rect',
  [ELEMENT_TYPES.PAGE_BREAK]: 'line',
  [ELEMENT_TYPES.SECTION]: 'group',
  [ELEMENT_TYPES.TOC]: 'text',
  [ELEMENT_TYPES.INDEX]: 'text',
  [ELEMENT_TYPES.BIBLIOGRAPHY]: 'text',
  
  // Photoshop Specific
  [ELEMENT_TYPES.SMART_OBJECT]: 'rect',
  [ELEMENT_TYPES.ADJUSTMENT]: 'group',
  [ELEMENT_TYPES.LAYER_STYLE]: 'group',
  [ELEMENT_TYPES.PATTERN]: 'rect',
  [ELEMENT_TYPES.GRADIENT_MAP]: 'rect',
  [ELEMENT_TYPES.COLOR_LOOKUP]: 'rect',
  [ELEMENT_TYPES.CURVES]: 'group',
  [ELEMENT_TYPES.LEVELS]: 'group',
  [ELEMENT_TYPES.SELECTION]: 'rect',
  [ELEMENT_TYPES.MARQUEE]: 'rect',
  [ELEMENT_TYPES.LASSO]: 'path',
  [ELEMENT_TYPES.MAGIC_WAND]: 'rect',
  
  // Excel Specific
  [ELEMENT_TYPES.CELL_RANGE]: 'rect',
  [ELEMENT_TYPES.FORMULA]: 'text',
  [ELEMENT_TYPES.CONDITIONAL_FORMAT]: 'group',
  [ELEMENT_TYPES.DATA_VALIDATION]: 'group',
  [ELEMENT_TYPES.PIVOT_CHART]: 'group',
  [ELEMENT_TYPES.SPARKLINE]: 'group',
  [ELEMENT_TYPES.SORT_FILTER]: 'group',
  [ELEMENT_TYPES.PIVOT_FIELD]: 'group',
  
  // Word Specific
  [ELEMENT_TYPES.STYLE]: 'group',
  [ELEMENT_TYPES.TEMPLATE]: 'group',
  [ELEMENT_TYPES.MAIL_MERGE]: 'group',
  [ELEMENT_TYPES.COMMENT]: 'group',
  [ELEMENT_TYPES.TRACK_CHANGES]: 'group',
  [ELEMENT_TYPES.HYPERLINK]: 'text',
  [ELEMENT_TYPES.BOOKMARK]: 'text',
  [ELEMENT_TYPES.CROSS_REFERENCE]: 'text',
  
  // Modern Web & App
  [ELEMENT_TYPES.CARD]: 'rect',
  [ELEMENT_TYPES.MODAL]: 'rect',
  [ELEMENT_TYPES.TOOLTIP]: 'group',
  [ELEMENT_TYPES.BADGE]: 'group',
  [ELEMENT_TYPES.AVATAR]: 'circle',
  [ELEMENT_TYPES.CHIP]: 'group',
  [ELEMENT_TYPES.DIVIDER]: 'line',
  [ELEMENT_TYPES.ACCORDION]: 'group',
  [ELEMENT_TYPES.CAROUSEL]: 'group',
  [ELEMENT_TYPES.TIMELINE]: 'group',
  [ELEMENT_TYPES.STEPPER]: 'group',
  [ELEMENT_TYPES.BREADCRUMB]: 'group',
  [ELEMENT_TYPES.PAGINATION]: 'group'
};

// ==================== MAIN COMPONENT ====================
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
  layoutMode = 'word'
}) => {
  // Event handlers
  const handleElementClick = useCallback((e, element, additive = false) => {
    e.cancelBubble = true;
    onElementSelect?.(element.id, additive);
    onElementClick?.(element);
  }, [onElementSelect, onElementClick]);

  const handleDragEnd = useCallback((e, element) => {
    const node = e.target;
    onElementDrag?.(element.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation()
    });
  }, [onElementDrag]);

  const handleTransformEnd = useCallback((e, element) => {
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

  // Get base props for any element
  const getBaseProps = useCallback((element) => ({
    id: element.id,
    x: element.x || 0,
    y: element.y || 0,
    draggable: element.draggable !== false && !element.locked,
    onClick: (e) => handleElementClick(e, element, e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey),
    onTap: (e) => handleElementClick(e, element, false),
    onDragStart: (e) => {
      if (element.locked) e.target.stopDrag();
    },
    onDragEnd: (e) => handleDragEnd(e, element),
    onTransformEnd: (e) => handleTransformEnd(e, element),
    onMouseEnter: () => handleMouseEnter(element.id),
    onMouseLeave: () => handleMouseLeave(element.id),
    opacity: element.opacity || 1,
    rotation: element.rotation || 0,
    scaleX: element.scaleX || 1,
    scaleY: element.scaleY || 1
  }), [
    handleElementClick,
    handleDragEnd,
    handleTransformEnd,
    handleMouseEnter,
    handleMouseLeave
  ]);

  // Create selection/hover overlay
  const createSelectionOverlay = useCallback((props, isHover = false) => {
    const strokeColor = isHover ? '#94a3b8' : '#3b82f6';
    const strokeWidth = isHover ? 1 : 2;
    const dash = isHover ? [2, 2] : [4, 4];
    const opacity = isHover ? 0.5 : 0.8;

    // Handle different element types
    if (props.elementType === 'circle' || props.radius) {
      return (
        <Circle
          x={props.x}
          y={props.y}
          radius={props.radius + (isHover ? 2 : 4)}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          dash={dash}
          listening={false}
          opacity={opacity}
        />
      );
    }

    if (props.elementType === 'line' || props.elementType === 'arrow') {
      return (
        <Line
          points={props.points}
          stroke={strokeColor}
          strokeWidth={strokeWidth + 2}
          dash={dash}
          lineCap="round"
          lineJoin="round"
          listening={false}
          opacity={opacity}
        />
      );
    }

    // Default rectangle overlay
    return (
      <Rect
        x={props.x - 2}
        y={props.y - 2}
        width={props.width + 4}
        height={props.height + 4}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        dash={dash}
        cornerRadius={4}
        listening={false}
        opacity={opacity}
      />
    );
  }, []);

  // Render a single element - UPDATED LOGIC
  const renderSingleElement = useCallback((element) => {
    if (!element || element.visible === false) return null;

    const isSelected = selectedIds.includes(element.id);
    const isHovered = hoveredElementId === element.id;
    const baseProps = getBaseProps(element);

    console.log('🔄 Rendering element:', {
      id: element.id,
      type: element.type,
      originalType: element.originalType,
      konvaType: ELEMENT_TYPE_TO_KONVA_TYPE[element.type],
      hasComponent: !!TYPE_TO_COMPONENT[element.type]
    });

    // First check if it's already a Konva type
    let componentType = TYPE_TO_COMPONENT[element.type] ? element.type : null;
    
    // If not, try to map from ELEMENT_TYPES
    if (!componentType && ELEMENT_TYPE_TO_KONVA_TYPE[element.type]) {
      componentType = ELEMENT_TYPE_TO_KONVA_TYPE[element.type];
    }
    
    // Fallback to rect if still not found
    const Component = TYPE_TO_COMPONENT[componentType] || Rect;
    const defaults = getElementDefaults(element.type);

    // Prepare element-specific props
    const elementProps = {
      ...baseProps,
      ...defaults,
      ...element,
      fill: element.fill || defaults.fill || '#3498db',
      stroke: element.stroke || defaults.stroke || '#2980b9',
      strokeWidth: element.strokeWidth || defaults.strokeWidth || 2
    };

    // Special handling for specific element types
    let renderedElement;

    // Handle drawing elements, photoshop elements, special elements, etc.
    switch (element.type) {
      // ============ DRAWING ELEMENTS ============
      case ELEMENT_TYPES.BRUSH:
      case ELEMENT_TYPES.PEN:
      case ELEMENT_TYPES.PENCIL:
      case ELEMENT_TYPES.HIGHLIGHTER:
        // These are converted to 'line' but need special rendering
        elementProps.lineCap = 'round';
        elementProps.lineJoin = 'round';
        elementProps.tension = 0.5;
        if (element.type === ELEMENT_TYPES.HIGHLIGHTER) {
          elementProps.opacity = element.opacity || 0.3;
        }
        renderedElement = <Line {...elementProps} />;
        break;

      case ELEMENT_TYPES.ERASER:
        // Eraser as a white rectangle
        elementProps.fill = element.fill || '#ffffff';
        elementProps.stroke = element.stroke || '#cccccc';
        renderedElement = <Rect {...elementProps} />;
        break;

      case ELEMENT_TYPES.PATH:
        // SVG path
        renderedElement = <Path {...elementProps} />;
        break;

      // ============ PHOTOSHOP ELEMENTS ============
      case ELEMENT_TYPES.SMART_OBJECT:
      case ELEMENT_TYPES.FRAME:
      case ELEMENT_TYPES.CARD:
      case ELEMENT_TYPES.MODAL:
        // These are typically rectangles with special properties
        return (
          <Group key={element.id}>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width || 200}
              height={elementProps.height || 150}
              fill={element.fill || defaults.fill || '#ffffff'}
              stroke={element.stroke || defaults.stroke || '#cccccc'}
              strokeWidth={element.strokeWidth || defaults.strokeWidth || 1}
              cornerRadius={element.cornerRadius || defaults.cornerRadius || 4}
              shadowColor={element.shadowColor}
              shadowBlur={element.shadowBlur}
              shadowOffsetX={element.shadowOffsetX}
              shadowOffsetY={element.shadowOffsetY}
            />
            {(element.type === ELEMENT_TYPES.FRAME || element.type === ELEMENT_TYPES.MODAL) && element.title && (
              <Text
                x={elementProps.x + 10}
                y={elementProps.y + 10}
                text={element.title || 'Frame'}
                fontSize={12}
                fontFamily="Arial"
                fill="#333333"
              />
            )}
            {isSelected && showSelection && createSelectionOverlay({
              x: elementProps.x,
              y: elementProps.y,
              width: elementProps.width || 200,
              height: elementProps.height || 150,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              x: elementProps.x,
              y: elementProps.y,
              width: elementProps.width || 200,
              height: elementProps.height || 150,
              elementType: element.type
            }, true)}
          </Group>
        );

      case ELEMENT_TYPES.LAYER:
      case ELEMENT_TYPES.ADJUSTMENT_LAYER:
      case ELEMENT_TYPES.FILTER:
      case ELEMENT_TYPES.BLEND_MODE:
      case ELEMENT_TYPES.ADJUSTMENT:
        // Group-based photoshop elements
        return (
          <Group key={element.id} {...elementProps}>
            <Rect
              x={0}
              y={0}
              width={element.width || 100}
              height={element.height || 100}
              fill={element.type === ELEMENT_TYPES.ADJUSTMENT_LAYER ? 'rgba(255, 255, 255, 0.3)' : '#f0f0f0'}
              stroke="#cccccc"
              strokeWidth={1}
              cornerRadius={4}
            />
            <Text
              x={element.width ? element.width / 2 : 50}
              y={element.height ? element.height / 2 : 50}
              width={element.width || 100}
              text={getElementTypeName(element.type)}
              fontSize={10}
              fill="#666666"
              align="center"
              listening={false}
            />
          </Group>
        );

      // ============ SPECIAL ELEMENTS ============
      case ELEMENT_TYPES.MASK:
      case ELEMENT_TYPES.CLIP_PATH:
        // Mask and clip path as shapes
        elementProps.sceneFunc = (context, shape) => {
          context.beginPath();
          context.rect(0, 0, shape.width(), shape.height());
          context.closePath();
          context.fillStrokeShape(shape);
        };
        renderedElement = <Shape {...elementProps} />;
        break;

      case ELEMENT_TYPES.GRID:
        // Grid as a group of lines
        const gridSize = element.gridSize || 20;
        const gridColor = element.gridColor || 'rgba(0,0,0,0.1)';
        const gridWidth = element.width || 200;
        const gridHeight = element.height || 200;
        
        return (
          <Group key={element.id} {...baseProps}>
            {/* Vertical lines */}
            {Array.from({ length: Math.floor(gridWidth / gridSize) + 1 }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * gridSize, 0, i * gridSize, gridHeight]}
                stroke={gridColor}
                strokeWidth={1}
                listening={false}
              />
            ))}
            {/* Horizontal lines */}
            {Array.from({ length: Math.floor(gridHeight / gridSize) + 1 }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * gridSize, gridWidth, i * gridSize]}
                stroke={gridColor}
                strokeWidth={1}
                listening={false}
              />
            ))}
          </Group>
        );

      case ELEMENT_TYPES.GUIDE:
        // Guide as a dashed line
        return (
          <Group key={element.id}>
            <Line
              points={element.points || [0, 0, 100, 0]}
              stroke={element.color || '#00ff00'}
              strokeWidth={1}
              dash={[5, 5]}
              listening={false}
            />
          </Group>
        );

      // ============ UI ELEMENTS ============
      case ELEMENT_TYPES.CHECKBOX:
        // Checkbox with label
        const isChecked = element.checked || false;
        return (
          <Group key={element.id} {...baseProps}>
            <Rect
              x={0}
              y={0}
              width={16}
              height={16}
              fill="#ffffff"
              stroke="#cccccc"
              strokeWidth={1}
              cornerRadius={3}
            />
            {isChecked && (
              <Text
                x={4}
                y={-2}
                text="✓"
                fontSize={14}
                fill="#3b82f6"
              />
            )}
            {element.label && (
              <Text
                x={24}
                y={2}
                text={element.label}
                fontSize={12}
                fill="#333333"
              />
            )}
          </Group>
        );

      case ELEMENT_TYPES.RADIO_BUTTON:
        // Radio button with label
        const isRadioChecked = element.checked || false;
        return (
          <Group key={element.id} {...baseProps}>
            <Circle
              x={8}
              y={8}
              radius={8}
              fill="#ffffff"
              stroke="#cccccc"
              strokeWidth={1}
            />
            {isRadioChecked && (
              <Circle
                x={8}
                y={8}
                radius={4}
                fill="#3b82f6"
              />
            )}
            {element.label && (
              <Text
                x={24}
                y={2}
                text={element.label}
                fontSize={12}
                fill="#333333"
              />
            )}
          </Group>
        );

      case ELEMENT_TYPES.SLIDER:
        // Simple slider
        const sliderValue = element.value || 50;
        const sliderMax = element.max || 100;
        const sliderWidth = element.width || 200;
        const sliderHeight = element.height || 20;
        
        return (
          <Group key={element.id} {...baseProps}>
            <Rect
              x={0}
              y={sliderHeight / 2 - 2}
              width={sliderWidth}
              height={4}
              fill="#e2e8f0"
              cornerRadius={2}
            />
            <Rect
              x={0}
              y={sliderHeight / 2 - 2}
              width={(sliderValue / sliderMax) * sliderWidth}
              height={4}
              fill="#3b82f6"
              cornerRadius={2}
            />
            <Circle
              x={(sliderValue / sliderMax) * sliderWidth}
              y={sliderHeight / 2}
              radius={8}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={2}
              draggable={true}
            />
          </Group>
        );

      // ============ SHAPE ELEMENTS ============
      case ELEMENT_TYPES.TRIANGLE:
        elementProps.sides = 3;
        elementProps.radius = Math.min(element.width || 80, element.height || 80) / 2;
        renderedElement = <RegularPolygon {...elementProps} />;
        break;

      case ELEMENT_TYPES.HEXAGON:
        elementProps.sides = 6;
        renderedElement = <RegularPolygon {...elementProps} />;
        break;

      case ELEMENT_TYPES.OCTAGON:
        elementProps.sides = 8;
        renderedElement = <RegularPolygon {...elementProps} />;
        break;

      case ELEMENT_TYPES.POLYGON:
        elementProps.sides = element.sides || 5;
        renderedElement = <RegularPolygon {...elementProps} />;
        break;

      case ELEMENT_TYPES.HEART:
      case ELEMENT_TYPES.CLOUD:
      case ELEMENT_TYPES.GEAR:
        elementProps.sceneFunc = (context, shape) => {
          const drawer = shapeDrawers[element.type.toLowerCase()];
          if (drawer) {
            drawer(context, shape);
          } else {
            context.beginPath();
            context.rect(0, 0, shape.width(), shape.height());
            context.closePath();
            context.fillStrokeShape(shape);
          }
        };
        renderedElement = <Shape {...elementProps} />;
        break;

      case ELEMENT_TYPES.DIAMOND:
        // Diamond as rotated square
        return (
          <Group key={element.id} {...baseProps} rotation={45}>
            <Rect
              x={-element.width / 2 || -40}
              y={-element.height / 2 || -40}
              width={element.width || 80}
              height={element.height || 80}
              fill={element.fill || defaults.fill || '#9b59b6'}
              stroke={element.stroke || defaults.stroke || '#8e44ad'}
              strokeWidth={element.strokeWidth || defaults.strokeWidth || 2}
            />
          </Group>
        );

      // ============ TEXT ELEMENTS ============
      case ELEMENT_TYPES.TEXTBOX:
        // Textbox with background
        return (
          <Group key={element.id}>
            <Rect
              x={elementProps.x}
              y={elementProps.y}
              width={elementProps.width || 200}
              height={elementProps.height || 100}
              fill={element.background || defaults.background || '#ffffff'}
              stroke={element.borderColor || defaults.borderColor || '#cccccc'}
              strokeWidth={element.borderWidth || defaults.borderWidth || 1}
              cornerRadius={element.borderRadius || defaults.borderRadius || 4}
            />
            <Text
              x={elementProps.x + (element.padding || 8)}
              y={elementProps.y + (element.padding || 8)}
              width={(elementProps.width || 200) - (element.padding || 8) * 2}
              text={element.text || defaults.text || 'Text'}
              fontSize={element.fontSize || defaults.fontSize || 14}
              fontFamily={element.fontFamily || defaults.fontFamily || 'Arial'}
              fill={element.fill || defaults.fill || '#000000'}
              align={element.align || defaults.align || 'left'}
              wrap="word"
              lineHeight={element.lineHeight || defaults.lineHeight || 1.5}
            />
            {isSelected && showSelection && createSelectionOverlay({
              x: elementProps.x,
              y: elementProps.y,
              width: elementProps.width || 200,
              height: elementProps.height || 100,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              x: elementProps.x,
              y: elementProps.y,
              width: elementProps.width || 200,
              height: elementProps.height || 100,
              elementType: element.type
            }, true)}
          </Group>
        );

      // ============ TABLE ELEMENTS ============
      case ELEMENT_TYPES.TABLE:
        // Simple table rendering
        const rows = element.rows || defaults.rows || 3;
        const cols = element.columns || defaults.columns || 3;
        const cellWidth = element.cellWidth || defaults.cellWidth || 80;
        const cellHeight = element.cellHeight || defaults.cellHeight || 30;

        return (
          <Group key={element.id}>
            {Array.from({ length: rows }).map((_, row) => (
              Array.from({ length: cols }).map((_, col) => (
                <Rect
                  key={`${row}-${col}`}
                  x={baseProps.x + col * cellWidth}
                  y={baseProps.y + row * cellHeight}
                  width={cellWidth}
                  height={cellHeight}
                  fill={row === 0 ? (element.headerBackground || '#f5f5f5') : '#ffffff'}
                  stroke={element.borderColor || '#cccccc'}
                  strokeWidth={element.borderWidth || 1}
                />
              ))
            ))}
            {isSelected && showSelection && createSelectionOverlay({
              x: baseProps.x,
              y: baseProps.y,
              width: cols * cellWidth,
              height: rows * cellHeight,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              x: baseProps.x,
              y: baseProps.y,
              width: cols * cellWidth,
              height: rows * cellHeight,
              elementType: element.type
            }, true)}
          </Group>
        );

      // ============ BUTTON ELEMENT ============
      case ELEMENT_TYPES.BUTTON:
        // Button with text
        return (
          <Group key={element.id}>
            <Rect
              x={baseProps.x}
              y={baseProps.y}
              width={element.width || defaults.width || 100}
              height={element.height || defaults.height || 40}
              fill={element.background || defaults.background || '#3498db'}
              stroke={element.borderColor || defaults.borderColor || '#2980b9'}
              strokeWidth={element.borderWidth || defaults.borderWidth || 1}
              cornerRadius={element.borderRadius || defaults.borderRadius || 4}
            />
            <Text
              x={baseProps.x + (element.width || 100) / 2}
              y={baseProps.y + (element.height || 40) / 2 - 10}
              width={element.width || 100}
              text={element.text || defaults.text || 'Button'}
              fontSize={14}
              fill={element.color || defaults.color || '#ffffff'}
              align="center"
              fontStyle="bold"
              listening={false}
            />
            {isSelected && showSelection && createSelectionOverlay({
              x: baseProps.x,
              y: baseProps.y,
              width: element.width || 100,
              height: element.height || 40,
              elementType: element.type
            }, false)}
            {isHovered && createSelectionOverlay({
              x: baseProps.x,
              y: baseProps.y,
              width: element.width || 100,
              height: element.height || 40,
              elementType: element.type
            }, true)}
          </Group>
        );

      // ============ IMAGE ELEMENT ============
      case ELEMENT_TYPES.IMAGE:
        // Image element
        if (element.image) {
          renderedElement = <KonvaImage {...elementProps} image={element.image} />;
        } else if (element.src) {
          // Show loading placeholder
          return (
            <Group key={element.id}>
              <Rect
                x={baseProps.x}
                y={baseProps.y}
                width={element.width || 200}
                height={element.height || 150}
                fill="#f0f0f0"
                stroke="#ccc"
                strokeWidth={1}
                cornerRadius={4}
              />
              <Text
                x={baseProps.x + (element.width || 200) / 2}
                y={baseProps.y + (element.height || 150) / 2 - 10}
                width={element.width || 200}
                text="Loading Image..."
                fontSize={14}
                fill="#666"
                align="center"
                listening={false}
              />
              {isSelected && showSelection && createSelectionOverlay({
                x: baseProps.x,
                y: baseProps.y,
                width: element.width || 200,
                height: element.height || 150,
                elementType: element.type
              }, false)}
              {isHovered && createSelectionOverlay({
                x: baseProps.x,
                y: baseProps.y,
                width: element.width || 200,
                height: element.height || 150,
                elementType: element.type
              }, true)}
            </Group>
          );
        } else {
          // Show placeholder if no image
          return (
            <Group key={element.id}>
              <Rect
                x={baseProps.x}
                y={baseProps.y}
                width={element.width || 200}
                height={element.height || 150}
                fill="#f0f0f0"
                stroke="#ccc"
                strokeWidth={1}
                cornerRadius={4}
              />
              <Text
                x={baseProps.x + (element.width || 200) / 2}
                y={baseProps.y + (element.height || 150) / 2 - 10}
                width={element.width || 200}
                text="Image"
                fontSize={14}
                fill="#666"
                align="center"
                listening={false}
              />
              {isSelected && showSelection && createSelectionOverlay({
                x: baseProps.x,
                y: baseProps.y,
                width: element.width || 200,
                height: element.height || 150,
                elementType: element.type
              }, false)}
              {isHovered && createSelectionOverlay({
                x: baseProps.x,
                y: baseProps.y,
                width: element.width || 200,
                height: element.height || 150,
                elementType: element.type
              }, true)}
            </Group>
          );
        }
        break;

      // ============ DEFAULT RENDERING ============
      default:
        // Default rendering for other elements
        if (Component && Component !== Rect) {
          renderedElement = <Component {...elementProps} />;
        } else {
          // Fallback to rectangle with type label for debugging
          return (
            <Group key={element.id}>
              <Rect
                x={baseProps.x}
                y={baseProps.y}
                width={element.width || 120}
                height={element.height || 80}
                fill="#f3f4f6"
                stroke="#9ca3af"
                strokeWidth={1}
                cornerRadius={4}
              />
              <Text
                x={baseProps.x + 10}
                y={baseProps.y + 30}
                width={(element.width || 120) - 20}
                text={getElementTypeName(element.type) || element.type}
                fontSize={12}
                fill="#6b7280"
                align="center"
                wrap="word"
                listening={false}
              />
              {isSelected && showSelection && createSelectionOverlay({
                x: baseProps.x,
                y: baseProps.y,
                width: element.width || 120,
                height: element.height || 80,
                elementType: element.type
              }, false)}
              {isHovered && createSelectionOverlay({
                x: baseProps.x,
                y: baseProps.y,
                width: element.width || 120,
                height: element.height || 80,
                elementType: element.type
              }, true)}
            </Group>
          );
        }
    }

    // If we have a rendered element, return it with selection/hover overlays
    if (renderedElement) {
      return (
        <Group key={element.id}>
          {renderedElement}
          {isSelected && showSelection && createSelectionOverlay({
            x: elementProps.x,
            y: elementProps.y,
            width: element.width || elementProps.width || 100,
            height: element.height || elementProps.height || 100,
            radius: element.radius,
            points: element.points,
            elementType: element.type
          }, false)}
          {isHovered && createSelectionOverlay({
            x: elementProps.x,
            y: elementProps.y,
            width: element.width || elementProps.width || 100,
            height: element.height || elementProps.height || 100,
            radius: element.radius,
            points: element.points,
            elementType: element.type
          }, true)}
        </Group>
      );
    }

    return null;
  }, [
    selectedIds,
    hoveredElementId,
    getBaseProps,
    createSelectionOverlay,
    showSelection
  ]);

  // Filter and sort elements
  const validElements = useMemo(() => {
    return elements
      .filter(element => {
        if (!element || typeof element !== 'object') return false;
        if (element.visible === false) return false;
        return typeof element.x === 'number' &&
               typeof element.y === 'number' &&
               !isNaN(element.x) && !isNaN(element.y);
      })
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [elements]);

  // Render all elements
  const renderedElements = useMemo(() => {
    console.log('📊 Rendering elements:', validElements.length);
    return validElements.map(renderSingleElement);
  }, [validElements, renderSingleElement]);

  return <Group>{renderedElements}</Group>;
};

export default ElementRenderer;