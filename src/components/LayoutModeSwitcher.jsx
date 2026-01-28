import React from 'react';

const LayoutModeSwitcher = ({
  activeMode,
  onModeChange,
  layoutConfig = {},
  showLabels = true,
  compact = false
}) => {
  const modes = [
    {
      id: 'word',
      name: 'Word',
      icon: '📝',
      description: 'Document editing',
      color: '#3498db',
      bgColor: '#ebf5fb'
    },
    {
      id: 'powerpoint',
      name: 'PowerPoint',
      icon: '📊',
      description: 'Slide design',
      color: '#e74c3c',
      bgColor: '#fdedec'
    },
    {
      id: 'photoshop',
      name: 'Photoshop',
      icon: '🎨',
      description: 'Digital design',
      color: '#9b59b6',
      bgColor: '#f4ecf7'
    },
    {
      id: 'excel',
      name: 'Excel',
      icon: '📈',
      description: 'Spreadsheet',
      color: '#2ecc71',
      bgColor: '#eafaf1'
    }
  ];

  const currentMode = modes.find(mode => mode.id === activeMode) || modes[0];

  return (
    <div className="layout-mode-switcher">
      {!compact && (
        <div className="mode-info">
          <div className="mode-icon" style={{ color: currentMode.color }}>
            {currentMode.icon}
          </div>
          <div className="mode-details">
            <div className="mode-name">{currentMode.name} Mode</div>
            <div className="mode-description">{currentMode.description}</div>
          </div>
        </div>
      )}

      <div className={`mode-buttons ${compact ? 'compact' : ''}`}>
        {modes.map(mode => (
          <button
            key={mode.id}
            className={`mode-btn ${activeMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
            title={`${mode.name}: ${mode.description}`}
            style={{
              borderColor: activeMode === mode.id ? mode.color : 'transparent',
              backgroundColor: activeMode === mode.id ? mode.bgColor : 'transparent'
            }}
          >
            <span className="mode-btn-icon">{mode.icon}</span>
            {showLabels && !compact && (
              <span className="mode-btn-label">{mode.name}</span>
            )}
          </button>
        ))}
      </div>

      {!compact && layoutConfig[activeMode] && (
        <div className="mode-features">
          <div className="features-title">Active Features:</div>
          <div className="features-list">
            {(layoutConfig[activeMode]?.features || []).map((feature, index) => (
              <span key={index} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutModeSwitcher;