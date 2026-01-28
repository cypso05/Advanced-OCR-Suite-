// Element type definitions and factories - pure stateless functions

export const ELEMENT_TYPES = {
  // Text Elements
  TEXT: 'text',
  TEXTBOX: 'textbox',
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  BULLET_LIST: 'bulletList',
  NUMBERED_LIST: 'numberedList',
  QUOTE: 'quote',
  CAPTION: 'caption',
  FOOTNOTE: 'footnote',
  WATERMARK: 'watermark',
  PAGE_NUMBER: 'pageNumber',
  
  // Shapes
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  ELLIPSE: 'ellipse',
  LINE: 'line',
  ARROW: 'arrow',
  POLYGON: 'polygon',
  STAR: 'star',
  TRIANGLE: 'triangle',
  SHAPE: 'shape',  // Generic shape type
  ICON: 'icon',    // Icons/symbols
  GRADIENT: 'gradient', // Gradient fills
  BORDER: 'border', // Custom borders
  HEXAGON: 'hexagon',
  OCTAGON: 'octagon',
  HEART: 'heart',
  DIAMOND: 'diamond',
  SPEECH_BUBBLE: 'speechBubble',
  CALL_OUT: 'callOut',
  CLOUD: 'cloud',
  SPIRAL: 'spiral',
  WAVE: 'wave',
  GEAR: 'gear',
  CROSS: 'cross',
  CHECKMARK: 'checkmark',
  
  // Drawing
  PATH: 'path',
  BRUSH: 'brush',
  PEN: 'pen',
  PENCIL: 'pencil',
  HIGHLIGHTER: 'highlighter',
  ERASER: 'eraser',
  
  // Media
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  IFRAME: 'iframe',
  EMBED: 'embed',
  
  // Data & Charts
  TABLE: 'table',
  CHART: 'chart',
  SMART_ART: 'smartArt',
  PIVOT_TABLE: 'pivotTable',
  SPREADSHEET: 'spreadsheet',
  DATA_TABLE: 'dataTable',
  BAR_CHART: 'barChart',
  PIE_CHART: 'pieChart',
  LINE_CHART: 'lineChart',
  SCATTER_PLOT: 'scatterPlot',
  GAUGE: 'gauge',
  PROGRESS_BAR: 'progressBar',
  
  // UI & Interactive
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  RADIO_BUTTON: 'radioButton',
  DROPDOWN: 'dropdown',
  TEXT_INPUT: 'textInput',
  SLIDER: 'slider',
  TOGGLE_SWITCH: 'toggleSwitch',
  PROGRESS_CIRCLE: 'progressCircle',
  RATING_STARS: 'ratingStars',
  
  // Special & Effects
  GROUP: 'group',
  FRAME: 'frame',
  MASK: 'mask',
  CLIP_PATH: 'clipPath',
  LAYER: 'layer',
  ADJUSTMENT_LAYER: 'adjustmentLayer',
  FILTER: 'filter',
  BLEND_MODE: 'blendMode',
  SHADOW: 'shadow',
  GLOW: 'glow',
  REFLECTION: 'reflection',
  TRANSPARENCY: 'transparency',
  GRID: 'grid',
  GUIDE: 'guide',
  RULER: 'ruler',
  
  // Presentation
  SLIDE: 'slide',
  SLIDE_MASTER: 'slideMaster',
  TRANSITION: 'transition',
  ANIMATION: 'animation',
  PRESENTER_NOTES: 'presenterNotes',
  TIMER: 'timer',
  POLL: 'poll',
  
  // Document Elements
  HEADER: 'header',
  FOOTER: 'footer',
  SIDEBAR: 'sidebar',
  COLUMN: 'column',
  PAGE_BREAK: 'pageBreak',
  SECTION: 'section',
  TOC: 'toc', // Table of Contents
  INDEX: 'index',
  BIBLIOGRAPHY: 'bibliography',
  
  // Photoshop Specific
  SMART_OBJECT: 'smartObject',
  ADJUSTMENT: 'adjustment',
  LAYER_STYLE: 'layerStyle',
  PATTERN: 'pattern',
  GRADIENT_MAP: 'gradientMap',
  COLOR_LOOKUP: 'colorLookup',
  CURVES: 'curves',
  LEVELS: 'levels',
  SELECTION: 'selection',
  MARQUEE: 'marquee',
  LASSO: 'lasso',
  MAGIC_WAND: 'magicWand',
  
  // Excel Specific
  CELL_RANGE: 'cellRange',
  FORMULA: 'formula',
  CONDITIONAL_FORMAT: 'conditionalFormat',
  DATA_VALIDATION: 'dataValidation',
  PIVOT_CHART: 'pivotChart',
  SPARKLINE: 'sparkline',
  SORT_FILTER: 'sortFilter',
  PIVOT_FIELD: 'pivotField',
  
  // Word Specific
  STYLE: 'style',
  TEMPLATE: 'template',
  MAIL_MERGE: 'mailMerge',
  COMMENT: 'comment',
  TRACK_CHANGES: 'trackChanges',
  HYPERLINK: 'hyperlink',
  BOOKMARK: 'bookmark',
  CROSS_REFERENCE: 'crossReference',
  
  // Modern Web & App
  CARD: 'card',
  MODAL: 'modal',
  TOOLTIP: 'tooltip',
  BADGE: 'badge',
  AVATAR: 'avatar',
  CHIP: 'chip',
  DIVIDER: 'divider',
  ACCORDION: 'accordion',
  CAROUSEL: 'carousel',
  TIMELINE: 'timeline',
  STEPPER: 'stepper',
  BREADCRUMB: 'breadcrumb',
  PAGINATION: 'pagination'
};

