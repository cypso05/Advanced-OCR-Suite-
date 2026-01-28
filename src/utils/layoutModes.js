// src/app/features/ocr/utils/layoutModes.js
export const LAYOUT_MODES = {
  word: {
    id: 'word',
    name: 'Microsoft Word',
    description: 'Document editing with text focus',
    canvasSize: { width: 612, height: 792 }, // Letter size @ 72 DPI
    grid: { enabled: true, size: 18, snap: true, color: '#e0e0e0', opacity: 0.5 },
    guides: { enabled: true, snap: true, margin: 72, showMargins: true },
    defaultTool: 'text',
    toolset: ['select', 'text', 'rectangle', 'line', 'image', 'table'],
    defaultFont: { family: 'Times New Roman', size: 12, color: '#000000' },
    pageBackground: '#ffffff',
    showRulers: true,
    unit: 'pt',
  },
  powerpoint: {
    id: 'presentation',
    name: 'PowerPoint',
    description: 'Slide design and presentation layout',
    canvasSize: { width: 960, height: 540 }, // 16:9 HD
    grid: { enabled: true, size: 10, snap: true, color: '#c0c0c0', opacity: 0.3 },
    guides: { enabled: true, snap: true, showCenter: true, showThirds: true },
    defaultTool: 'select',
    toolset: ['select', 'text', 'rectangle', 'circle', 'line', 'arrow', 'shape', 'image', 'chart'],
    defaultFont: { family: 'Calibri', size: 18, color: '#000000' },
    pageBackground: '#f0f0f0',
    slideTemplates: ['title', 'content', 'twoColumn', 'blank'],
    animations: [],
  },
  photoshop: {
    id: 'photoshop',
    name: 'Photoshop',
    description: 'Digital design and photo editing',
    canvasSize: { width: 1200, height: 800 },
    grid: { enabled: true, size: 20, snap: false, color: '#888888', opacity: 0.5 },
    guides: { enabled: true, snap: true, showPixels: true },
    defaultTool: 'select',
    toolset: ['select', 'brush', 'eraser', 'shape', 'text', 'pen', 'gradient', 'eyedropper', 'layer'],
    defaultFont: { family: 'Arial', size: 14, color: '#000000' },
    pageBackground: '#2c2c2c',
    showLayersPanel: true,
    blendModes: ['normal', 'multiply', 'screen', 'overlay'],
    filters: ['blur', 'sharpen', 'brightness', 'contrast'],
  },
  excel: {
    id: 'excel',
    name: 'Excel',
    description: 'Spreadsheet and table editing',
    canvasSize: { width: 1000, height: 600 },
    grid: { enabled: true, size: 20, snap: true, color: '#d0d0d0', opacity: 1, showGridLines: true },
    guides: { enabled: true, snap: true, showHeaders: true },
    defaultTool: 'table',
    toolset: ['select', 'table', 'text', 'rectangle', 'chart', 'formula'],
    defaultFont: { family: 'Arial', size: 11, color: '#000000' },
    pageBackground: '#ffffff',
    cellSize: { width: 100, height: 20 },
    showFormulaBar: true,
  },
  plain: {
    id: 'plain',
    name: 'Plain Canvas',
    description: 'Simple drawing and annotation',
    canvasSize: { width: 800, height: 600 },
    grid: { enabled: false, size: 20, snap: false },
    guides: { enabled: false, snap: false },
    defaultTool: 'select',
    toolset: ['select', 'text', 'rectangle', 'circle', 'line', 'arrow', 'brush', 'image'],
    defaultFont: { family: 'Arial', size: 16, color: '#000000' },
    pageBackground: '#ffffff',
  }
};

export function getDefaultLayoutConfig(mode = 'plain') {
  return LAYOUT_MODES[mode] ?? LAYOUT_MODES.plain;
}