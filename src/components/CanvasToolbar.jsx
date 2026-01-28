import React from 'react';
import { ELEMENT_TYPES, getElementIcon } from '../utils/elementTypes';

const CanvasToolbar = ({
  activeTool,
  activeLayout,
  onToolChange,
  onLayoutChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  readOnly = false
}) => {
  const tools = [
    { id: 'select', name: 'Select', icon: '↖️', shortcut: 'V' },
    { id: 'hand', name: 'Hand', icon: '👆', shortcut: 'H' },
    { id: 'text', name: 'Text', icon: 'T', shortcut: 'T' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜', shortcut: 'R' },
    { id: 'circle', name: 'Circle', icon: '⭕', shortcut: 'C' },
    { id: 'line', name: 'Line', icon: '📏', shortcut: 'L' },
    { id: 'arrow', name: 'Arrow', icon: '➡️', shortcut: 'A' },
    { id: 'brush', name: 'Brush', icon: '🖌️', shortcut: 'B' },
    { id: 'eraser', name: 'Eraser', icon: '🧹', shortcut: 'E' },
    { id: 'table', name: 'Table', icon: '📊', shortcut: 'X' },
    { id: 'image', name: 'Image', icon: '🖼️', shortcut: 'I' },
    { id: 'chart', name: 'Chart', icon: '📈', shortcut: 'G' }
  ];

  const layouts = [
    { id: 'word', name: 'Word', icon: '📝', color: '#3498db' },
    { id: 'powerpoint', name: 'PPT', icon: '📊', color: '#e74c3c' },
    { id: 'photoshop', name: 'PS', icon: '🎨', color: '#9b59b6' },
    { id: 'excel', name: 'Excel', icon: '📈', color: '#2ecc71' }
  ];

  const fileActions = [
    { id: 'new', name: 'New', icon: '📄', shortcut: 'Ctrl+N' },
    { id: 'open', name: 'Open', icon: '📂', shortcut: 'Ctrl+O' },
    { id: 'save', name: 'Save', icon: '💾', shortcut: 'Ctrl+S' },
    { id: 'saveAs', name: 'Save As', icon: '💾', shortcut: 'Ctrl+Shift+S' }
  ];

  const editActions = [
    { id: 'undo', name: 'Undo', icon: '↪️', disabled: !canUndo, shortcut: 'Ctrl+Z' },
    { id: 'redo', name: 'Redo', icon: '↩️', disabled: !canRedo, shortcut: 'Ctrl+Y' },
    { id: 'copy', name: 'Copy', icon: '📋', shortcut: 'Ctrl+C' },
    { id: 'paste', name: 'Paste', icon: '📋', shortcut: 'Ctrl+V' },
    { id: 'cut', name: 'Cut', icon: '✂️', shortcut: 'Ctrl+X' },
    { id: 'delete', name: 'Delete', icon: '🗑️', shortcut: 'Del' }
  ];

  return (
    <div className="canvas-toolbar">
      {/* File Actions */}
      <div className="toolbar-section">
        {fileActions.map(action => (
          <button
            key={action.id}
            className="toolbar-btn"
            title={`${action.name} (${action.shortcut})`}
            onClick={() => console.log(action.id)}
          >
            <span className="btn-icon">{action.icon}</span>
            <span className="btn-text">{action.name}</span>
          </button>
        ))}
      </div>

      {/* Edit Actions */}
      <div className="toolbar-section">
        {editActions.map(action => (
          <button
            key={action.id}
            className={`toolbar-btn ${action.disabled ? 'disabled' : ''}`}
            title={`${action.name} (${action.shortcut})`}
            onClick={() => {
              if (action.id === 'undo' && onUndo) onUndo();
              if (action.id === 'redo' && onRedo) onRedo();
            }}
            disabled={action.disabled}
          >
            <span className="btn-icon">{action.icon}</span>
            {action.name !== 'Copy' && action.name !== 'Paste' && action.name !== 'Cut' && (
              <span className="btn-text">{action.name}</span>
            )}
          </button>
        ))}
      </div>

      {/* Layout Modes */}
      <div className="toolbar-section">
        {layouts.map(layout => (
          <button
            key={layout.id}
            className={`toolbar-btn ${activeLayout === layout.id ? 'active' : ''}`}
            style={{ borderColor: activeLayout === layout.id ? layout.color : 'transparent' }}
            title={`${layout.name} Mode`}
            onClick={() => onLayoutChange(layout.id)}
          >
            <span className="btn-icon">{layout.icon}</span>
            <span className="btn-text">{layout.name}</span>
          </button>
        ))}
      </div>

      {/* Tools */}
      <div className="toolbar-section tools">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
            title={`${tool.name} (${tool.shortcut})`}
            onClick={() => onToolChange(tool.id)}
            disabled={readOnly}
          >
            <span className="btn-icon">{tool.icon}</span>
            {tool.id === 'select' || tool.id === 'hand' ? (
              <span className="btn-text">{tool.name}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Export/Share */}
      <div className="toolbar-section right">
        <button
          className="toolbar-btn primary"
          onClick={onExport}
          disabled={readOnly}
        >
          <span className="btn-icon">📤</span>
          <span className="btn-text">Export</span>
        </button>
        
        <button
          className="toolbar-btn"
          onClick={() => console.log('Share')}
          disabled={readOnly}
        >
          <span className="btn-icon">🔗</span>
          <span className="btn-text">Share</span>
        </button>
      </div>
    </div>
  );
};

export default CanvasToolbar;