import React, { useState, useEffect, useRef } from 'react';

const TextEditorOverlay = ({
  elementId,
  text,
  position = { x: 0, y: 0 },
  style = {},
  onChange,
  onSave,
  onCancel,
  onStyleChange,
  fontFamilies = [
    'Arial, sans-serif',
    'Times New Roman, serif',
    'Courier New, monospace',
    'Georgia, serif',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Comic Sans MS, cursive'
  ],
  fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]
}) => {
  const [localText, setLocalText] = useState(text || '');
  const [localStyle, setLocalStyle] = useState(style);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  useEffect(() => {
    setLocalStyle(style);
  }, [style]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setLocalText(newText);
    onChange?.(newText);
  };

  const handleStyleChange = (property, value) => {
    const newStyle = { ...localStyle, [property]: value };
    setLocalStyle(newStyle);
    onStyleChange?.(newStyle);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = () => {
    onSave?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const colorOptions = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#ffa500', '#800080', '#008080', '#a52a2a'
  ];

  return (
    <div 
      className="text-editor-overlay"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Style Toolbar */}
      <div className="text-editor-toolbar">
        {/* Font Family */}
        <select
          value={localStyle.fontFamily}
          onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
          className="style-select"
        >
          {fontFamilies.map(font => (
            <option key={font} value={font}>
              {font.split(',')[0]}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          value={localStyle.fontSize}
          onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
          className="style-select"
        >
          {fontSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>

        {/* Style Buttons */}
        <button
          className={`style-btn ${localStyle.bold ? 'active' : ''}`}
          onClick={() => handleStyleChange('bold', !localStyle.bold)}
          title="Bold"
        >
          <strong>B</strong>
        </button>

        <button
          className={`style-btn ${localStyle.italic ? 'active' : ''}`}
          onClick={() => handleStyleChange('italic', !localStyle.italic)}
          title="Italic"
        >
          <em>I</em>
        </button>

        <button
          className={`style-btn ${localStyle.underline ? 'active' : ''}`}
          onClick={() => handleStyleChange('underline', !localStyle.underline)}
          title="Underline"
        >
          <u>U</u>
        </button>

        {/* Text Align */}
        <div className="align-buttons">
          {['left', 'center', 'right', 'justify'].map(align => (
            <button
              key={align}
              className={`style-btn ${localStyle.align === align ? 'active' : ''}`}
              onClick={() => handleStyleChange('align', align)}
              title={`Align ${align}`}
            >
              {align === 'left' && '⫷'}
              {align === 'center' && '⫸'}
              {align === 'right' && '⫸'}
              {align === 'justify' && '⇔'}
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className="color-picker">
          <input
            type="color"
            value={localStyle.fill || '#000000'}
            onChange={(e) => handleStyleChange('fill', e.target.value)}
            title="Text Color"
          />
          <div className="color-options">
            {colorOptions.map(color => (
              <button
                key={color}
                className="color-option"
                style={{ backgroundColor: color }}
                onClick={() => handleStyleChange('fill', color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        className="text-editor-textarea"
        style={{
          fontFamily: localStyle.fontFamily,
          fontSize: `${localStyle.fontSize}px`,
          fontWeight: localStyle.bold ? 'bold' : 'normal',
          fontStyle: localStyle.italic ? 'italic' : 'normal',
          textDecoration: localStyle.underline ? 'underline' : 'none',
          color: localStyle.fill,
          textAlign: localStyle.align,
          lineHeight: localStyle.lineHeight || 1.2,
          letterSpacing: `${localStyle.letterSpacing || 0}px`
        }}
        rows={Math.max(3, localText.split('\n').length)}
      />

      {/* Action Buttons */}
      <div className="text-editor-actions">
        <button className="btn-save" onClick={handleSave}>
          Save (Ctrl+Enter)
        </button>
        <button className="btn-cancel" onClick={handleCancel}>
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
};

export default TextEditorOverlay;