// Default properties for each element type
export const ELEMENT_DEFAULTS = {
  [ELEMENT_TYPES.TEXT]: {
    text: 'Click to edit',
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    fill: '#000000',
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.2,
    letterSpacing: 0,
    padding: 4,
    background: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0
  },
  
  [ELEMENT_TYPES.TEXTBOX]: {
    text: '',
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    fill: '#333333',
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.5,
    padding: 12,
    background: '#ffffff',
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 4,
    width: 200,
    height: 100
  },
  
  [ELEMENT_TYPES.PARAGRAPH]: {
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    fontSize: 12,
    fontFamily: 'Georgia, serif',
    fill: '#333333',
    align: 'justify',
    lineHeight: 1.6,
    width: 400,
    marginBottom: 16
  },
  
  [ELEMENT_TYPES.HEADING]: {
    text: 'Heading',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    fill: '#000000',
    fontWeight: 'bold',
    marginBottom: 12
  },
  
  [ELEMENT_TYPES.BULLET_LIST]: {
    items: ['Item 1', 'Item 2', 'Item 3'],
    bulletType: 'disc',
    fontSize: 14,
    lineHeight: 1.5,
    indent: 20
  },
  
  [ELEMENT_TYPES.NUMBERED_LIST]: {
    items: ['First item', 'Second item', 'Third item'],
    numberingType: 'decimal',
    start: 1,
    fontSize: 14,
    lineHeight: 1.5,
    indent: 20
  },
  
  [ELEMENT_TYPES.QUOTE]: {
    text: 'This is a quote',
    fontSize: 16,
    fontStyle: 'italic',
    fill: '#666666',
    borderLeft: '4px solid #3498db',
    paddingLeft: 16,
    background: '#f9f9f9',
    width: 400
  },
  
  [ELEMENT_TYPES.CAPTION]: {
    text: 'Caption text',
    fontSize: 11,
    fill: '#666666',
    align: 'center',
    fontStyle: 'italic'
  },
  
  [ELEMENT_TYPES.FOOTNOTE]: {
    text: 'Footnote reference',
    fontSize: 10,
    superscript: true,
    fill: '#0000ff'
  },
  
  [ELEMENT_TYPES.WATERMARK]: {
    text: 'CONFIDENTIAL',
    fontSize: 48,
    fill: 'rgba(0,0,0,0.1)',
    rotation: -45,
    fontStyle: 'italic',
    opacity: 0.3
  },
  
  [ELEMENT_TYPES.PAGE_NUMBER]: {
    text: '1',
    fontSize: 11,
    fill: '#666666',
    position: 'bottom-right'
  },
  
  [ELEMENT_TYPES.RECTANGLE]: {
    width: 100,
    height: 60,
    fill: '#3498db',
    stroke: '#2980b9',
    strokeWidth: 2,
    cornerRadius: 0,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffsetX: 2,
    shadowOffsetY: 2
  },
  
  [ELEMENT_TYPES.CIRCLE]: {
    radius: 40,
    fill: '#e74c3c',
    stroke: '#c0392b',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.ELLIPSE]: {
    radiusX: 60,
    radiusY: 40,
    fill: '#2ecc71',
    stroke: '#27ae60',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.LINE]: {
    points: [0, 0, 100, 0],
    stroke: '#000000',
    strokeWidth: 2,
    lineCap: 'butt',
    lineJoin: 'miter',
    dash: []
  },
  
  [ELEMENT_TYPES.ARROW]: {
    points: [0, 0, 100, 0],
    stroke: '#000000',
    strokeWidth: 2,
    pointerLength: 10,
    pointerWidth: 10,
    pointerAtBeginning: false,
    pointerAtEnding: true
  },
  
  [ELEMENT_TYPES.POLYGON]: {
    sides: 5,
    radius: 40,
    fill: '#9b59b6',
    stroke: '#8e44ad',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.STAR]: {
    numPoints: 5,
    innerRadius: 20,
    outerRadius: 40,
    fill: '#f1c40f',
    stroke: '#f39c12',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.TRIANGLE]: {
    width: 80,
    height: 80,
    fill: '#1abc9c',
    stroke: '#16a085',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.SHAPE]: {
    shapeType: 'rectangle', // rectangle, rounded, circle, triangle, etc.
    fill: '#3498db',
    stroke: '#2980b9',
    strokeWidth: 2,
    cornerRadius: 0,
    gradient: null,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    opacity: 1,
    blendMode: 'normal'
  },
  
  [ELEMENT_TYPES.ICON]: {
    iconType: 'star',
    fill: '#f1c40f',
    stroke: '#e67e22',
    strokeWidth: 1,
    size: 24
  },
  
  [ELEMENT_TYPES.BORDER]: {
    borderType: 'solid', // solid, dashed, dotted, double
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 0,
    borderDashPattern: [5, 5],
    borderDashOffset: 0
  },
  
  [ELEMENT_TYPES.GRADIENT]: {
    gradientType: 'linear', // linear, radial, angular
    colors: ['#3498db', '#2ecc71'],
    angle: 0,
    stops: [0, 1],
    opacity: 1
  },
  
  [ELEMENT_TYPES.HEXAGON]: {
    radius: 40,
    fill: '#e67e22',
    stroke: '#d35400',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.OCTAGON]: {
    radius: 40,
    fill: '#34495e',
    stroke: '#2c3e50',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.HEART]: {
    size: 40,
    fill: '#e74c3c',
    stroke: '#c0392b',
    strokeWidth: 1
  },
  
  [ELEMENT_TYPES.DIAMOND]: {
    width: 60,
    height: 60,
    fill: '#9b59b6',
    stroke: '#8e44ad',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.SPEECH_BUBBLE]: {
    text: 'Hello!',
    fill: '#ffffff',
    stroke: '#cccccc',
    strokeWidth: 1,
    tailPosition: 'bottom-right',
    padding: 12,
    cornerRadius: 8
  },
  
  [ELEMENT_TYPES.CALL_OUT]: {
    text: 'Call out',
    fill: '#fffacd',
    stroke: '#f39c12',
    strokeWidth: 2,
    pointerLength: 20,
    pointerWidth: 15
  },
  
  [ELEMENT_TYPES.CLOUD]: {
    width: 120,
    height: 80,
    fill: '#ffffff',
    stroke: '#ecf0f1',
    strokeWidth: 2,
    cloudiness: 5
  },
  
  [ELEMENT_TYPES.SPIRAL]: {
    revolutions: 3,
    radius: 50,
    stroke: '#3498db',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.WAVE]: {
    amplitude: 20,
    wavelength: 100,
    stroke: '#3498db',
    strokeWidth: 3,
    fill: 'rgba(52, 152, 219, 0.2)'
  },
  
  [ELEMENT_TYPES.GEAR]: {
    teeth: 12,
    innerRadius: 30,
    outerRadius: 50,
    fill: '#95a5a6',
    stroke: '#7f8c8d',
    strokeWidth: 2
  },
  
  [ELEMENT_TYPES.CROSS]: {
    size: 40,
    stroke: '#e74c3c',
    strokeWidth: 3
  },
  
  [ELEMENT_TYPES.CHECKMARK]: {
    size: 40,
    stroke: '#2ecc71',
    strokeWidth: 4
  },
  
  [ELEMENT_TYPES.PATH]: {
    data: '', // SVG path data
    stroke: '#000000',
    strokeWidth: 2,
    fill: 'transparent',
    lineCap: 'round',
    lineJoin: 'round'
  },
  
  [ELEMENT_TYPES.BRUSH]: {
    points: [],
    stroke: '#000000',
    strokeWidth: 5,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.5
  },
  
  [ELEMENT_TYPES.PEN]: {
    points: [],
    stroke: '#000000',
    strokeWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter'
  },
  
  [ELEMENT_TYPES.PENCIL]: {
    points: [],
    stroke: '#333333',
    strokeWidth: 2,
    lineCap: 'round',
    lineJoin: 'round',
    opacity: 0.8
  },
  
  [ELEMENT_TYPES.HIGHLIGHTER]: {
    points: [],
    stroke: '#ffff00',
    strokeWidth: 10,
    lineCap: 'square',
    lineJoin: 'bevel',
    opacity: 0.3
  },
  
  [ELEMENT_TYPES.ERASER]: {
    width: 20,
    height: 20,
    fill: '#ffffff',
    stroke: '#cccccc'
  },
  
  [ELEMENT_TYPES.IMAGE]: {
    src: '',
    width: 200,
    height: 150,
    preserveAspectRatio: true,
    crop: null,
    filters: [],
    opacity: 1
  },
  
  [ELEMENT_TYPES.VIDEO]: {
    src: '',
    width: 320,
    height: 180,
    poster: '',
    autoplay: false,
    controls: true,
    loop: false
  },
  
  [ELEMENT_TYPES.AUDIO]: {
    src: '',
    width: 300,
    height: 50,
    controls: true,
    autoplay: false
  },
  
  [ELEMENT_TYPES.IFRAME]: {
    src: '',
    width: 400,
    height: 300,
    border: true
  },
  
  [ELEMENT_TYPES.EMBED]: {
    code: '',
    width: 400,
    height: 300
  },
  
  [ELEMENT_TYPES.TABLE]: {
    rows: 3,
    columns: 3,
    cellWidth: 80,
    cellHeight: 30,
    borderColor: '#cccccc',
    borderWidth: 1,
    headerBackground: '#f5f5f5',
    cellPadding: 4,
    headerRow: true
  },
  
  [ELEMENT_TYPES.CHART]: {
    chartType: 'bar', // bar, line, pie, scatter
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{
        label: 'Sales',
        data: [65, 59, 80, 81],
        backgroundColor: '#3498db'
      }]
    },
    width: 300,
    height: 200,
    background: '#ffffff',
    borderColor: '#dddddd',
    borderWidth: 1
  },
  
  [ELEMENT_TYPES.SMART_ART]: {
    type: 'process', // process, hierarchy, cycle, etc.
    nodes: [],
    connectors: [],
    background: '#ffffff',
    padding: 20
  },
  
  [ELEMENT_TYPES.PIVOT_TABLE]: {
    rows: [],
    columns: [],
    values: [],
    filters: [],
    style: 'light'
  },
  
  [ELEMENT_TYPES.SPREADSHEET]: {
    rows: 10,
    columns: 5,
    cellWidth: 80,
    cellHeight: 25,
    showGrid: true,
    data: []
  },
  
  [ELEMENT_TYPES.DATA_TABLE]: {
    columns: [],
    rows: [],
    pagination: true,
    pageSize: 10,
    sortable: true,
    filterable: true
  },
  
  [ELEMENT_TYPES.BAR_CHART]: {
    data: [],
    categories: [],
    orientation: 'vertical',
    stacked: false,
    showValues: true
  },
  
  [ELEMENT_TYPES.PIE_CHART]: {
    data: [],
    labels: [],
    donut: false,
    showPercentage: true
  },
  
  [ELEMENT_TYPES.LINE_CHART]: {
    data: [],
    categories: [],
    showPoints: true,
    smooth: false,
    area: false
  },
  
  [ELEMENT_TYPES.SCATTER_PLOT]: {
    data: [],
    xAxis: 'X',
    yAxis: 'Y',
    showRegression: false
  },
  
  [ELEMENT_TYPES.GAUGE]: {
    value: 75,
    min: 0,
    max: 100,
    segments: 3,
    showValue: true
  },
  
  [ELEMENT_TYPES.PROGRESS_BAR]: {
    value: 50,
    max: 100,
    showPercentage: true,
    color: '#3498db',
    background: '#ecf0f1'
  },
  
  [ELEMENT_TYPES.BUTTON]: {
    text: 'Button',
    background: '#3498db',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: 4,
    border: 'none',
    hoverBackground: '#2980b9'
  },
  
  [ELEMENT_TYPES.CHECKBOX]: {
    checked: false,
    label: 'Checkbox',
    disabled: false,
    size: 16
  },
  
  [ELEMENT_TYPES.RADIO_BUTTON]: {
    checked: false,
    label: 'Radio button',
    disabled: false,
    size: 16,
    group: 'default'
  },
  
  [ELEMENT_TYPES.DROPDOWN]: {
    options: ['Option 1', 'Option 2', 'Option 3'],
    selected: 0,
    placeholder: 'Select an option',
    width: 200
  },
  
  [ELEMENT_TYPES.TEXT_INPUT]: {
    value: '',
    placeholder: 'Enter text',
    width: 200,
    height: 32,
    border: '1px solid #cccccc',
    borderRadius: 4,
    padding: '4px 8px'
  },
  
  [ELEMENT_TYPES.SLIDER]: {
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    width: 200,
    showValue: true
  },
  
  [ELEMENT_TYPES.TOGGLE_SWITCH]: {
    checked: false,
    label: 'Toggle',
    width: 50,
    height: 24
  },
  
  [ELEMENT_TYPES.PROGRESS_CIRCLE]: {
    value: 75,
    size: 80,
    thickness: 8,
    showPercentage: true
  },
  
  [ELEMENT_TYPES.RATING_STARS]: {
    rating: 3,
    maxRating: 5,
    size: 24,
    color: '#f1c40f',
    editable: false
  },
  
  [ELEMENT_TYPES.GROUP]: {
    children: [],
    width: 0,
    height: 0,
    x: 0,
    y: 0
  },
  
  [ELEMENT_TYPES.FRAME]: {
    width: 400,
    height: 300,
    background: '#ffffff',
    border: '1px solid #cccccc',
    padding: 20
  },
  
  [ELEMENT_TYPES.MASK]: {
    shape: 'rectangle',
    inverted: false,
    opacity: 1
  },
  
  [ELEMENT_TYPES.CLIP_PATH]: {
    data: '', // SVG path data
    inverted: false
  },
  
  [ELEMENT_TYPES.LAYER]: {
    name: 'Layer 1',
    opacity: 1,
    blendMode: 'normal',
    locked: false,
    visible: true
  },
  
  [ELEMENT_TYPES.ADJUSTMENT_LAYER]: {
    type: 'brightness', // brightness, contrast, hue, saturation, etc.
    value: 0,
    opacity: 1
  },
  
  [ELEMENT_TYPES.FILTER]: {
    type: 'blur', // blur, sharpen, noise, etc.
    value: 0,
    intensity: 1
  },
  
  [ELEMENT_TYPES.BLEND_MODE]: {
    mode: 'normal', // multiply, screen, overlay, etc.
    opacity: 1
  },
  
  [ELEMENT_TYPES.SHADOW]: {
    color: 'rgba(0,0,0,0.5)',
    blur: 5,
    offsetX: 2,
    offsetY: 2,
    spread: 0
  },
  
  [ELEMENT_TYPES.GLOW]: {
    color: '#ffff00',
    blur: 10,
    intensity: 1
  },
  
  [ELEMENT_TYPES.REFLECTION]: {
    opacity: 0.3,
    distance: 10,
    blur: 5
  },
  
  [ELEMENT_TYPES.TRANSPARENCY]: {
    alpha: 1,
    mask: null
  },
  
  [ELEMENT_TYPES.GRID]: {
    size: 20,
    color: 'rgba(0,0,0,0.1)',
    snap: true,
    visible: true
  },
  
  [ELEMENT_TYPES.GUIDE]: {
    position: 100,
    orientation: 'vertical', // vertical, horizontal
    color: '#ff0000'
  },
  
  [ELEMENT_TYPES.RULER]: {
    unit: 'px', // px, in, cm, mm
    visible: true,
    showUnits: true
  },
  
  [ELEMENT_TYPES.SLIDE]: {
    title: 'Slide 1',
    background: '#ffffff',
    transition: 'fade',
    duration: 0.5
  },
  
  [ELEMENT_TYPES.SLIDE_MASTER]: {
    background: '#ffffff',
    layout: 'title-content',
    placeholders: []
  },
  
  [ELEMENT_TYPES.TRANSITION]: {
    type: 'fade',
    duration: 0.5,
    direction: 'in'
  },
  
  [ELEMENT_TYPES.ANIMATION]: {
    type: 'fadeIn',
    duration: 1,
    delay: 0,
    easing: 'linear'
  },
  
  [ELEMENT_TYPES.PRESENTER_NOTES]: {
    text: 'Presenter notes...',
    visible: false
  },
  
  [ELEMENT_TYPES.TIMER]: {
    duration: 300, // seconds
    running: false,
    showMilliseconds: false
  },
  
  [ELEMENT_TYPES.POLL]: {
    question: 'Poll question',
    options: ['Option 1', 'Option 2'],
    multiple: false
  },
  
  [ELEMENT_TYPES.HEADER]: {
    text: '',
    height: 50,
    background: '#f8f9fa',
    borderBottom: '1px solid #dee2e6'
  },
  
  [ELEMENT_TYPES.FOOTER]: {
    text: '',
    height: 50,
    background: '#f8f9fa',
    borderTop: '1px solid #dee2e6'
  },
  
  [ELEMENT_TYPES.SIDEBAR]: {
    width: 200,
    background: '#f8f9fa',
    position: 'left'
  },
  
  [ELEMENT_TYPES.COLUMN]: {
    width: '50%',
    gap: 20,
    count: 2
  },
  
  [ELEMENT_TYPES.PAGE_BREAK]: {
    visible: true,
    style: 'dashed'
  },
  
  [ELEMENT_TYPES.SECTION]: {
    title: 'Section',
    collapsed: false,
    background: '#f8f9fa'
  },
  
  [ELEMENT_TYPES.TOC]: {
    items: [],
    depth: 3,
    dottedLeaders: true
  },
  
  [ELEMENT_TYPES.INDEX]: {
    terms: [],
    alphabetize: true
  },
  
  [ELEMENT_TYPES.BIBLIOGRAPHY]: {
    entries: [],
    style: 'apa'
  },
  
  [ELEMENT_TYPES.SMART_OBJECT]: {
    linked: false,
    updateable: true,
    originalSize: true
  },
  
  [ELEMENT_TYPES.ADJUSTMENT]: {
    type: 'brightnessContrast',
    brightness: 0,
    contrast: 0,
    hue: 0,
    saturation: 0
  },
  
  [ELEMENT_TYPES.LAYER_STYLE]: {
    effects: [],
    blendOptions: {}
  },
  
  [ELEMENT_TYPES.PATTERN]: {
    src: '',
    scale: 1,
    repeat: 'repeat'
  },
  
  [ELEMENT_TYPES.GRADIENT_MAP]: {
    colors: ['#000000', '#ffffff'],
    gradientType: 'linear'
  },
  
  [ELEMENT_TYPES.COLOR_LOOKUP]: {
    type: '3DLUT',
    file: ''
  },
  
  [ELEMENT_TYPES.CURVES]: {
    points: [[0,0], [255,255]],
    channel: 'rgb'
  },
  
  [ELEMENT_TYPES.LEVELS]: {
    input: [0, 255],
    output: [0, 255],
    gamma: 1
  },
  
  [ELEMENT_TYPES.SELECTION]: {
    type: 'rectangle',
    feather: 0,
    antiAlias: true
  },
  
  [ELEMENT_TYPES.MARQUEE]: {
    type: 'rectangle', // rectangle, ellipse, single row, single column
    style: 'normal' // normal, fixed ratio, fixed size
  },
  
  [ELEMENT_TYPES.LASSO]: {
    points: [],
    antiAlias: true
  },
  
  [ELEMENT_TYPES.MAGIC_WAND]: {
    tolerance: 32,
    contiguous: true,
    antiAlias: true
  },
  
  [ELEMENT_TYPES.CELL_RANGE]: {
    startRow: 0,
    endRow: 5,
    startCol: 0,
    endCol: 3,
    data: []
  },
  
  [ELEMENT_TYPES.FORMULA]: {
    formula: '=SUM(A1:A10)',
    result: 0,
    format: 'general'
  },
  
  [ELEMENT_TYPES.CONDITIONAL_FORMAT]: {
    type: 'dataBar', // dataBar, colorScale, iconSet, etc.
    rules: [],
    applyTo: ''
  },
  
  [ELEMENT_TYPES.DATA_VALIDATION]: {
    type: 'list', // list, wholeNumber, decimal, date, etc.
    formula1: '',
    formula2: '',
    showInputMessage: true
  },
  
  [ELEMENT_TYPES.PIVOT_CHART]: {
    pivotTable: '',
    chartType: 'column',
    showLegend: true
  },
  
  [ELEMENT_TYPES.SPARKLINE]: {
    data: [],
    type: 'line', // line, column, winloss
    color: '#3498db'
  },
  
  [ELEMENT_TYPES.SORT_FILTER]: {
    sortBy: [],
    filter: ''
  },
  
  [ELEMENT_TYPES.PIVOT_FIELD]: {
    field: '',
    area: 'row', // row, column, value, filter
    function: 'sum' // sum, count, average, etc.
  },
  
  [ELEMENT_TYPES.STYLE]: {
    name: 'Normal',
    fontFamily: 'Arial',
    fontSize: 12,
    color: '#000000',
    bold: false,
    italic: false,
    underline: false
  },
  
  [ELEMENT_TYPES.TEMPLATE]: {
    name: 'Template',
    category: 'general',
    preview: ''
  },
  
  [ELEMENT_TYPES.MAIL_MERGE]: {
    dataSource: '',
    fields: [],
    preview: false
  },
  
  [ELEMENT_TYPES.COMMENT]: {
    author: 'User',
    text: 'Comment',
    date: new Date().toISOString(),
    resolved: false
  },
  
  [ELEMENT_TYPES.TRACK_CHANGES]: {
    enabled: false,
    showChanges: true,
    authorColor: '#ff0000'
  },
  
  [ELEMENT_TYPES.HYPERLINK]: {
    text: 'Link',
    url: '',
    target: '_blank'
  },
  
  [ELEMENT_TYPES.BOOKMARK]: {
    name: 'bookmark1',
    visible: false
  },
  
  [ELEMENT_TYPES.CROSS_REFERENCE]: {
    target: '',
    type: 'page',
    format: 'page #'
  },
  
  [ELEMENT_TYPES.CARD]: {
    width: 300,
    height: 200,
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    shadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: 16
  },
  
  [ELEMENT_TYPES.MODAL]: {
    width: 400,
    height: 300,
    background: '#ffffff',
    border: 'none',
    borderRadius: 8,
    shadow: '0 4px 20px rgba(0,0,0,0.15)',
    backdrop: 'rgba(0,0,0,0.5)'
  },
  
  [ELEMENT_TYPES.TOOLTIP]: {
    text: 'Tooltip text',
    background: '#333333',
    color: '#ffffff',
    padding: '8px 12px',
    borderRadius: 4,
    arrow: true
  },
  
  [ELEMENT_TYPES.BADGE]: {
    text: 'Badge',
    background: '#e74c3c',
    color: '#ffffff',
    borderRadius: 12,
    padding: '2px 8px'
  },
  
  [ELEMENT_TYPES.AVATAR]: {
    src: '',
    size: 40,
    shape: 'circle',
    border: '2px solid #ffffff'
  },
  
  [ELEMENT_TYPES.CHIP]: {
    text: 'Chip',
    background: '#e0e0e0',
    color: '#333333',
    borderRadius: 16,
    padding: '4px 12px',
    deletable: false
  },
  
  [ELEMENT_TYPES.DIVIDER]: {
    orientation: 'horizontal',
    color: '#e0e0e0',
    thickness: 1,
    style: 'solid'
  },
  
  [ELEMENT_TYPES.ACCORDION]: {
    items: [],
    multiple: false,
    activeIndex: 0
  },
  
  [ELEMENT_TYPES.CAROUSEL]: {
    items: [],
    autoplay: false,
    interval: 3000,
    showIndicators: true
  },
  
  [ELEMENT_TYPES.TIMELINE]: {
    events: [],
    orientation: 'vertical',
    lineColor: '#3498db'
  },
  
  [ELEMENT_TYPES.STEPPER]: {
    steps: [],
    currentStep: 0,
    orientation: 'horizontal'
  },
  
  [ELEMENT_TYPES.BREADCRUMB]: {
    items: [],
    separator: '/',
    showHome: true
  },
  
  [ELEMENT_TYPES.PAGINATION]: {
    total: 10,
    current: 1,
    pageSize: 10,
    showNumbers: true
  }
};

// Factory function to create element with type-specific defaults
export const createElementFactory = (type, customProps = {}, toolProperties = {}) => {
  const baseElement = {
    id: '', // Will be set by hook
    type,
    x: customProps.x || 0,
    y: customProps.y || 0,
    width: customProps.width || 100,
    height: customProps.height || 100,
    rotation: customProps.rotation || 0,
    scaleX: customProps.scaleX || 1,
    scaleY: customProps.scaleY || 1,
    opacity: customProps.opacity || 1,
    draggable: true,
    resizable: true,
    rotatable: true,
    visible: true,
    locked: false,
    name: customProps.name || `${type}-${Date.now()}`,
    metadata: customProps.metadata || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1
  };
  
  const typeDefaults = ELEMENT_DEFAULTS[type] || {};
  
  // Merge: custom props override tool properties which override defaults
  const mergedProps = {
    ...typeDefaults,
    ...toolProperties,
    ...customProps
  };
  
  return { ...baseElement, ...mergedProps };
};

// Get element icon for UI
export const getElementIcon = (type) => {
  const icons = {
    [ELEMENT_TYPES.TEXT]: '📝',
    [ELEMENT_TYPES.TEXTBOX]: '📄',
    [ELEMENT_TYPES.PARAGRAPH]: '📝',
    [ELEMENT_TYPES.HEADING]: '🔤',
    [ELEMENT_TYPES.BULLET_LIST]: '•',
    [ELEMENT_TYPES.NUMBERED_LIST]: '1.',
    [ELEMENT_TYPES.QUOTE]: '❝',
    [ELEMENT_TYPES.CAPTION]: '📷',
    [ELEMENT_TYPES.FOOTNOTE]: '¹',
    [ELEMENT_TYPES.WATERMARK]: '💧',
    [ELEMENT_TYPES.PAGE_NUMBER]: '#️⃣',
    
    [ELEMENT_TYPES.RECTANGLE]: '⬜',
    [ELEMENT_TYPES.CIRCLE]: '⭕',
    [ELEMENT_TYPES.ELLIPSE]: '🥚',
    [ELEMENT_TYPES.LINE]: '📏',
    [ELEMENT_TYPES.ARROW]: '➡️',
    [ELEMENT_TYPES.POLYGON]: '⬢',
    [ELEMENT_TYPES.STAR]: '⭐',
    [ELEMENT_TYPES.TRIANGLE]: '▲',
    [ELEMENT_TYPES.SHAPE]: '🔷',
    [ELEMENT_TYPES.ICON]: '🔣',
    [ELEMENT_TYPES.GRADIENT]: '🌈',
    [ELEMENT_TYPES.BORDER]: '🟫',
    [ELEMENT_TYPES.HEXAGON]: '⬣',
    [ELEMENT_TYPES.OCTAGON]: '🛑',
    [ELEMENT_TYPES.HEART]: '❤️',
    [ELEMENT_TYPES.DIAMOND]: '💎',
    [ELEMENT_TYPES.SPEECH_BUBBLE]: '💬',
    [ELEMENT_TYPES.CALL_OUT]: '🗯️',
    [ELEMENT_TYPES.CLOUD]: '☁️',
    [ELEMENT_TYPES.SPIRAL]: '🌀',
    [ELEMENT_TYPES.WAVE]: '🌊',
    [ELEMENT_TYPES.GEAR]: '⚙️',
    [ELEMENT_TYPES.CROSS]: '✖️',
    [ELEMENT_TYPES.CHECKMARK]: '✅',
    
    [ELEMENT_TYPES.PATH]: '✏️',
    [ELEMENT_TYPES.BRUSH]: '🖌️',
    [ELEMENT_TYPES.PEN]: '✒️',
    [ELEMENT_TYPES.PENCIL]: '📝',
    [ELEMENT_TYPES.HIGHLIGHTER]: '🖍️',
    [ELEMENT_TYPES.ERASER]: '🧽',
    
    [ELEMENT_TYPES.IMAGE]: '🖼️',
    [ELEMENT_TYPES.VIDEO]: '🎥',
    [ELEMENT_TYPES.AUDIO]: '🎵',
    [ELEMENT_TYPES.IFRAME]: '🌐',
    [ELEMENT_TYPES.EMBED]: '🔗',
    
    [ELEMENT_TYPES.TABLE]: '📊',
    [ELEMENT_TYPES.CHART]: '📈',
    [ELEMENT_TYPES.SMART_ART]: '🧠',
    [ELEMENT_TYPES.PIVOT_TABLE]: '📋',
    [ELEMENT_TYPES.SPREADSHEET]: '📑',
    [ELEMENT_TYPES.DATA_TABLE]: '🗂️',
    [ELEMENT_TYPES.BAR_CHART]: '📊',
    [ELEMENT_TYPES.PIE_CHART]: '🥧',
    [ELEMENT_TYPES.LINE_CHART]: '📈',
    [ELEMENT_TYPES.SCATTER_PLOT]: '🪐',
    [ELEMENT_TYPES.GAUGE]: '🎚️',
    [ELEMENT_TYPES.PROGRESS_BAR]: '📊',
    
    [ELEMENT_TYPES.BUTTON]: '🔼',
    [ELEMENT_TYPES.CHECKBOX]: '☑️',
    [ELEMENT_TYPES.RADIO_BUTTON]: '🔘',
    [ELEMENT_TYPES.DROPDOWN]: '▾',
    [ELEMENT_TYPES.TEXT_INPUT]: '📝',
    [ELEMENT_TYPES.SLIDER]: '🎚️',
    [ELEMENT_TYPES.TOGGLE_SWITCH]: '🔛',
    [ELEMENT_TYPES.PROGRESS_CIRCLE]: '⭕',
    [ELEMENT_TYPES.RATING_STARS]: '⭐',
    
    [ELEMENT_TYPES.GROUP]: '📦',
    [ELEMENT_TYPES.FRAME]: '🖼️',
    [ELEMENT_TYPES.MASK]: '🎭',
    [ELEMENT_TYPES.CLIP_PATH]: '✂️',
    [ELEMENT_TYPES.LAYER]: '📄',
    [ELEMENT_TYPES.ADJUSTMENT_LAYER]: '🎨',
    [ELEMENT_TYPES.FILTER]: '🔮',
    [ELEMENT_TYPES.BLEND_MODE]: '🎭',
    [ELEMENT_TYPES.SHADOW]: '🌑',
    [ELEMENT_TYPES.GLOW]: '✨',
    [ELEMENT_TYPES.REFLECTION]: '💎',
    [ELEMENT_TYPES.TRANSPARENCY]: '💠',
    [ELEMENT_TYPES.GRID]: '🔲',
    [ELEMENT_TYPES.GUIDE]: '📐',
    [ELEMENT_TYPES.RULER]: '📏',
    
    [ELEMENT_TYPES.SLIDE]: '📽️',
    [ELEMENT_TYPES.SLIDE_MASTER]: '🏛️',
    [ELEMENT_TYPES.TRANSITION]: '🔄',
    [ELEMENT_TYPES.ANIMATION]: '✨',
    [ELEMENT_TYPES.PRESENTER_NOTES]: '🗒️',
    [ELEMENT_TYPES.TIMER]: '⏱️',
    [ELEMENT_TYPES.POLL]: '📊',
    
    [ELEMENT_TYPES.HEADER]: '📄',
    [ELEMENT_TYPES.FOOTER]: '📄',
    [ELEMENT_TYPES.SIDEBAR]: '📌',
    [ELEMENT_TYPES.COLUMN]: '📰',
    [ELEMENT_TYPES.PAGE_BREAK]: '⤵️',
    [ELEMENT_TYPES.SECTION]: '📑',
    [ELEMENT_TYPES.TOC]: '📑',
    [ELEMENT_TYPES.INDEX]: '🔍',
    [ELEMENT_TYPES.BIBLIOGRAPHY]: '📚',
    
    [ELEMENT_TYPES.SMART_OBJECT]: '🧠',
    [ELEMENT_TYPES.ADJUSTMENT]: '🎚️',
    [ELEMENT_TYPES.LAYER_STYLE]: '🎨',
    [ELEMENT_TYPES.PATTERN]: '🟩',
    [ELEMENT_TYPES.GRADIENT_MAP]: '🗺️',
    [ELEMENT_TYPES.COLOR_LOOKUP]: '🎨',
    [ELEMENT_TYPES.CURVES]: '📈',
    [ELEMENT_TYPES.LEVELS]: '📊',
    [ELEMENT_TYPES.SELECTION]: '🔍',
    [ELEMENT_TYPES.MARQUEE]: '🔲',
    [ELEMENT_TYPES.LASSO]: '🪃',
    [ELEMENT_TYPES.MAGIC_WAND]: '🪄',
    
    [ELEMENT_TYPES.CELL_RANGE]: '📊',
    [ELEMENT_TYPES.FORMULA]: '∑',
    [ELEMENT_TYPES.CONDITIONAL_FORMAT]: '🎨',
    [ELEMENT_TYPES.DATA_VALIDATION]: '✓',
    [ELEMENT_TYPES.PIVOT_CHART]: '📊',
    [ELEMENT_TYPES.SPARKLINE]: '📈',
    [ELEMENT_TYPES.SORT_FILTER]: '↕️',
    [ELEMENT_TYPES.PIVOT_FIELD]: '📊',
    
    [ELEMENT_TYPES.STYLE]: '🎨',
    [ELEMENT_TYPES.TEMPLATE]: '📋',
    [ELEMENT_TYPES.MAIL_MERGE]: '📧',
    [ELEMENT_TYPES.COMMENT]: '💬',
    [ELEMENT_TYPES.TRACK_CHANGES]: '✏️',
    [ELEMENT_TYPES.HYPERLINK]: '🔗',
    [ELEMENT_TYPES.BOOKMARK]: '🔖',
    [ELEMENT_TYPES.CROSS_REFERENCE]: '↔️',
    
    [ELEMENT_TYPES.CARD]: '📇',
    [ELEMENT_TYPES.MODAL]: '🗨️',
    [ELEMENT_TYPES.TOOLTIP]: '💡',
    [ELEMENT_TYPES.BADGE]: '🏷️',
    [ELEMENT_TYPES.AVATAR]: '👤',
    [ELEMENT_TYPES.CHIP]: '🔘',
    [ELEMENT_TYPES.DIVIDER]: '➖',
    [ELEMENT_TYPES.ACCORDION]: '📑',
    [ELEMENT_TYPES.CAROUSEL]: '🖼️',
    [ELEMENT_TYPES.TIMELINE]: '⏳',
    [ELEMENT_TYPES.STEPPER]: '🔢',
    [ELEMENT_TYPES.BREADCRUMB]: '🍞',
    [ELEMENT_TYPES.PAGINATION]: '🔢'
  };
  
  return icons[type] || '🔘';
};

