// Keyboard shortcuts configuration - stateless, pure functions
export const KEYBOARD_SHORTCUTS = {
  // Selection & Navigation
  SELECT_ALL: { keys: ['ctrl+a', 'cmd+a'], action: 'selectAll' },
  DESELECT: { keys: ['escape'], action: 'clearSelection' },
  DELETE: { keys: ['delete', 'backspace'], action: 'deleteSelection' },
  
  // Editing
  UNDO: { keys: ['ctrl+z', 'cmd+z'], action: 'undo' },
  REDO: { keys: ['ctrl+shift+z', 'cmd+shift+z', 'ctrl+y', 'cmd+y'], action: 'redo' },
  COPY: { keys: ['ctrl+c', 'cmd+c'], action: 'copy' },
  PASTE: { keys: ['ctrl+v', 'cmd+v'], action: 'paste' },
  CUT: { keys: ['ctrl+x', 'cmd+x'], action: 'cut' },
  DUPLICATE: { keys: ['ctrl+d', 'cmd+d'], action: 'duplicate' },
  
  // Text Editing
  BOLD: { keys: ['ctrl+b', 'cmd+b'], action: 'toggleBold' },
  ITALIC: { keys: ['ctrl+i', 'cmd+i'], action: 'toggleItalic' },
  UNDERLINE: { keys: ['ctrl+u', 'cmd+u'], action: 'toggleUnderline' },
  
  // Alignment
  ALIGN_LEFT: { keys: ['ctrl+shift+l', 'cmd+shift+l'], action: 'alignLeft' },
  ALIGN_CENTER: { keys: ['ctrl+shift+c', 'cmd+shift+c'], action: 'alignCenter' },
  ALIGN_RIGHT: { keys: ['ctrl+shift+r', 'cmd+shift+r'], action: 'alignRight' },
  ALIGN_TOP: { keys: ['ctrl+shift+t', 'cmd+shift+t'], action: 'alignTop' },
  ALIGN_MIDDLE: { keys: ['ctrl+shift+m', 'cmd+shift+m'], action: 'alignMiddle' },
  ALIGN_BOTTOM: { keys: ['ctrl+shift+b', 'cmd+shift+b'], action: 'alignBottom' },
  
  // Grouping
  GROUP: { keys: ['ctrl+g', 'cmd+g'], action: 'groupSelection' },
  UNGROUP: { keys: ['ctrl+shift+g', 'cmd+shift+g'], action: 'ungroupSelection' },
  
  // Ordering
  BRING_TO_FRONT: { keys: ['ctrl+shift+]', 'cmd+shift+]'], action: 'bringToFront' },
  BRING_FORWARD: { keys: ['ctrl+]', 'cmd+]'], action: 'bringForward' },
  SEND_BACKWARD: { keys: ['ctrl+[', 'cmd+['], action: 'sendBackward' },
  SEND_TO_BACK: { keys: ['ctrl+shift+[', 'cmd+shift+['], action: 'sendToBack' },
  
  // Tools
  SELECT_TOOL: { keys: ['v'], action: 'setSelectTool' },
  TEXT_TOOL: { keys: ['t'], action: 'setTextTool' },
  RECTANGLE_TOOL: { keys: ['r'], action: 'setRectangleTool' },
  CIRCLE_TOOL: { keys: ['c'], action: 'setCircleTool' },
  BRUSH_TOOL: { keys: ['b'], action: 'setBrushTool' },
  ERASER_TOOL: { keys: ['e'], action: 'setEraserTool' },
  HAND_TOOL: { keys: ['h'], action: 'setHandTool' },
  ZOOM_TOOL: { keys: ['z'], action: 'setZoomTool' },
  
  // View
  ZOOM_IN: { keys: ['ctrl+=', 'cmd+=', 'ctrl+num+', 'cmd+num+'], action: 'zoomIn' },
  ZOOM_OUT: { keys: ['ctrl+-', 'cmd+-', 'ctrl+num-', 'cmd+num-'], action: 'zoomOut' },
  ZOOM_FIT: { keys: ['ctrl+0', 'cmd+0'], action: 'zoomToFit' },
  ZOOM_100: { keys: ['ctrl+1', 'cmd+1'], action: 'zoom100' },
  TOGGLE_GRID: { keys: ['ctrl+\'', 'cmd+\''], action: 'toggleGrid' },
  TOGGLE_RULERS: { keys: ['ctrl+r', 'cmd+r'], action: 'toggleRulers' },
  TOGGLE_GUIDES: { keys: ['ctrl+;', 'cmd+;'], action: 'toggleGuides' },
  
  // Layout Modes
  WORD_MODE: { keys: ['ctrl+shift+w', 'cmd+shift+w'], action: 'switchToWordMode' },
  PPT_MODE: { keys: ['ctrl+shift+p', 'cmd+shift+p'], action: 'switchToPPTMode' },
  PS_MODE: { keys: ['ctrl+shift+s', 'cmd+shift+s'], action: 'switchToPSMode' },
  EXCEL_MODE: { keys: ['ctrl+shift+e', 'cmd+shift+e'], action: 'switchToExcelMode' }
};

// Helper to parse keyboard event into shortcut string
export const parseKeyboardEvent = (event) => {
  const parts = [];
  
  if (event.ctrlKey) parts.push('ctrl');
  if (event.metaKey) parts.push('cmd');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  
  // Normalize key
  let key = event.key.toLowerCase();
  
  // Handle special keys
  const specialKeys = {
    'escape': 'escape',
    'delete': 'delete',
    'backspace': 'backspace',
    'enter': 'enter',
    'tab': 'tab',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right',
    ' ': 'space',
    '=': '=',
    '+': 'num+',
    '-': 'num-',
    '[': '[',
    ']': ']',
    ';': ';',
    '\'': '\''
  };
  
  key = specialKeys[key] || key;
  
  // Don't add modifier keys as main key
  if (!['control', 'ctrl', 'meta', 'alt', 'shift', 'cmd'].includes(key)) {
    parts.push(key);
  }
  
  return parts.join('+');
};

// Find action for keyboard shortcut
export const getShortcutAction = (shortcutString) => {
  for (const [action, config] of Object.entries(KEYBOARD_SHORTCUTS)) {
    if (config.keys.includes(shortcutString)) {
      return { action: config.action, shortcut: action };
    }
  }
  return null;
};

// Get display string for shortcut
export const getShortcutDisplay = (actionName) => {
  const entry = Object.entries(KEYBOARD_SHORTCUTS).find(([_, config]) => config.action === actionName);
  if (!entry) return null;
  
  const [shortcutName, config] = entry;
  const primaryKey = config.keys[0];
  
  // Format for display (e.g., "Ctrl+Shift+Z")
  return primaryKey
    .split('+')
    .map(part => {
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'cmd') return '⌘';
      if (part === 'shift') return 'Shift';
      if (part === 'alt') return 'Alt';
      if (part === 'num+') return '+';
      if (part === 'num-') return '-';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('+');
};

// Generate shortcut map for UI display
export const getShortcutMap = () => {
  const map = {};
  Object.entries(KEYBOARD_SHORTCUTS).forEach(([name, config]) => {
    map[config.action] = getShortcutDisplay(config.action);
  });
  return map;
};

// Check if event should be handled by editor (not in input/textarea)
export const shouldHandleKeyboardEvent = (event) => {
  const tagName = event.target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = event.target.isContentEditable;
  
  return !isInput && !isContentEditable;
};