import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
  Typography
} from '@mui/material';
import {
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  VerticalAlignTop,
  VerticalAlignCenter,
  VerticalAlignBottom,
  Group,
  Delete,
  ContentCopy,
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  ArrowUpward,
  ArrowDownward,
  Layers,
  GridOn,
  TableChart,
  Palette,
  UnfoldMore
} from '@mui/icons-material';

// Custom Ungroup Icon component using SVG
const UngroupIcon = ({ fontSize = 'small', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ 
      width: fontSize === 'small' ? '20px' : '24px',
      height: fontSize === 'small' ? '20px' : '24px'
    }}
    {...props}
  >
    <path d="M3 3h8v2H3zM3 7h8v2H3zM3 11h8v2H3zM13 3h8v2h-8zM13 7h8v2h-8zM13 11h8v2h-8zM3 15h8v2H3zM13 15h8v2h-8zM3 19h8v2H3zM13 19h8v2h-8z"/>
  </svg>
);

const QuickAccessToolbar = ({
  selectedIds = [],
  selectedElements = [],
  onAlign,
  onGroup,
  onUngroup,
  onDelete,
  onDuplicate,
  onLock,
  onHide,
  onBringForward,
  onSendBackward,
  showContextual = true,
  position = 'top-right',
  layoutMode = 'word',
  compactMode = false,
  ...props
}) => {
  const [alignMenuAnchor, setAlignMenuAnchor] = useState(null);
  const [arrangeMenuAnchor, setArrangeMenuAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

  // If no elements selected and contextual mode is enabled, don't show toolbar
  if (selectedIds.length === 0 && showContextual) {
    return null;
  }

  // Layout mode specific tool configurations
  const toolConfigs = {
    word: {
      tools: ['align', 'group', 'duplicate', 'lock', 'hide', 'arrange'],
      alignOptions: ['left', 'center', 'right', 'justify'],
      arrangeOptions: ['bringForward', 'sendBackward'],
      iconSize: compactMode ? 'small' : 'medium',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      accentColor: '#3b82f6'
    },
    powerpoint: {
      tools: ['align', 'group', 'duplicate', 'lock', 'arrange'],
      alignOptions: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
      arrangeOptions: ['bringForward', 'sendBackward'],
      iconSize: compactMode ? 'small' : 'medium',
      backgroundColor: '#fef3c7',
      borderColor: '#fbbf24',
      accentColor: '#f59e0b'
    },
    photoshop: {
      tools: ['align', 'group', 'duplicate', 'lock', 'hide', 'arrange', 'layers'],
      alignOptions: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
      arrangeOptions: ['bringForward', 'sendBackward'],
      iconSize: compactMode ? 'small' : 'medium',
      backgroundColor: '#1e293b',
      borderColor: '#475569',
      accentColor: '#8b5cf6'
    },
    excel: {
      tools: ['align', 'group', 'duplicate', 'lock', 'arrange', 'grid'],
      alignOptions: ['left', 'center', 'right'],
      arrangeOptions: ['bringForward', 'sendBackward'],
      iconSize: compactMode ? 'small' : 'medium',
      backgroundColor: '#dcfce7',
      borderColor: '#86efac',
      accentColor: '#10b981'
    }
  };

  const currentConfig = toolConfigs[layoutMode] || toolConfigs.word;

  const positionStyles = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'center-top': { top: 20, left: '50%', transform: 'translateX(-50%)' }
  };

  const getAlignIcon = (alignment) => {
    switch (alignment) {
      case 'left': return <FormatAlignLeft />;
      case 'center': return <FormatAlignCenter />;
      case 'right': return <FormatAlignRight />;
      case 'justify': return <FormatAlignJustify />;
      case 'top': return <VerticalAlignTop />;
      case 'middle': return <VerticalAlignCenter />;
      case 'bottom': return <VerticalAlignBottom />;
      default: return <FormatAlignLeft />;
    }
  };

  const handleAlignClick = (alignment) => {
    onAlign?.(alignment);
    setAlignMenuAnchor(null);
  };

  const handleArrangeClick = (action) => {
    switch (action) {
      case 'bringForward':
        onBringForward?.();
        break;
      case 'sendBackward':
        onSendBackward?.();
        break;
    }
    setArrangeMenuAnchor(null);
  };

  // Check if any selected element is locked
  const isAnyLocked = selectedElements.some(el => !el.draggable);
  // Check if any selected element is hidden
  const isAnyHidden = selectedElements.some(el => el.visible === false);
  // Check if any selected element is a group
  const isGroupSelected = selectedElements.some(el => el.type === 'group' || el.isGroup);

  // Handle group/ungroup with proper logic
  const handleGroupAction = () => {
    if (selectedIds.length > 1) {
      // Multiple elements selected - group them
      onGroup?.();
    } else if (isGroupSelected) {
      // Single group selected - ungroup it
      onUngroup?.(selectedIds[0]);
    }
  };

  // Determine which group icon to show
  const getGroupIcon = () => {
    if (selectedIds.length > 1) {
      return <Group />;
    } else if (isGroupSelected) {
      return <UngroupIcon />;
    }
    return null;
  };

  // Get group tooltip text
  const getGroupTooltip = () => {
    if (selectedIds.length > 1) {
      return `Group ${selectedIds.length} elements (Ctrl+G)`;
    } else if (isGroupSelected) {
      return 'Ungroup elements (Ctrl+Shift+G)';
    }
    return '';
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 1300,
          padding: compactMode ? 0.5 : 1,
          display: 'flex',
          gap: compactMode ? 0.25 : 0.5,
          alignItems: 'center',
          backgroundColor: currentConfig.backgroundColor,
          border: `1px solid ${currentConfig.borderColor}`,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.2s ease-out',
          backdropFilter: layoutMode === 'photoshop' ? 'blur(10px)' : 'none',
          maxWidth: '95vw',
          overflow: 'hidden'
        }}
      >
        {/* Selected count indicator */}
        {!compactMode && (
          <Chip
            label={`${selectedIds.length}`}
            size="small"
            sx={{
              marginRight: 0.5,
              fontWeight: 700,
              backgroundColor: currentConfig.accentColor,
              color: 'white',
              minWidth: '32px',
              height: '28px'
            }}
          />
        )}

        {/* Align tools */}
        {currentConfig.tools.includes('align') && (
          <>
            <Tooltip title="Align Elements" arrow>
              <IconButton
                size={currentConfig.iconSize}
                onClick={(e) => setAlignMenuAnchor(e.currentTarget)}
                sx={{
                  color: layoutMode === 'photoshop' ? '#cbd5e1' : '#475569',
                  padding: compactMode ? 0.5 : 1
                }}
              >
                <FormatAlignLeft fontSize={compactMode ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={alignMenuAnchor}
              open={Boolean(alignMenuAnchor)}
              onClose={() => setAlignMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              {currentConfig.alignOptions.includes('left') && (
                <MenuItem onClick={() => handleAlignClick('left')}>
                  <ListItemIcon>
                    <FormatAlignLeft fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Align Left</ListItemText>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Ctrl+L
                  </Typography>
                </MenuItem>
              )}
              {currentConfig.alignOptions.includes('center') && (
                <MenuItem onClick={() => handleAlignClick('center')}>
                  <ListItemIcon>
                    <FormatAlignCenter fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Align Center</ListItemText>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Ctrl+E
                  </Typography>
                </MenuItem>
              )}
              {currentConfig.alignOptions.includes('right') && (
                <MenuItem onClick={() => handleAlignClick('right')}>
                  <ListItemIcon>
                    <FormatAlignRight fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Align Right</ListItemText>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Ctrl+R
                  </Typography>
                </MenuItem>
              )}
              {currentConfig.alignOptions.includes('justify') && (
                <MenuItem onClick={() => handleAlignClick('justify')}>
                  <ListItemIcon>
                    <FormatAlignJustify fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Justify</ListItemText>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Ctrl+J
                  </Typography>
                </MenuItem>
              )}
              {currentConfig.alignOptions.includes('top') && (
                <MenuItem onClick={() => handleAlignClick('top')}>
                  <ListItemIcon>
                    <VerticalAlignTop fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Align Top</ListItemText>
                </MenuItem>
              )}
              {currentConfig.alignOptions.includes('middle') && (
                <MenuItem onClick={() => handleAlignClick('middle')}>
                  <ListItemIcon>
                    <VerticalAlignCenter fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Align Middle</ListItemText>
                </MenuItem>
              )}
              {currentConfig.alignOptions.includes('bottom') && (
                <MenuItem onClick={() => handleAlignClick('bottom')}>
                  <ListItemIcon>
                    <VerticalAlignBottom fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Align Bottom</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </>
        )}

        {/* Group/Ungroup button */}
        {currentConfig.tools.includes('group') && getGroupIcon() && (
          <Tooltip title={getGroupTooltip()} arrow>
            <IconButton
              size={currentConfig.iconSize}
              onClick={handleGroupAction}
              sx={{
                color: layoutMode === 'photoshop' ? '#cbd5e1' : '#475569',
                padding: compactMode ? 0.5 : 1
              }}
            >
              {getGroupIcon()}
            </IconButton>
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem sx={{ margin: '4px 0', height: 24 }} />

        {/* Duplicate */}
        {currentConfig.tools.includes('duplicate') && (
          <Tooltip title="Duplicate (Ctrl+D)" arrow>
            <IconButton
              size={currentConfig.iconSize}
              onClick={onDuplicate}
              sx={{
                color: layoutMode === 'photoshop' ? '#cbd5e1' : '#475569',
                padding: compactMode ? 0.5 : 1
              }}
            >
              <ContentCopy fontSize={compactMode ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock/Unlock */}
        {currentConfig.tools.includes('lock') && (
          <Tooltip title={isAnyLocked ? "Unlock Elements" : "Lock Elements"} arrow>
            <IconButton
              size={currentConfig.iconSize}
              onClick={onLock}
              sx={{
                color: isAnyLocked 
                  ? layoutMode === 'photoshop' ? '#ef4444' : '#dc2626'
                  : layoutMode === 'photoshop' ? '#cbd5e1' : '#475569',
                padding: compactMode ? 0.5 : 1
              }}
            >
              {isAnyLocked ? (
                <LockOpen fontSize={compactMode ? 'small' : 'medium'} />
              ) : (
                <Lock fontSize={compactMode ? 'small' : 'medium'} />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* Show/Hide */}
        {currentConfig.tools.includes('hide') && (
          <Tooltip title={isAnyHidden ? "Show Elements" : "Hide Elements"} arrow>
            <IconButton
              size={currentConfig.iconSize}
              onClick={onHide}
              sx={{
                color: isAnyHidden
                  ? layoutMode === 'photoshop' ? '#ef4444' : '#dc2626'
                  : layoutMode === 'photoshop' ? '#cbd5e1' : '#475569',
                padding: compactMode ? 0.5 : 1
              }}
            >
              {isAnyHidden ? (
                <VisibilityOff fontSize={compactMode ? 'small' : 'medium'} />
              ) : (
                <Visibility fontSize={compactMode ? 'small' : 'medium'} />
              )}
            </IconButton>
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem sx={{ margin: '4px 0', height: 24 }} />

        {/* Arrange menu */}
        {currentConfig.tools.includes('arrange') && (
          <>
            <Tooltip title="Arrange Elements" arrow>
              <IconButton
                size={currentConfig.iconSize}
                onClick={(e) => setArrangeMenuAnchor(e.currentTarget)}
                sx={{
                  color: layoutMode === 'photoshop' ? '#cbd5e1' : '#475569',
                  padding: compactMode ? 0.5 : 1
                }}
              >
                <Layers fontSize={compactMode ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={arrangeMenuAnchor}
              open={Boolean(arrangeMenuAnchor)}
              onClose={() => setArrangeMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <MenuItem onClick={() => handleArrangeClick('bringForward')}>
                <ListItemIcon>
                  <ArrowUpward fontSize="small" />
                </ListItemIcon>
                <ListItemText>Bring Forward</ListItemText>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Ctrl+]
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => handleArrangeClick('sendBackward')}>
                <ListItemIcon>
                  <ArrowDownward fontSize="small" />
                </ListItemIcon>
                <ListItemText>Send Backward</ListItemText>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Ctrl+[
                </Typography>
              </MenuItem>
            </Menu>
          </>
        )}

        {/* Mode-specific tools */}
        {layoutMode === 'excel' && currentConfig.tools.includes('grid') && (
          <Tooltip title="Grid Settings" arrow>
            <IconButton
              size={currentConfig.iconSize}
              onClick={() => {/* Open grid settings */}}
              sx={{
                color: '#475569',
                padding: compactMode ? 0.5 : 1
              }}
            >
              <GridOn fontSize={compactMode ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        {layoutMode === 'powerpoint' && (
          <Tooltip title="Slide Tools" arrow>
            <IconButton
              size={currentConfig.iconSize}
              onClick={() => {/* Open slide tools */}}
              sx={{
                color: '#92400e',
                padding: compactMode ? 0.5 : 1
              }}
            >
              <TableChart fontSize={compactMode ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        {layoutMode === 'photoshop' && currentConfig.tools.includes('layers') && (
          <Tooltip title="Layer Tools" arrow>
            <IconButton
              size={currentConfig.iconSize}
              onClick={() => {/* Open layer tools */}}
              sx={{
                color: '#cbd5e1',
                padding: compactMode ? 0.5 : 1
              }}
            >
              <Palette fontSize={compactMode ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem sx={{ margin: '4px 0', height: 24 }} />

        {/* Delete with warning badge for groups */}
        <Tooltip title="Delete (Delete)" arrow>
          <Badge
            color="warning"
            variant="dot"
            invisible={!isGroupSelected}
          >
            <IconButton
              size={currentConfig.iconSize}
              onClick={onDelete}
              sx={{
                color: layoutMode === 'photoshop' ? '#ef4444' : '#dc2626',
                padding: compactMode ? 0.5 : 1
              }}
            >
              <Delete fontSize={compactMode ? 'small' : 'medium'} />
            </IconButton>
          </Badge>
        </Tooltip>

        {/* More menu for compact mode */}
        {compactMode && (
          <>
            <IconButton
              size="small"
              onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
              sx={{ padding: 0.5 }}
            >
              <UnfoldMore fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={moreMenuAnchor}
              open={Boolean(moreMenuAnchor)}
              onClose={() => setMoreMenuAnchor(null)}
            >
              <MenuItem onClick={() => setMoreMenuAnchor(null)}>
                <ListItemText 
                  primary="Quick Access Toolbar" 
                  secondary="All tools available in non-compact mode" 
                />
              </MenuItem>
            </Menu>
          </>
        )}
      </Paper>

      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default QuickAccessToolbar;