// Get element category for organization
export const getElementCategory = (type) => {
  const categories = {
    [ELEMENT_TYPES.TEXT]: 'text',
    [ELEMENT_TYPES.TEXTBOX]: 'text',
    [ELEMENT_TYPES.PARAGRAPH]: 'text',
    [ELEMENT_TYPES.HEADING]: 'text',
    [ELEMENT_TYPES.BULLET_LIST]: 'text',
    [ELEMENT_TYPES.NUMBERED_LIST]: 'text',
    [ELEMENT_TYPES.QUOTE]: 'text',
    [ELEMENT_TYPES.CAPTION]: 'text',
    [ELEMENT_TYPES.FOOTNOTE]: 'text',
    [ELEMENT_TYPES.WATERMARK]: 'text',
    [ELEMENT_TYPES.PAGE_NUMBER]: 'text',
    
    [ELEMENT_TYPES.RECTANGLE]: 'shape',
    [ELEMENT_TYPES.CIRCLE]: 'shape',
    [ELEMENT_TYPES.ELLIPSE]: 'shape',
    [ELEMENT_TYPES.LINE]: 'shape',
    [ELEMENT_TYPES.ARROW]: 'shape',
    [ELEMENT_TYPES.POLYGON]: 'shape',
    [ELEMENT_TYPES.STAR]: 'shape',
    [ELEMENT_TYPES.TRIANGLE]: 'shape',
    [ELEMENT_TYPES.SHAPE]: 'shape',
    [ELEMENT_TYPES.ICON]: 'shape',
    [ELEMENT_TYPES.GRADIENT]: 'shape',
    [ELEMENT_TYPES.BORDER]: 'shape',
    [ELEMENT_TYPES.HEXAGON]: 'shape',
    [ELEMENT_TYPES.OCTAGON]: 'shape',
    [ELEMENT_TYPES.HEART]: 'shape',
    [ELEMENT_TYPES.DIAMOND]: 'shape',
    [ELEMENT_TYPES.SPEECH_BUBBLE]: 'shape',
    [ELEMENT_TYPES.CALL_OUT]: 'shape',
    [ELEMENT_TYPES.CLOUD]: 'shape',
    [ELEMENT_TYPES.SPIRAL]: 'shape',
    [ELEMENT_TYPES.WAVE]: 'shape',
    [ELEMENT_TYPES.GEAR]: 'shape',
    [ELEMENT_TYPES.CROSS]: 'shape',
    [ELEMENT_TYPES.CHECKMARK]: 'shape',
    
    [ELEMENT_TYPES.PATH]: 'drawing',
    [ELEMENT_TYPES.BRUSH]: 'drawing',
    [ELEMENT_TYPES.PEN]: 'drawing',
    [ELEMENT_TYPES.PENCIL]: 'drawing',
    [ELEMENT_TYPES.HIGHLIGHTER]: 'drawing',
    [ELEMENT_TYPES.ERASER]: 'drawing',
    
    [ELEMENT_TYPES.IMAGE]: 'media',
    [ELEMENT_TYPES.VIDEO]: 'media',
    [ELEMENT_TYPES.AUDIO]: 'media',
    [ELEMENT_TYPES.IFRAME]: 'media',
    [ELEMENT_TYPES.EMBED]: 'media',
    
    [ELEMENT_TYPES.TABLE]: 'data',
    [ELEMENT_TYPES.CHART]: 'data',
    [ELEMENT_TYPES.SMART_ART]: 'data',
    [ELEMENT_TYPES.PIVOT_TABLE]: 'data',
    [ELEMENT_TYPES.SPREADSHEET]: 'data',
    [ELEMENT_TYPES.DATA_TABLE]: 'data',
    [ELEMENT_TYPES.BAR_CHART]: 'data',
    [ELEMENT_TYPES.PIE_CHART]: 'data',
    [ELEMENT_TYPES.LINE_CHART]: 'data',
    [ELEMENT_TYPES.SCATTER_PLOT]: 'data',
    [ELEMENT_TYPES.GAUGE]: 'data',
    [ELEMENT_TYPES.PROGRESS_BAR]: 'data',
    
    [ELEMENT_TYPES.BUTTON]: 'ui',
    [ELEMENT_TYPES.CHECKBOX]: 'ui',
    [ELEMENT_TYPES.RADIO_BUTTON]: 'ui',
    [ELEMENT_TYPES.DROPDOWN]: 'ui',
    [ELEMENT_TYPES.TEXT_INPUT]: 'ui',
    [ELEMENT_TYPES.SLIDER]: 'ui',
    [ELEMENT_TYPES.TOGGLE_SWITCH]: 'ui',
    [ELEMENT_TYPES.PROGRESS_CIRCLE]: 'ui',
    [ELEMENT_TYPES.RATING_STARS]: 'ui',
    
    [ELEMENT_TYPES.GROUP]: 'special',
    [ELEMENT_TYPES.FRAME]: 'special',
    [ELEMENT_TYPES.MASK]: 'special',
    [ELEMENT_TYPES.CLIP_PATH]: 'special',
    [ELEMENT_TYPES.LAYER]: 'special',
    [ELEMENT_TYPES.ADJUSTMENT_LAYER]: 'special',
    [ELEMENT_TYPES.FILTER]: 'special',
    [ELEMENT_TYPES.BLEND_MODE]: 'special',
    [ELEMENT_TYPES.SHADOW]: 'special',
    [ELEMENT_TYPES.GLOW]: 'special',
    [ELEMENT_TYPES.REFLECTION]: 'special',
    [ELEMENT_TYPES.TRANSPARENCY]: 'special',
    [ELEMENT_TYPES.GRID]: 'special',
    [ELEMENT_TYPES.GUIDE]: 'special',
    [ELEMENT_TYPES.RULER]: 'special',
    
    [ELEMENT_TYPES.SLIDE]: 'presentation',
    [ELEMENT_TYPES.SLIDE_MASTER]: 'presentation',
    [ELEMENT_TYPES.TRANSITION]: 'presentation',
    [ELEMENT_TYPES.ANIMATION]: 'presentation',
    [ELEMENT_TYPES.PRESENTER_NOTES]: 'presentation',
    [ELEMENT_TYPES.TIMER]: 'presentation',
    [ELEMENT_TYPES.POLL]: 'presentation',
    
    [ELEMENT_TYPES.HEADER]: 'document',
    [ELEMENT_TYPES.FOOTER]: 'document',
    [ELEMENT_TYPES.SIDEBAR]: 'document',
    [ELEMENT_TYPES.COLUMN]: 'document',
    [ELEMENT_TYPES.PAGE_BREAK]: 'document',
    [ELEMENT_TYPES.SECTION]: 'document',
    [ELEMENT_TYPES.TOC]: 'document',
    [ELEMENT_TYPES.INDEX]: 'document',
    [ELEMENT_TYPES.BIBLIOGRAPHY]: 'document',
    
    [ELEMENT_TYPES.SMART_OBJECT]: 'photoshop',
    [ELEMENT_TYPES.ADJUSTMENT]: 'photoshop',
    [ELEMENT_TYPES.LAYER_STYLE]: 'photoshop',
    [ELEMENT_TYPES.PATTERN]: 'photoshop',
    [ELEMENT_TYPES.GRADIENT_MAP]: 'photoshop',
    [ELEMENT_TYPES.COLOR_LOOKUP]: 'photoshop',
    [ELEMENT_TYPES.CURVES]: 'photoshop',
    [ELEMENT_TYPES.LEVELS]: 'photoshop',
    [ELEMENT_TYPES.SELECTION]: 'photoshop',
    [ELEMENT_TYPES.MARQUEE]: 'photoshop',
    [ELEMENT_TYPES.LASSO]: 'photoshop',
    [ELEMENT_TYPES.MAGIC_WAND]: 'photoshop',
    
    [ELEMENT_TYPES.CELL_RANGE]: 'excel',
    [ELEMENT_TYPES.FORMULA]: 'excel',
    [ELEMENT_TYPES.CONDITIONAL_FORMAT]: 'excel',
    [ELEMENT_TYPES.DATA_VALIDATION]: 'excel',
    [ELEMENT_TYPES.PIVOT_CHART]: 'excel',
    [ELEMENT_TYPES.SPARKLINE]: 'excel',
    [ELEMENT_TYPES.SORT_FILTER]: 'excel',
    [ELEMENT_TYPES.PIVOT_FIELD]: 'excel',
    
    [ELEMENT_TYPES.STYLE]: 'word',
    [ELEMENT_TYPES.TEMPLATE]: 'word',
    [ELEMENT_TYPES.MAIL_MERGE]: 'word',
    [ELEMENT_TYPES.COMMENT]: 'word',
    [ELEMENT_TYPES.TRACK_CHANGES]: 'word',
    [ELEMENT_TYPES.HYPERLINK]: 'word',
    [ELEMENT_TYPES.BOOKMARK]: 'word',
    [ELEMENT_TYPES.CROSS_REFERENCE]: 'word',
    
    [ELEMENT_TYPES.CARD]: 'web',
    [ELEMENT_TYPES.MODAL]: 'web',
    [ELEMENT_TYPES.TOOLTIP]: 'web',
    [ELEMENT_TYPES.BADGE]: 'web',
    [ELEMENT_TYPES.AVATAR]: 'web',
    [ELEMENT_TYPES.CHIP]: 'web',
    [ELEMENT_TYPES.DIVIDER]: 'web',
    [ELEMENT_TYPES.ACCORDION]: 'web',
    [ELEMENT_TYPES.CAROUSEL]: 'web',
    [ELEMENT_TYPES.TIMELINE]: 'web',
    [ELEMENT_TYPES.STEPPER]: 'web',
    [ELEMENT_TYPES.BREADCRUMB]: 'web',
    [ELEMENT_TYPES.PAGINATION]: 'web'
  };
  
  return categories[type] || 'other';
};

// Validate element properties
export const validateElement = (element) => {
  const errors = [];
  
  if (!element.type) errors.push('Element type is required');
  if (element.x === undefined || element.y === undefined) errors.push('Position is required');
  
  // Type-specific validations
  switch (element.type) {
    case ELEMENT_TYPES.IMAGE:
      if (!element.src) errors.push('Image source is required');
      break;
    case ELEMENT_TYPES.TEXT:
      if (element.text === undefined) errors.push('Text content is required');
      break;
    case ELEMENT_TYPES.TABLE:
      if (!element.rows || !element.columns) errors.push('Table rows and columns are required');
      break;
    case ELEMENT_TYPES.VIDEO:
      if (!element.src) errors.push('Video source is required');
      break;
    case ELEMENT_TYPES.CHART:
      if (!element.data) errors.push('Chart data is required');
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Calculate approximate element complexity (for performance optimization)
export const calculateElementComplexity = (element) => {
  let complexity = 1;
  
  switch (element.type) {
    case ELEMENT_TYPES.PATH:
    case ELEMENT_TYPES.BRUSH:
    case ELEMENT_TYPES.PEN:
      complexity = (element.points?.length || 0) / 10;
      break;
    case ELEMENT_TYPES.TABLE:
      complexity = (element.rows || 0) * (element.columns || 0) * 0.5;
      break;
    case ELEMENT_TYPES.CHART:
      complexity = 2;
      break;
    case ELEMENT_TYPES.IMAGE:
      complexity = 1.5;
      break;
    case ELEMENT_TYPES.VIDEO:
      complexity = 3;
      break;
    case ELEMENT_TYPES.GROUP:
      complexity = 0.5; // Groups are lightweight
      break;
    case ELEMENT_TYPES.SPREADSHEET:
      complexity = (element.rows || 0) * (element.columns || 0) * 0.2;
      break;
  }
  
  return Math.max(0.1, Math.min(complexity, 10));
};

export function getElementDefaults(type) {
  return ELEMENT_DEFAULTS[type] ?? {};
}

// Get human-readable type name for UI display
export const getElementTypeName = (type) => {
  const typeNames = {
    [ELEMENT_TYPES.TEXT]: 'Text',
    [ELEMENT_TYPES.TEXTBOX]: 'Text Box',
    [ELEMENT_TYPES.PARAGRAPH]: 'Paragraph',
    [ELEMENT_TYPES.HEADING]: 'Heading',
    [ELEMENT_TYPES.BULLET_LIST]: 'Bullet List',
    [ELEMENT_TYPES.NUMBERED_LIST]: 'Numbered List',
    [ELEMENT_TYPES.QUOTE]: 'Quote',
    [ELEMENT_TYPES.CAPTION]: 'Caption',
    [ELEMENT_TYPES.FOOTNOTE]: 'Footnote',
    [ELEMENT_TYPES.WATERMARK]: 'Watermark',
    [ELEMENT_TYPES.PAGE_NUMBER]: 'Page Number',
    
    [ELEMENT_TYPES.RECTANGLE]: 'Rectangle',
    [ELEMENT_TYPES.CIRCLE]: 'Circle',
    [ELEMENT_TYPES.ELLIPSE]: 'Ellipse',
    [ELEMENT_TYPES.LINE]: 'Line',
    [ELEMENT_TYPES.ARROW]: 'Arrow',
    [ELEMENT_TYPES.POLYGON]: 'Polygon',
    [ELEMENT_TYPES.STAR]: 'Star',
    [ELEMENT_TYPES.TRIANGLE]: 'Triangle',
    [ELEMENT_TYPES.SHAPE]: 'Shape',
    [ELEMENT_TYPES.ICON]: 'Icon',
    [ELEMENT_TYPES.GRADIENT]: 'Gradient',
    [ELEMENT_TYPES.BORDER]: 'Border',
    [ELEMENT_TYPES.HEXAGON]: 'Hexagon',
    [ELEMENT_TYPES.OCTAGON]: 'Octagon',
    [ELEMENT_TYPES.HEART]: 'Heart',
    [ELEMENT_TYPES.DIAMOND]: 'Diamond',
    [ELEMENT_TYPES.SPEECH_BUBBLE]: 'Speech Bubble',
    [ELEMENT_TYPES.CALL_OUT]: 'Call Out',
    [ELEMENT_TYPES.CLOUD]: 'Cloud',
    [ELEMENT_TYPES.SPIRAL]: 'Spiral',
    [ELEMENT_TYPES.WAVE]: 'Wave',
    [ELEMENT_TYPES.GEAR]: 'Gear',
    [ELEMENT_TYPES.CROSS]: 'Cross',
    [ELEMENT_TYPES.CHECKMARK]: 'Checkmark',
    
    [ELEMENT_TYPES.PATH]: 'Path',
    [ELEMENT_TYPES.BRUSH]: 'Brush',
    [ELEMENT_TYPES.PEN]: 'Pen',
    [ELEMENT_TYPES.PENCIL]: 'Pencil',
    [ELEMENT_TYPES.HIGHLIGHTER]: 'Highlighter',
    [ELEMENT_TYPES.ERASER]: 'Eraser',
    
    [ELEMENT_TYPES.IMAGE]: 'Image',
    [ELEMENT_TYPES.VIDEO]: 'Video',
    [ELEMENT_TYPES.AUDIO]: 'Audio',
    [ELEMENT_TYPES.IFRAME]: 'iFrame',
    [ELEMENT_TYPES.EMBED]: 'Embed',
    
    [ELEMENT_TYPES.TABLE]: 'Table',
    [ELEMENT_TYPES.CHART]: 'Chart',
    [ELEMENT_TYPES.SMART_ART]: 'Smart Art',
    [ELEMENT_TYPES.PIVOT_TABLE]: 'Pivot Table',
    [ELEMENT_TYPES.SPREADSHEET]: 'Spreadsheet',
    [ELEMENT_TYPES.DATA_TABLE]: 'Data Table',
    [ELEMENT_TYPES.BAR_CHART]: 'Bar Chart',
    [ELEMENT_TYPES.PIE_CHART]: 'Pie Chart',
    [ELEMENT_TYPES.LINE_CHART]: 'Line Chart',
    [ELEMENT_TYPES.SCATTER_PLOT]: 'Scatter Plot',
    [ELEMENT_TYPES.GAUGE]: 'Gauge',
    [ELEMENT_TYPES.PROGRESS_BAR]: 'Progress Bar',
    
    [ELEMENT_TYPES.BUTTON]: 'Button',
    [ELEMENT_TYPES.CHECKBOX]: 'Checkbox',
    [ELEMENT_TYPES.RADIO_BUTTON]: 'Radio Button',
    [ELEMENT_TYPES.DROPDOWN]: 'Dropdown',
    [ELEMENT_TYPES.TEXT_INPUT]: 'Text Input',
    [ELEMENT_TYPES.SLIDER]: 'Slider',
    [ELEMENT_TYPES.TOGGLE_SWITCH]: 'Toggle Switch',
    [ELEMENT_TYPES.PROGRESS_CIRCLE]: 'Progress Circle',
    [ELEMENT_TYPES.RATING_STARS]: 'Rating Stars',
    
    [ELEMENT_TYPES.GROUP]: 'Group',
    [ELEMENT_TYPES.FRAME]: 'Frame',
    [ELEMENT_TYPES.MASK]: 'Mask',
    [ELEMENT_TYPES.CLIP_PATH]: 'Clip Path',
    [ELEMENT_TYPES.LAYER]: 'Layer',
    [ELEMENT_TYPES.ADJUSTMENT_LAYER]: 'Adjustment Layer',
    [ELEMENT_TYPES.FILTER]: 'Filter',
    [ELEMENT_TYPES.BLEND_MODE]: 'Blend Mode',
    [ELEMENT_TYPES.SHADOW]: 'Shadow',
    [ELEMENT_TYPES.GLOW]: 'Glow',
    [ELEMENT_TYPES.REFLECTION]: 'Reflection',
    [ELEMENT_TYPES.TRANSPARENCY]: 'Transparency',
    [ELEMENT_TYPES.GRID]: 'Grid',
    [ELEMENT_TYPES.GUIDE]: 'Guide',
    [ELEMENT_TYPES.RULER]: 'Ruler',
    
    [ELEMENT_TYPES.SLIDE]: 'Slide',
    [ELEMENT_TYPES.SLIDE_MASTER]: 'Slide Master',
    [ELEMENT_TYPES.TRANSITION]: 'Transition',
    [ELEMENT_TYPES.ANIMATION]: 'Animation',
    [ELEMENT_TYPES.PRESENTER_NOTES]: 'Presenter Notes',
    [ELEMENT_TYPES.TIMER]: 'Timer',
    [ELEMENT_TYPES.POLL]: 'Poll',
    
    [ELEMENT_TYPES.HEADER]: 'Header',
    [ELEMENT_TYPES.FOOTER]: 'Footer',
    [ELEMENT_TYPES.SIDEBAR]: 'Sidebar',
    [ELEMENT_TYPES.COLUMN]: 'Column',
    [ELEMENT_TYPES.PAGE_BREAK]: 'Page Break',
    [ELEMENT_TYPES.SECTION]: 'Section',
    [ELEMENT_TYPES.TOC]: 'Table of Contents',
    [ELEMENT_TYPES.INDEX]: 'Index',
    [ELEMENT_TYPES.BIBLIOGRAPHY]: 'Bibliography',
    
    [ELEMENT_TYPES.SMART_OBJECT]: 'Smart Object',
    [ELEMENT_TYPES.ADJUSTMENT]: 'Adjustment',
    [ELEMENT_TYPES.LAYER_STYLE]: 'Layer Style',
    [ELEMENT_TYPES.PATTERN]: 'Pattern',
    [ELEMENT_TYPES.GRADIENT_MAP]: 'Gradient Map',
    [ELEMENT_TYPES.COLOR_LOOKUP]: 'Color Lookup',
    [ELEMENT_TYPES.CURVES]: 'Curves',
    [ELEMENT_TYPES.LEVELS]: 'Levels',
    [ELEMENT_TYPES.SELECTION]: 'Selection',
    [ELEMENT_TYPES.MARQUEE]: 'Marquee',
    [ELEMENT_TYPES.LASSO]: 'Lasso',
    [ELEMENT_TYPES.MAGIC_WAND]: 'Magic Wand',
    
    [ELEMENT_TYPES.CELL_RANGE]: 'Cell Range',
    [ELEMENT_TYPES.FORMULA]: 'Formula',
    [ELEMENT_TYPES.CONDITIONAL_FORMAT]: 'Conditional Format',
    [ELEMENT_TYPES.DATA_VALIDATION]: 'Data Validation',
    [ELEMENT_TYPES.PIVOT_CHART]: 'Pivot Chart',
    [ELEMENT_TYPES.SPARKLINE]: 'Sparkline',
    [ELEMENT_TYPES.SORT_FILTER]: 'Sort/Filter',
    [ELEMENT_TYPES.PIVOT_FIELD]: 'Pivot Field',
    
    [ELEMENT_TYPES.STYLE]: 'Style',
    [ELEMENT_TYPES.TEMPLATE]: 'Template',
    [ELEMENT_TYPES.MAIL_MERGE]: 'Mail Merge',
    [ELEMENT_TYPES.COMMENT]: 'Comment',
    [ELEMENT_TYPES.TRACK_CHANGES]: 'Track Changes',
    [ELEMENT_TYPES.HYPERLINK]: 'Hyperlink',
    [ELEMENT_TYPES.BOOKMARK]: 'Bookmark',
    [ELEMENT_TYPES.CROSS_REFERENCE]: 'Cross Reference',
    
    [ELEMENT_TYPES.CARD]: 'Card',
    [ELEMENT_TYPES.MODAL]: 'Modal',
    [ELEMENT_TYPES.TOOLTIP]: 'Tooltip',
    [ELEMENT_TYPES.BADGE]: 'Badge',
    [ELEMENT_TYPES.AVATAR]: 'Avatar',
    [ELEMENT_TYPES.CHIP]: 'Chip',
    [ELEMENT_TYPES.DIVIDER]: 'Divider',
    [ELEMENT_TYPES.ACCORDION]: 'Accordion',
    [ELEMENT_TYPES.CAROUSEL]: 'Carousel',
    [ELEMENT_TYPES.TIMELINE]: 'Timeline',
    [ELEMENT_TYPES.STEPPER]: 'Stepper',
    [ELEMENT_TYPES.BREADCRUMB]: 'Breadcrumb',
    [ELEMENT_TYPES.PAGINATION]: 'Pagination'
  };
  
  return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Get all element types by category for UI organization
export const getElementsByCategory = () => {
  const categories = {};
  
  for (const [typeKey, typeValue] of Object.entries(ELEMENT_TYPES)) {
    const category = getElementCategory(typeValue);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({
      type: typeValue,
      key: typeKey, // The constant key (e.g., "TEXT", "RECTANGLE")
      name: getElementTypeName(typeValue),
      icon: getElementIcon(typeValue)
    });
  }
  
  return categories;
};

// Get element description for tooltips
export const getElementDescription = (type) => {
  const descriptions = {
    [ELEMENT_TYPES.TEXT]: 'Add text to your design',
    [ELEMENT_TYPES.TEXTBOX]: 'Text container with background',
    [ELEMENT_TYPES.IMAGE]: 'Insert an image',
    [ELEMENT_TYPES.SHAPE]: 'Create various shapes',
    [ELEMENT_TYPES.CHART]: 'Visualize data with charts',
    [ELEMENT_TYPES.TABLE]: 'Organize data in tables',
    [ELEMENT_TYPES.ICON]: 'Use icons and symbols',
    [ELEMENT_TYPES.BUTTON]: 'Interactive button element',
    [ELEMENT_TYPES.VIDEO]: 'Embed video content',
    [ELEMENT_TYPES.AUDIO]: 'Embed audio content',
    [ELEMENT_TYPES.GROUP]: 'Group multiple elements',
    [ELEMENT_TYPES.FRAME]: 'Container for other elements',
    [ELEMENT_TYPES.SHADOW]: 'Add shadow effects',
    [ELEMENT_TYPES.GLOW]: 'Add glow effects',
    [ELEMENT_TYPES.GRADIENT]: 'Create gradient fills',
    [ELEMENT_TYPES.BORDER]: 'Custom borders and strokes',
    [ELEMENT_TYPES.SLIDE]: 'Presentation slide',
    [ELEMENT_TYPES.SPREADSHEET]: 'Excel-like spreadsheet',
    [ELEMENT_TYPES.SMART_ART]: 'Smart diagram graphics',
    [ELEMENT_TYPES.FORMULA]: 'Excel formulas',
    [ELEMENT_TYPES.PIVOT_TABLE]: 'Data analysis table',
    [ELEMENT_TYPES.MASK]: 'Masking element',
    [ELEMENT_TYPES.FILTER]: 'Image filters and effects',
    [ELEMENT_TYPES.ANIMATION]: 'Animated elements',
    [ELEMENT_TYPES.TRANSITION]: 'Slide transitions',
    [ELEMENT_TYPES.PROGRESS_BAR]: 'Progress indicators',
    [ELEMENT_TYPES.GAUGE]: 'Gauge and meter elements',
    [ELEMENT_TYPES.TIMELINE]: 'Timeline visualization',
    [ELEMENT_TYPES.CAROUSEL]: 'Image carousel',
    [ELEMENT_TYPES.ACCORDION]: 'Collapsible content',
    [ELEMENT_TYPES.CARD]: 'Modern card design',
    [ELEMENT_TYPES.MODAL]: 'Popup dialog',
    [ELEMENT_TYPES.TOOLTIP]: 'Tooltip element'
  };
  
  return descriptions[type] || 'Design element';
};

// Check if element type supports specific features
export const elementSupportsFeature = (type, feature) => {
  const featureSupport = {
    [ELEMENT_TYPES.TEXT]: ['editable', 'styling', 'font', 'color', 'alignment'],
    [ELEMENT_TYPES.TEXTBOX]: ['editable', 'styling', 'background', 'border', 'padding'],
    [ELEMENT_TYPES.IMAGE]: ['resize', 'crop', 'filter', 'opacity', 'rotation'],
    [ELEMENT_TYPES.SHAPE]: ['fill', 'stroke', 'gradient', 'shadow', 'rotation'],
    [ELEMENT_TYPES.CHART]: ['data', 'colors', 'labels', 'legend', 'animation'],
    [ELEMENT_TYPES.TABLE]: ['rows', 'columns', 'cells', 'borders', 'merge'],
    [ELEMENT_TYPES.VIDEO]: ['playback', 'controls', 'volume', 'looping', 'poster'],
    [ELEMENT_TYPES.AUDIO]: ['playback', 'controls', 'volume', 'looping'],
    [ELEMENT_TYPES.GROUP]: ['children', 'transform', 'nested'],
    [ELEMENT_TYPES.FRAME]: ['background', 'border', 'padding', 'shadow'],
    [ELEMENT_TYPES.BUTTON]: ['text', 'states', 'hover', 'click', 'disabled'],
    [ELEMENT_TYPES.SLIDE]: ['transition', 'animation', 'notes', 'timer'],
    [ELEMENT_TYPES.SPREADSHEET]: ['formulas', 'formatting', 'charts', 'filters'],
    [ELEMENT_TYPES.PIVOT_TABLE]: ['pivot', 'aggregation', 'filter', 'sort'],
    [ELEMENT_TYPES.FORMULA]: ['calculation', 'references', 'functions'],
    [ELEMENT_TYPES.SMART_ART]: ['layout', 'nodes', 'connectors', 'colors'],
    [ELEMENT_TYPES.MASK]: ['clipping', 'inverted', 'feather', 'opacity'],
    [ELEMENT_TYPES.FILTER]: ['blur', 'brightness', 'contrast', 'hue', 'saturation'],
    [ELEMENT_TYPES.ANIMATION]: ['timing', 'easing', 'delay', 'repeat', 'direction'],
    [ELEMENT_TYPES.TRANSITION]: ['duration', 'direction', 'type'],
    [ELEMENT_TYPES.CAROUSEL]: ['autoplay', 'navigation', 'indicators', 'slides'],
    [ELEMENT_TYPES.ACCORDION]: ['collapse', 'expand', 'multiple', 'animation'],
    [ELEMENT_TYPES.MODAL]: ['open', 'close', 'backdrop', 'animation'],
    [ELEMENT_TYPES.TOOLTIP]: ['position', 'trigger', 'content', 'arrow']
  };
  
  return featureSupport[type]?.includes(feature) || false;
};

// Get recommended properties for quick editing
export const getQuickEditProperties = (type) => {
  const quickProps = {
    [ELEMENT_TYPES.TEXT]: ['text', 'fontSize', 'fontFamily', 'fill', 'fontWeight'],
    [ELEMENT_TYPES.TEXTBOX]: ['text', 'fontSize', 'background', 'borderColor', 'borderRadius'],
    [ELEMENT_TYPES.IMAGE]: ['width', 'height', 'opacity', 'rotation', 'filter'],
    [ELEMENT_TYPES.SHAPE]: ['fill', 'stroke', 'strokeWidth', 'cornerRadius', 'shadowBlur'],
    [ELEMENT_TYPES.CIRCLE]: ['radius', 'fill', 'stroke', 'strokeWidth'],
    [ELEMENT_TYPES.RECTANGLE]: ['width', 'height', 'fill', 'stroke', 'cornerRadius'],
    [ELEMENT_TYPES.LINE]: ['points', 'stroke', 'strokeWidth', 'dash'],
    [ELEMENT_TYPES.ARROW]: ['points', 'stroke', 'strokeWidth', 'pointerLength'],
    [ELEMENT_TYPES.TABLE]: ['rows', 'columns', 'borderColor', 'cellWidth', 'cellHeight'],
    [ELEMENT_TYPES.CHART]: ['chartType', 'data', 'width', 'height', 'colors'],
    [ELEMENT_TYPES.BUTTON]: ['text', 'background', 'color', 'borderRadius', 'padding'],
    [ELEMENT_TYPES.VIDEO]: ['src', 'width', 'height', 'autoplay', 'controls'],
    [ELEMENT_TYPES.AUDIO]: ['src', 'autoplay', 'controls', 'loop'],
    [ELEMENT_TYPES.GROUP]: ['x', 'y', 'rotation', 'scaleX', 'scaleY'],
    [ELEMENT_TYPES.FRAME]: ['width', 'height', 'background', 'border', 'padding'],
    [ELEMENT_TYPES.SLIDE]: ['background', 'transition', 'duration', 'title'],
    [ELEMENT_TYPES.SPREADSHEET]: ['rows', 'columns', 'cellWidth', 'cellHeight'],
    [ELEMENT_TYPES.PIVOT_TABLE]: ['rows', 'columns', 'values', 'filters'],
    [ELEMENT_TYPES.FORMULA]: ['formula', 'format', 'precision'],
    [ELEMENT_TYPES.SMART_ART]: ['type', 'nodes', 'layout', 'colors'],
    [ELEMENT_TYPES.MASK]: ['shape', 'inverted', 'feather', 'opacity'],
    [ELEMENT_TYPES.FILTER]: ['type', 'value', 'intensity'],
    [ELEMENT_TYPES.ANIMATION]: ['type', 'duration', 'delay', 'easing'],
    [ELEMENT_TYPES.TRANSITION]: ['type', 'duration', 'direction'],
    [ELEMENT_TYPES.CAROUSEL]: ['items', 'autoplay', 'interval', 'showIndicators'],
    [ELEMENT_TYPES.ACCORDION]: ['items', 'multiple', 'activeIndex'],
    [ELEMENT_TYPES.MODAL]: ['width', 'height', 'background', 'backdrop'],
    [ELEMENT_TYPES.TOOLTIP]: ['text', 'position', 'background', 'color']
  };
  
  return quickProps[type] || ['x', 'y', 'width', 'height', 'rotation'];
};

// Get default element dimensions based on type
export const getDefaultElementDimensions = (type) => {
  const dimensions = {
    [ELEMENT_TYPES.TEXT]: { width: 200, height: 50 },
    [ELEMENT_TYPES.TEXTBOX]: { width: 200, height: 100 },
    [ELEMENT_TYPES.PARAGRAPH]: { width: 400, height: 120 },
    [ELEMENT_TYPES.HEADING]: { width: 300, height: 60 },
    [ELEMENT_TYPES.IMAGE]: { width: 200, height: 150 },
    [ELEMENT_TYPES.VIDEO]: { width: 320, height: 180 },
    [ELEMENT_TYPES.RECTANGLE]: { width: 100, height: 60 },
    [ELEMENT_TYPES.CIRCLE]: { width: 80, height: 80 },
    [ELEMENT_TYPES.TABLE]: { width: 240, height: 90 },
    [ELEMENT_TYPES.CHART]: { width: 300, height: 200 },
    [ELEMENT_TYPES.SPREADSHEET]: { width: 400, height: 250 },
    [ELEMENT_TYPES.PIVOT_TABLE]: { width: 350, height: 250 },
    [ELEMENT_TYPES.SLIDE]: { width: 800, height: 450 },
    [ELEMENT_TYPES.BUTTON]: { width: 100, height: 40 },
    [ELEMENT_TYPES.DROPDOWN]: { width: 200, height: 32 },
    [ELEMENT_TYPES.TEXT_INPUT]: { width: 200, height: 32 },
    [ELEMENT_TYPES.CARD]: { width: 300, height: 200 },
    [ELEMENT_TYPES.MODAL]: { width: 400, height: 300 },
    [ELEMENT_TYPES.FRAME]: { width: 400, height: 300 },
    [ELEMENT_TYPES.GROUP]: { width: 200, height: 150 },
    [ELEMENT_TYPES.SHAPE]: { width: 100, height: 100 },
    [ELEMENT_TYPES.ICON]: { width: 40, height: 40 },
    [ELEMENT_TYPES.CAROUSEL]: { width: 400, height: 250 },
    [ELEMENT_TYPES.ACCORDION]: { width: 300, height: 200 },
    [ELEMENT_TYPES.TIMELINE]: { width: 400, height: 300 },
    [ELEMENT_TYPES.STEPPER]: { width: 400, height: 60 }
  };
  
  return dimensions[type] || { width: 100, height: 100 };
};