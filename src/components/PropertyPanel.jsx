// PropertyPanel.jsx - COMPLETE REFACTORED VERSION
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Divider, TextField, Slider,
  FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, Button, IconButton,
  Grid, Paper, Tooltip, Chip, InputAdornment,
  Popover, Tabs, Tab, Accordion, AccordionSummary,
  AccordionDetails, FormGroup, RadioGroup,
  Radio, List, ListItem, ListItemText,
  ListItemIcon, Collapse, Alert, Badge
} from '@mui/material';
import {
  FormatColorText, FormatColorFill, Palette,
  ExpandMore, FontDownload, FormatSize,
  FormatBold, FormatItalic, FormatUnderlined,
  FormatAlignLeft, FormatAlignCenter, FormatAlignRight,
  LineWeight, BorderColor, Opacity, Layers,
  Visibility, VisibilityOff, Lock, LockOpen,
  Colorize, ArrowDropDown, Check, TextFields,
  TableChart, GridOn, Brush, Image as ImageIcon,
  ShapeLine, Circle as CircleIcon, AutoFixHigh,
  Link, QrCode2, Settings, TableRows,
  TableChartOutlined, BorderAll, FormatListBulleted,
  FilterNone, Gradient, BlurOn, Texture,
  DataObject, Functions, TrendingUp, PieChart,
  ShowChart, InsertChart, Timeline, BarChart,
  Dashboard, ViewColumn, ViewWeek, ViewDay,
  ViewQuilt, ViewComfy, ViewStream, ViewList,
  ViewModule, ViewHeadline, ViewCarousel
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';

// =================== LAYOUT MODE CONFIGURATION ===================
const LAYOUT_CONFIGS = {
  word: {
    name: 'Word',
    icon: <TextFields />,
    theme: {
      primary: '#2c579b',
      secondary: '#e8f0fe',
      background: '#ffffff',
      paper: '#f8f9fa'
    },
    features: ['Text Editing', 'Paragraph Styles', 'Page Layout', 'Headers/Footers'],
    defaultTool: 'text',
    propertyGroups: ['text', 'paragraph', 'page', 'styles']
  },
  powerpoint: {
    name: 'PowerPoint',
    icon: <Dashboard />,
    theme: {
      primary: '#d24726',
      secondary: '#fae8e5',
      background: '#f8f9fa',
      paper: '#ffffff'
    },
    features: ['Slide Design', 'Animations', 'Transitions', 'Master Slides'],
    defaultTool: 'select',
    propertyGroups: ['slide', 'animation', 'design', 'media']
  },
  photoshop: {
    name: 'Photoshop',
    icon: <Brush />,
    theme: {
      primary: '#31a8ff',
      secondary: '#1a1a1a',
      background: '#2d2d2d',
      paper: '#374151'
    },
    features: ['Layers', 'Filters', 'Brushes', 'Selection Tools'],
    defaultTool: 'brush',
    propertyGroups: ['layers', 'filters', 'brush', 'selection', 'effects']
  },
  excel: {
    name: 'Excel',
    icon: <TableChart />,
    theme: {
      primary: '#217346',
      secondary: '#e6f4ea',
      background: '#ffffff',
      paper: '#f8fafc'
    },
    features: ['Tables', 'Charts', 'Formulas', 'Grid View'],
    defaultTool: 'table',
    propertyGroups: ['table', 'chart', 'formula', 'grid', 'data']
  }
};

// =================== COLOR PICKER COMPONENT ===================
const ColorPickerButton = ({ 
  color = '#000000', 
  onChange, 
  label, 
  icon = Palette,
  size = 'small',
  fullWidth = false,
  layoutMode = 'word'
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedColor, setSelectedColor] = useState(color);
  const layoutTheme = LAYOUT_CONFIGS[layoutMode]?.theme || LAYOUT_CONFIGS.word.theme;
  const IconComponent = icon;

  useEffect(() => {
    setSelectedColor(color);
  }, [color]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (newColor) => {
    setSelectedColor(newColor.hex);
    if (onChange) {
      onChange(newColor.hex);
    }
  };

  const open = Boolean(anchorEl);

  // Color presets based on layout mode
  const colorPresets = useMemo(() => {
    const baseColors = [
      '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
      '#ffff00', '#ff00ff', '#00ffff', '#ff9500', '#8b5cf6'
    ];
    
    if (layoutMode === 'photoshop') {
      return [
        '#000000', '#1a1a1a', '#2d2d2d', '#ffffff', '#31a8ff',
        '#ff6b6b', '#51cf66', '#ffd43b', '#339af0', '#cc5de8'
      ];
    } else if (layoutMode === 'word') {
      return [
        '#000000', '#ffffff', '#2c579b', '#d24726', '#217346',
        '#ff9500', '#8b5cf6', '#0ca678', '#e64980', '#495057'
      ];
    }
    
    return baseColors;
  }, [layoutMode]);

  return (
    <>
      <Button
        fullWidth={fullWidth}
        variant="outlined"
        size={size}
        startIcon={<IconComponent />}
        endIcon={<ArrowDropDown />}
        onClick={handleClick}
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          borderColor: layoutTheme.primary + '30',
          backgroundColor: layoutTheme.paper,
          color: layoutMode === 'photoshop' ? '#ffffff' : 'text.primary',
          '&:hover': {
            borderColor: layoutTheme.primary,
            backgroundColor: layoutTheme.secondary
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 1,
              backgroundColor: selectedColor,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
          <Typography variant="body2">
            {label}
          </Typography>
        </Box>
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPopover-paper': {
            borderRadius: 2,
            overflow: 'visible',
            backgroundColor: layoutTheme.background
          }
        }}
      >
        <ChromePicker
          color={selectedColor}
          onChange={handleColorChange}
          disableAlpha={false}
        />
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: layoutMode === 'photoshop' ? '#ffffff' : 'text.secondary' }}>
            Quick Colors
          </Typography>
          <Grid container spacing={1}>
            {colorPresets.map((presetColor) => (
              <Grid item xs={2.4} key={presetColor}>
                <Tooltip title={presetColor}>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1,
                      backgroundColor: presetColor,
                      border: '2px solid',
                      borderColor: selectedColor === presetColor ? layoutTheme.primary : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      },
                      transition: 'transform 0.2s'
                    }}
                    onClick={() => {
                      setSelectedColor(presetColor);
                      if (onChange) onChange(presetColor);
                    }}
                  >
                    {selectedColor === presetColor && (
                      <Check sx={{ 
                        fontSize: 16, 
                        color: '#fff', 
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' 
                      }} />
                    )}
                  </Box>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
          <TextField
            size="small"
            fullWidth
            value={selectedColor}
            onChange={(e) => {
              setSelectedColor(e.target.value);
              if (onChange) onChange(e.target.value);
            }}
            placeholder="#RRGGBB"
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Palette fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Popover>
    </>
  );
};

// =================== LAYOUT-SPECIFIC COMPONENTS ===================

// Word Mode Components - ENHANCED VERSION
const WordTextProperties = ({ element, onChange, layoutMode }) => {
  const theme = LAYOUT_CONFIGS[layoutMode]?.theme;
  
  return (
    <Box>
      <Accordion 
        defaultExpanded
        sx={{ 
          boxShadow: 'none',
          backgroundColor: theme.paper,
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextFields sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Text Formatting
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Font Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: theme.primary }}>Font Family</InputLabel>
                <Select
                  value={element.fontFamily || 'Calibri'}
                  label="Font Family"
                  onChange={(e) => onChange('fontFamily', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.primary + '30'
                    }
                  }}
                >
                  {[
                    'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Candara', 
                    'Comic Sans MS', 'Consolas', 'Courier New', 'Georgia',
                    'Helvetica', 'Impact', 'Lucida Console', 'Palatino',
                    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
                  ].map(font => (
                    <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Font Size and Spacing */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Font Size"
                type="number"
                value={element.fontSize || 11}
                onChange={(e) => onChange('fontSize', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">pt</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Letter Spacing"
                type="number"
                value={element.letterSpacing || 0}
                onChange={(e) => onChange('letterSpacing', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            
            {/* Line Height */}
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Line Height: {element.lineHeight || 1.2}
                </Typography>
              </Box>
              <Slider
                value={element.lineHeight || 1.2}
                onChange={(e, value) => onChange('lineHeight', value)}
                min={0.5}
                max={3}
                step={0.1}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: theme.primary
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.primary
                  }
                }}
              />
            </Grid>
            
            {/* Text Alignment */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Text Align</InputLabel>
                <Select
                  value={element.textAlign || 'left'}
                  label="Text Align"
                  onChange={(e) => onChange('textAlign', e.target.value)}
                >
                  <MenuItem value="left">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormatAlignLeft /> Left
                    </Box>
                  </MenuItem>
                  <MenuItem value="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormatAlignCenter /> Center
                    </Box>
                  </MenuItem>
                  <MenuItem value="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormatAlignRight /> Right
                    </Box>
                  </MenuItem>
                  <MenuItem value="justify">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormatAlignLeft /> Justify
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Formatting Tools */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                mb: 2, 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Tooltip title="Bold (Ctrl+B)">
                  <IconButton
                    size="small"
                    onClick={() => onChange('fontWeight', 
                      element.fontWeight === 'bold' ? 'normal' : 'bold'
                    )}
                    sx={{ 
                      backgroundColor: element.fontWeight === 'bold' ? theme.primary + '20' : 'transparent',
                      color: element.fontWeight === 'bold' ? theme.primary : 'inherit'
                    }}
                  >
                    <FormatBold />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Italic (Ctrl+I)">
                  <IconButton
                    size="small"
                    onClick={() => onChange('fontStyle', 
                      element.fontStyle === 'italic' ? 'normal' : 'italic'
                    )}
                    sx={{ 
                      backgroundColor: element.fontStyle === 'italic' ? theme.primary + '20' : 'transparent',
                      color: element.fontStyle === 'italic' ? theme.primary : 'inherit'
                    }}
                  >
                    <FormatItalic />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Underline (Ctrl+U)">
                  <IconButton
                    size="small"
                    onClick={() => onChange('underline', !element.underline)}
                    sx={{ 
                      backgroundColor: element.underline ? theme.primary + '20' : 'transparent',
                      color: element.underline ? theme.primary : 'inherit'
                    }}
                  >
                    <FormatUnderlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Strikethrough">
                  <IconButton
                    size="small"
                    onClick={() => onChange('strikethrough', !element.strikethrough)}
                    sx={{ 
                      backgroundColor: element.strikethrough ? theme.primary + '20' : 'transparent',
                      color: element.strikethrough ? theme.primary : 'inherit'
                    }}
                  >
                    <Box sx={{ 
                      textDecoration: 'line-through',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      abc
                    </Box>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Text Case">
                  <IconButton
                    size="small"
                    onClick={() => {
                      const cases = ['normal', 'uppercase', 'lowercase', 'capitalize'];
                      const current = element.textTransform || 'normal';
                      const next = cases[(cases.indexOf(current) + 1) % cases.length];
                      onChange('textTransform', next);
                    }}
                    sx={{ 
                      backgroundColor: element.textTransform ? theme.primary + '20' : 'transparent',
                      color: element.textTransform ? theme.primary : 'inherit'
                    }}
                  >
                    <Box sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Aa
                    </Box>
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            
            {/* Colors */}
            <Grid item xs={12}>
              <ColorPickerButton
                color={element.fill || '#000000'}
                onChange={(color) => onChange('fill', color)}
                label="Text Color"
                icon={FormatColorText}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            <Grid item xs={12}>
              <ColorPickerButton
                color={element.backgroundColor || 'transparent'}
                onChange={(color) => onChange('backgroundColor', color)}
                label="Background Color"
                icon={FormatColorFill}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            {/* Text Effects */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={element.textShadow || false}
                    onChange={(e) => onChange('textShadow', e.target.checked)}
                    color="primary"
                  />
                }
                label="Text Shadow"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Paragraph Settings */}
      <Accordion sx={{ 
        boxShadow: 'none',
        backgroundColor: theme.paper,
        '&:before': { display: 'none' }
      }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormatListBulleted sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Paragraph Settings
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Left Indent"
                type="number"
                value={element.paddingLeft || 0}
                onChange={(e) => onChange('paddingLeft', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Right Indent"
                type="number"
                value={element.paddingRight || 0}
                onChange={(e) => onChange('paddingRight', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Before Paragraph"
                type="number"
                value={element.marginTop || 0}
                onChange={(e) => onChange('marginTop', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="After Paragraph"
                type="number"
                value={element.marginBottom || 0}
                onChange={(e) => onChange('marginBottom', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            
            {/* List Styles */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>List Style</InputLabel>
                <Select
                  value={element.listStyle || 'none'}
                  label="List Style"
                  onChange={(e) => onChange('listStyle', e.target.value)}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="disc">Bulleted</MenuItem>
                  <MenuItem value="decimal">Numbered</MenuItem>
                  <MenuItem value="circle">Circle Bullets</MenuItem>
                  <MenuItem value="square">Square Bullets</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

/// PowerPoint Mode Components - ENHANCED VERSION
const PowerPointProperties = ({ element, onChange, layoutMode }) => {
  const theme = LAYOUT_CONFIGS[layoutMode]?.theme;
  
  return (
    <Box>
      {/* Shape Properties */}
      <Accordion 
        defaultExpanded
        sx={{ 
          boxShadow: 'none',
          backgroundColor: theme.paper,
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShapeLine sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Shape Formatting
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Fill Options */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                Fill
              </Typography>
              <ColorPickerButton
                color={element.fill || '#ffffff'}
                onChange={(color) => onChange('fill', color)}
                label="Shape Fill"
                icon={FormatColorFill}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            {/* Outline/Stroke */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                Outline
              </Typography>
              <ColorPickerButton
                color={element.stroke || '#d24726'}
                onChange={(color) => onChange('stroke', color)}
                label="Shape Outline"
                icon={BorderColor}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Outline Width"
                type="number"
                value={element.strokeWidth || 2}
                onChange={(e) => onChange('strokeWidth', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Outline Style</InputLabel>
                <Select
                  value={element.strokeType || 'solid'}
                  label="Outline Style"
                  onChange={(e) => onChange('strokeType', e.target.value)}
                >
                  <MenuItem value="solid">Solid</MenuItem>
                  <MenuItem value="dashed">Dashed</MenuItem>
                  <MenuItem value="dotted">Dotted</MenuItem>
                  <MenuItem value="double">Double</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Shape Effects */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                Shape Effects
              </Typography>
              <Select
                fullWidth
                size="small"
                value={element.shapeEffect || 'none'}
                onChange={(e) => onChange('shapeEffect', e.target.value)}
              >
                <MenuItem value="none">No Effect</MenuItem>
                <MenuItem value="shadow">Shadow</MenuItem>
                <MenuItem value="glow">Glow</MenuItem>
                <MenuItem value="reflection">Reflection</MenuItem>
                <MenuItem value="softEdges">Soft Edges</MenuItem>
                <MenuItem value="bevel">Bevel</MenuItem>
                <MenuItem value="preset3d">3D Format</MenuItem>
              </Select>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Animation Properties */}
      <Accordion sx={{ 
        boxShadow: 'none',
        backgroundColor: theme.paper,
        '&:before': { display: 'none' }
      }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixHigh sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Animation
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                Entrance Animation
              </Typography>
              <Select
                fullWidth
                size="small"
                value={element.entranceAnimation || 'none'}
                onChange={(e) => onChange('entranceAnimation', e.target.value)}
              >
                <MenuItem value="none">No Animation</MenuItem>
                <MenuItem value="fade">Fade In</MenuItem>
                <MenuItem value="flyIn">Fly In</MenuItem>
                <MenuItem value="zoom">Zoom In</MenuItem>
                <MenuItem value="bounce">Bounce</MenuItem>
                <MenuItem value="spin">Spin</MenuItem>
                <MenuItem value="float">Float In</MenuItem>
                <MenuItem value="whip">Whip</MenuItem>
                <MenuItem value="swivel">Swivel</MenuItem>
              </Select>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Duration"
                type="number"
                value={element.animationDuration || 0.5}
                onChange={(e) => onChange('animationDuration', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">s</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Delay"
                type="number"
                value={element.animationDelay || 0}
                onChange={(e) => onChange('animationDelay', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">s</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                Animation Direction
              </Typography>
              <Select
                fullWidth
                size="small"
                value={element.animationDirection || 'fromBottom'}
                onChange={(e) => onChange('animationDirection', e.target.value)}
              >
                <MenuItem value="fromBottom">From Bottom</MenuItem>
                <MenuItem value="fromTop">From Top</MenuItem>
                <MenuItem value="fromLeft">From Left</MenuItem>
                <MenuItem value="fromRight">From Right</MenuItem>
                <MenuItem value="fromCenter">From Center</MenuItem>
              </Select>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={element.animationLoop || false}
                    onChange={(e) => onChange('animationLoop', e.target.checked)}
                    color="primary"
                  />
                }
                label="Loop Animation"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={element.animationAutoStart || true}
                    onChange={(e) => onChange('animationAutoStart', e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto Start Animation"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Effects and 3D Format */}
      <Accordion sx={{ 
        boxShadow: 'none',
        backgroundColor: theme.paper,
        '&:before': { display: 'none' }
      }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Gradient sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              3D Format & Effects
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Shadow Effects */}
            <Grid item xs={12}>
              <ColorPickerButton
                color={element.shadowColor || 'rgba(0,0,0,0.2)'}
                onChange={(color) => onChange('shadowColor', color)}
                label="Shadow Color"
                icon={FormatColorFill}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Shadow X"
                type="number"
                value={element.shadowOffsetX || 2}
                onChange={(e) => onChange('shadowOffsetX', Number(e.target.value))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Shadow Y"
                type="number"
                value={element.shadowOffsetY || 2}
                onChange={(e) => onChange('shadowOffsetY', Number(e.target.value))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Shadow Blur: {element.shadowBlur || 0}px
                </Typography>
              </Box>
              <Slider
                value={element.shadowBlur || 0}
                onChange={(e, value) => onChange('shadowBlur', value)}
                min={0}
                max={50}
                step={1}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: theme.primary
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.primary
                  }
                }}
              />
            </Grid>
            
            {/* 3D Effects */}
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                3D Rotation
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="X"
                    type="number"
                    value={element.rotationX || 0}
                    onChange={(e) => onChange('rotationX', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">°</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Y"
                    type="number"
                    value={element.rotationY || 0}
                    onChange={(e) => onChange('rotationY', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">°</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Z"
                    type="number"
                    value={element.rotationZ || 0}
                    onChange={(e) => onChange('rotationZ', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">°</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Depth: {element.depth || 0}px
                </Typography>
              </Box>
              <Slider
                value={element.depth || 0}
                onChange={(e, value) => onChange('depth', value)}
                min={0}
                max={100}
                step={1}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: theme.primary
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.primary
                  }
                }}
              />
            </Grid>
            
            {/* Opacity */}
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Opacity: {element.opacity !== undefined ? Math.round(element.opacity * 100) : 100}%
                </Typography>
              </Box>
              <Slider
                value={element.opacity !== undefined ? element.opacity * 100 : 100}
                onChange={(e, value) => onChange('opacity', value / 100)}
                min={0}
                max={100}
                step={1}
              />
            </Grid>
            
            {/* Reflection */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={element.reflection || false}
                    onChange={(e) => onChange('reflection', e.target.checked)}
                    color="primary"
                  />
                }
                label="Add Reflection"
              />
            </Grid>
            
            {element.reflection && (
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Reflection Size: {element.reflectionSize || 10}%
                  </Typography>
                </Box>
                <Slider
                  value={element.reflectionSize || 10}
                  onChange={(e, value) => onChange('reflectionSize', value)}
                  min={0}
                  max={100}
                  step={1}
                  sx={{
                    '& .MuiSlider-thumb': {
                      backgroundColor: theme.primary
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: theme.primary
                    }
                  }}
                />
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// Photoshop Mode Components - ENHANCED VERSION
const PhotoshopProperties = ({ element, onChange, layoutMode }) => {
  const theme = LAYOUT_CONFIGS[layoutMode]?.theme;
  
  // Extended shape properties for Photoshop mode
  const renderShapeProperties = () => {
    if (!element.type || element.type === 'brush' || element.type === 'path') {
      return null;
    }
    
    return (
      <Accordion 
        defaultExpanded
        sx={{ 
          boxShadow: 'none',
          backgroundColor: theme.paper,
          '&:before': { display: 'none' },
          mb: 1
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShapeLine sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
              Shape Properties
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Fill and Stroke */}
            <Grid item xs={12}>
              <ColorPickerButton
                color={element.fill || '#3498db'}
                onChange={(color) => onChange('fill', color)}
                label="Fill Color"
                icon={FormatColorFill}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            <Grid item xs={12}>
              <ColorPickerButton
                color={element.stroke || '#2980b9'}
                onChange={(color) => onChange('stroke', color)}
                label="Stroke Color"
                icon={BorderColor}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Stroke Width"
                type="number"
                value={element.strokeWidth || 2}
                onChange={(e) => onChange('strokeWidth', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    color: '#ffffff'
                  }
                }}
              />
            </Grid>
            
            {/* Corner Radius (for rectangles) */}
            {(element.type === 'rectangle' || element.type === 'shape') && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Corner Radius"
                  type="number"
                  value={element.cornerRadius || 0}
                  onChange={(e) => onChange('cornerRadius', Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: '#ffffff'
                    }
                  }}
                />
              </Grid>
            )}
            
            {/* Border Style */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#ffffff' }}>Border Style</InputLabel>
                <Select
                  value={element.borderStyle || 'solid'}
                  label="Border Style"
                  onChange={(e) => onChange('borderStyle', e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      color: '#ffffff'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.23)'
                    }
                  }}
                >
                  <MenuItem value="solid">Solid</MenuItem>
                  <MenuItem value="dashed">Dashed</MenuItem>
                  <MenuItem value="dotted">Dotted</MenuItem>
                  <MenuItem value="double">Double</MenuItem>
                  <MenuItem value="groove">Groove</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Opacity */}
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Opacity: {element.opacity !== undefined ? Math.round(element.opacity * 100) : 100}%
                </Typography>
              </Box>
              <Slider
                value={element.opacity !== undefined ? element.opacity * 100 : 100}
                onChange={(e, value) => onChange('opacity', value / 100)}
                min={0}
                max={100}
                step={1}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: theme.primary
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.primary
                  }
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };
  
  // Layer effects for Photoshop
  const renderLayerEffects = () => (
    <Accordion sx={{ 
      boxShadow: 'none',
      backgroundColor: theme.paper,
      '&:before': { display: 'none' }
    }}>
      <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHigh sx={{ color: theme.primary }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
            Layer Effects
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {/* Blend Mode */}
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#ffffff' }}>Blend Mode</InputLabel>
              <Select
                value={element.blendMode || 'normal'}
                label="Blend Mode"
                onChange={(e) => onChange('blendMode', e.target.value)}
                sx={{
                  '& .MuiSelect-select': {
                    color: '#ffffff'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.23)'
                  }
                }}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="multiply">Multiply</MenuItem>
                <MenuItem value="screen">Screen</MenuItem>
                <MenuItem value="overlay">Overlay</MenuItem>
                <MenuItem value="darken">Darken</MenuItem>
                <MenuItem value="lighten">Lighten</MenuItem>
                <MenuItem value="color-dodge">Color Dodge</MenuItem>
                <MenuItem value="color-burn">Color Burn</MenuItem>
                <MenuItem value="hard-light">Hard Light</MenuItem>
                <MenuItem value="soft-light">Soft Light</MenuItem>
                <MenuItem value="difference">Difference</MenuItem>
                <MenuItem value="exclusion">Exclusion</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Shadow Effects */}
          <Grid item xs={12}>
            <ColorPickerButton
              color={element.shadowColor || 'rgba(0,0,0,0.5)'}
              onChange={(color) => onChange('shadowColor', color)}
              label="Shadow Color"
              icon={FormatColorFill}
              fullWidth
              size="small"
              layoutMode={layoutMode}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              label="Shadow X"
              type="number"
              value={element.shadowOffsetX || 0}
              onChange={(e) => onChange('shadowOffsetX', Number(e.target.value))}
              sx={{
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              size="small"
              label="Shadow Y"
              type="number"
              value={element.shadowOffsetY || 0}
              onChange={(e) => onChange('shadowOffsetY', Number(e.target.value))}
              sx={{
                '& .MuiInputBase-input': {
                  color: '#ffffff'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Shadow Blur: {element.shadowBlur || 0}px
              </Typography>
            </Box>
            <Slider
              value={element.shadowBlur || 0}
              onChange={(e, value) => onChange('shadowBlur', value)}
              min={0}
              max={50}
              step={1}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.primary
                },
                '& .MuiSlider-track': {
                  backgroundColor: theme.primary
                }
              }}
            />
          </Grid>
          
          {/* Glow Effect */}
          <Grid item xs={12}>
            <ColorPickerButton
              color={element.glowColor || 'rgba(255,255,255,0)'}
              onChange={(color) => onChange('glowColor', color)}
              label="Glow Color"
              icon={Gradient}
              fullWidth
              size="small"
              layoutMode={layoutMode}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Glow Size: {element.glowSize || 0}px
              </Typography>
            </Box>
            <Slider
              value={element.glowSize || 0}
              onChange={(e, value) => onChange('glowSize', value)}
              min={0}
              max={50}
              step={1}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.primary
                },
                '& .MuiSlider-track': {
                  backgroundColor: theme.primary
                }
              }}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
  
  // Advanced filters for Photoshop
  const renderAdvancedFilters = () => (
    <Accordion sx={{ 
      boxShadow: 'none',
      backgroundColor: theme.paper,
      '&:before': { display: 'none' }
    }}>
      <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BlurOn sx={{ color: theme.primary }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
            Advanced Filters
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {/* Blur */}
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Gaussian Blur: {element.blurRadius || 0}px
              </Typography>
            </Box>
            <Slider
              value={element.blurRadius || 0}
              onChange={(e, value) => onChange('blurRadius', value)}
              min={0}
              max={20}
              step={0.5}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.primary
                },
                '& .MuiSlider-track': {
                  backgroundColor: theme.primary
                }
              }}
            />
          </Grid>
          
          {/* Brightness/Contrast */}
          <Grid item xs={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Brightness: {element.brightness || 100}%
              </Typography>
            </Box>
            <Slider
              value={element.brightness || 100}
              onChange={(e, value) => onChange('brightness', value)}
              min={0}
              max={200}
              step={1}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.primary
                }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Contrast: {element.contrast || 100}%
              </Typography>
            </Box>
            <Slider
              value={element.contrast || 100}
              onChange={(e, value) => onChange('contrast', value)}
              min={0}
              max={200}
              step={1}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.primary
                }
              }}
            />
          </Grid>
          
          {/* Saturation/Hue */}
          <Grid item xs={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Saturation: {element.saturation || 100}%
              </Typography>
            </Box>
            <Slider
              value={element.saturation || 100}
              onChange={(e, value) => onChange('saturation', value)}
              min={0}
              max={200}
              step={1}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.primary
                }
              }}
            />
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Hue: {element.hue || 0}°
              </Typography>
            </Box>
            <Slider
              value={element.hue || 0}
              onChange={(e, value) => onChange('hue', value)}
              min={0}
              max={360}
              step={1}
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: theme.primary
                }
              }}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
  
  return (
    <Box>
      {/* Brush Properties (for brush/path elements) */}
      {(element.type === 'brush' || element.type === 'path') && (
        <Accordion 
          defaultExpanded
          sx={{ 
            boxShadow: 'none',
            backgroundColor: theme.paper,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Brush sx={{ color: theme.primary }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Brush Properties
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <ColorPickerButton
                  color={element.stroke || '#000000'}
                  onChange={(color) => onChange('stroke', color)}
                  label="Brush Color"
                  icon={Palette}
                  fullWidth
                  size="small"
                  layoutMode={layoutMode}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    Brush Size: {element.strokeWidth || 5}px
                  </Typography>
                </Box>
                <Slider
                  value={element.strokeWidth || 5}
                  onChange={(e, value) => onChange('strokeWidth', value)}
                  min={1}
                  max={100}
                  step={1}
                  sx={{
                    '& .MuiSlider-thumb': {
                      backgroundColor: theme.primary
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: theme.primary
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Opacity"
                  type="number"
                  value={element.globalAlpha !== undefined ? element.globalAlpha * 100 : 100}
                  onChange={(e) => onChange('globalAlpha', Number(e.target.value) / 100)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      color: '#ffffff'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#ffffff' }}>Line Cap</InputLabel>
                  <Select
                    value={element.lineCap || 'round'}
                    label="Line Cap"
                    onChange={(e) => onChange('lineCap', e.target.value)}
                    sx={{
                      '& .MuiSelect-select': {
                        color: '#ffffff'
                      }
                    }}
                  >
                    <MenuItem value="butt">Butt</MenuItem>
                    <MenuItem value="round">Round</MenuItem>
                    <MenuItem value="square">Square</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={element.dashed || false}
                      onChange={(e) => onChange('dashed', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Dashed Line"
                  sx={{ color: '#ffffff' }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
      
      {/* Shape Properties for other elements */}
      {element.type !== 'brush' && element.type !== 'path' && renderShapeProperties()}
      
      {/* Layer Effects */}
      {renderLayerEffects()}
      
      {/* Advanced Filters */}
      {renderAdvancedFilters()}
    </Box>
  );
};

// Excel Mode Components
const ExcelProperties = ({ element, onChange, layoutMode }) => {
  const theme = LAYOUT_CONFIGS[layoutMode]?.theme;
  
  return (
    <Box>
      <Accordion 
        defaultExpanded
        sx={{ 
          boxShadow: 'none',
          backgroundColor: theme.paper,
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableChart sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Table Properties
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Rows"
                type="number"
                value={element.rows || 3}
                onChange={(e) => onChange('rows', Number(e.target.value))}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Columns"
                type="number"
                value={element.columns || 3}
                onChange={(e) => onChange('columns', Number(e.target.value))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <ColorPickerButton
                color={element.cellColor || '#ffffff'}
                onChange={(color) => onChange('cellColor', color)}
                label="Cell Color"
                icon={FormatColorFill}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            
            <Grid item xs={12}>
              <ColorPickerButton
                color={element.borderColor || '#e2e8f0'}
                onChange={(color) => onChange('borderColor', color)}
                label="Border Color"
                icon={BorderAll}
                fullWidth
                size="small"
                layoutMode={layoutMode}
            />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Border Width: {element.borderWidth || 1}px
                </Typography>
              </Box>
              <Slider
                value={element.borderWidth || 1}
                onChange={(e, value) => onChange('borderWidth', value)}
                min={0}
                max={10}
                step={0.5}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: theme.primary
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.primary
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={element.alternateRows || false}
                    onChange={(e) => onChange('alternateRows', e.target.checked)}
                    color="primary"
                  />
                }
                label="Alternate Row Colors"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ 
        boxShadow: 'none',
        backgroundColor: theme.paper,
        '&:before': { display: 'none' }
      }}>
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChart sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Chart Properties
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Select
                fullWidth
                size="small"
                value={element.chartType || 'bar'}
                onChange={(e) => onChange('chartType', e.target.value)}
              >
                <MenuItem value="bar">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChart /> Bar Chart
                  </Box>
                </MenuItem>
                <MenuItem value="line">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChart /> Line Chart
                  </Box>
                </MenuItem>
                <MenuItem value="pie">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PieChart /> Pie Chart
                  </Box>
                </MenuItem>
              </Select>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={element.showGrid || true}
                    onChange={(e) => onChange('showGrid', e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Grid Lines"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={element.showLegend || true}
                    onChange={(e) => onChange('showLegend', e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Legend"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

// =================== MAIN PROPERTY PANEL COMPONENT ===================
const PropertyPanel = ({
  selectedElements = [],
  activeTool = 'select',
  toolProperties = {},
  onPropertyChange,
  onElementUpdate,
  onToolPropertyChange,
  showAdvanced = false,
  layoutMode = 'word'
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState(['general']);

  const layoutConfig = LAYOUT_CONFIGS[layoutMode] || LAYOUT_CONFIGS.word;
  const theme = layoutConfig.theme;
  
  const isEditingElements = selectedElements.length > 0;
  const selectedElement = selectedElements[0];
  
  const handlePropertyChange = (property, value) => {
    if (isEditingElements) {
      selectedElements.forEach(element => {
        if (onElementUpdate) {
          onElementUpdate(element.id, { [property]: value });
        }
      });
    } else {
      if (onToolPropertyChange) {
        onToolPropertyChange(property, value);
      }
    }
    
    if (onPropertyChange) {
      onPropertyChange(property, value);
    }
  };

  const renderLayoutSpecificProperties = () => {
    if (!selectedElement) return null;
    
    switch (layoutMode) {
      case 'word':
        return <WordTextProperties 
          element={selectedElement} 
          onChange={handlePropertyChange}
          layoutMode={layoutMode}
        />;
        
      case 'powerpoint':
        return <PowerPointProperties 
          element={selectedElement} 
          onChange={handlePropertyChange}
          layoutMode={layoutMode}
        />;
        
      case 'photoshop':
        return <PhotoshopProperties 
          element={selectedElement} 
          onChange={handlePropertyChange}
          layoutMode={layoutMode}
        />;
        
      case 'excel':
        return <ExcelProperties 
          element={selectedElement} 
          onChange={handlePropertyChange}
          layoutMode={layoutMode}
        />;
        
      default:
        return <WordTextProperties 
          element={selectedElement} 
          onChange={handlePropertyChange}
          layoutMode={layoutMode}
        />;
    }
  };

  const renderToolProperties = () => {
    const tool = activeTool;
    const props = toolProperties;
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ 
          fontWeight: 600, 
          color: theme.primary,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {layoutConfig.icon}
          {layoutConfig.name} - {tool.charAt(0).toUpperCase() + tool.slice(1)} Tool
        </Typography>
        
        {layoutMode === 'word' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ColorPickerButton
                color={props.color || '#000000'}
                onChange={(color) => onToolPropertyChange?.('color', color)}
                label="Text Color"
                icon={FormatColorText}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Font Family</InputLabel>
                <Select
                  value={props.fontFamily || 'Calibri'}
                  label="Font Family"
                  onChange={(e) => onToolPropertyChange?.('fontFamily', e.target.value)}
                >
                  {['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Cambria'].map(font => (
                    <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {layoutMode === 'photoshop' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ColorPickerButton
                color={props.color || '#000000'}
                onChange={(color) => onToolPropertyChange?.('color', color)}
                label="Brush Color"
                icon={Palette}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Brush Size: {props.size || 5}px
                </Typography>
              </Box>
              <Slider
                value={props.size || 5}
                onChange={(e, value) => onToolPropertyChange?.('size', value)}
                min={1}
                max={100}
                step={1}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: theme.primary
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.primary
                  }
                }}
              />
            </Grid>
          </Grid>
        )}
        
        {layoutMode === 'excel' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ColorPickerButton
                color={props.cellColor || '#ffffff'}
                onChange={(color) => onToolPropertyChange?.('cellColor', color)}
                label="Cell Color"
                icon={FormatColorFill}
                fullWidth
                size="small"
                layoutMode={layoutMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={props.showGrid !== false}
                    onChange={(e) => onToolPropertyChange?.('showGrid', e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Grid Lines"
              />
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  const renderGeneralProperties = () => {
    if (!selectedElement) return null;
    
    return (
      <Accordion 
        sx={{ 
          boxShadow: 'none',
          backgroundColor: theme.paper,
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.primary }} />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings sx={{ color: theme.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              General Properties
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="X Position"
                type="number"
                value={selectedElement.x || 0}
                onChange={(e) => handlePropertyChange('x', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Y Position"
                type="number"
                value={selectedElement.y || 0}
                onChange={(e) => handlePropertyChange('y', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
            </Grid>
            
            {(selectedElement.width !== undefined) && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Width"
                  type="number"
                  value={selectedElement.width || 100}
                  onChange={(e) => handlePropertyChange('width', Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                  }}
                />
              </Grid>
            )}
            
            {(selectedElement.height !== undefined) && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Height"
                  type="number"
                  value={selectedElement.height || 100}
                  onChange={(e) => handlePropertyChange('height', Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">px</InputAdornment>,
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <Tooltip title="Visible">
                  <IconButton
                    size="small"
                    onClick={() => handlePropertyChange('visible', 
                      selectedElement.visible === false ? true : false
                    )}
                    sx={{ 
                      backgroundColor: selectedElement.visible !== false ? theme.primary + '20' : 'transparent',
                      color: selectedElement.visible !== false ? theme.primary : 'inherit'
                    }}
                  >
                    {selectedElement.visible !== false ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Lock/Unlock">
                  <IconButton
                    size="small"
                    onClick={() => handlePropertyChange('locked', 
                      !selectedElement.locked
                    )}
                    sx={{ 
                      backgroundColor: selectedElement.locked ? theme.primary + '20' : 'transparent',
                      color: selectedElement.locked ? theme.primary : 'inherit'
                    }}
                  >
                    {selectedElement.locked ? <Lock /> : <LockOpen />}
                  </IconButton>
                </Tooltip>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Opacity: {selectedElement.opacity !== undefined ? Math.round(selectedElement.opacity * 100) : 100}%
                  </Typography>
                  <Slider
                    value={selectedElement.opacity !== undefined ? selectedElement.opacity * 100 : 100}
                    onChange={(e, value) => handlePropertyChange('opacity', value / 100)}
                    min={0}
                    max={100}
                    step={1}
                    size="small"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  // Layout mode indicator badge
  const LayoutModeBadge = () => (
    <Chip
      icon={layoutConfig.icon}
      label={layoutConfig.name}
      size="small"
      sx={{
        backgroundColor: theme.primary + '20',
        color: theme.primary,
        fontWeight: 700,
        border: `1px solid ${theme.primary}30`,
        '& .MuiChip-icon': {
          color: theme.primary
        }
      }}
    />
  );

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: theme.background,
      color: layoutMode === 'photoshop' ? '#ffffff' : 'text.primary'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.paper,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            Properties Inspector
            <LayoutModeBadge />
          </Typography>
          {isEditingElements && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedElements.length} element{selectedElements.length > 1 ? 's' : ''} selected
              {selectedElement?.type && (
                <Chip 
                  label={selectedElement.type}
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: activeTab === 0 ? 0 : 2
      }}>
        {activeTab === 0 ? (
          <Box>
            {isEditingElements ? (
              <Box sx={{ p: 2 }}>
                {renderLayoutSpecificProperties()}
                {renderGeneralProperties()}
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>
                {renderToolProperties()}
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 2,
                    backgroundColor: theme.secondary,
                    color: theme.primary
                  }}
                >
                  <Typography variant="caption">
                    Select an element to edit its properties, or use the {layoutConfig.name} tools above.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Advanced {layoutConfig.name} Settings
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {layoutConfig.features.map(feature => `• ${feature}`).join('\n')}
            </Typography>
            
            {layoutMode === 'excel' && (
              <FormGroup>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Snap to Grid"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Show Rulers"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Show Formulas"
                />
              </FormGroup>
            )}
            
            {layoutMode === 'photoshop' && (
              <FormGroup>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Show Layer Bounds"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Show Pixel Grid"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Anti-aliasing"
                />
              </FormGroup>
            )}
          </Box>
        )}
      </Box>
      
      {/* Tabs */}
      <Box sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: theme.paper
      }}>
        <Tabs 
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ 
            minHeight: 48,
            '& .MuiTabs-indicator': {
              backgroundColor: theme.primary
            },
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              '&.Mui-selected': {
                color: theme.primary
              }
            }
          }}
        >
          <Tab label="Properties" />
          <Tab label="Advanced" />
        </Tabs>
      </Box>
      
      {/* Empty state */}
      {!isEditingElements && activeTool === 'select' && (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4,
          textAlign: 'center'
        }}>
          <Box>
            {layoutConfig.icon}
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
              Select an element or tool to edit properties
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
              Using {layoutConfig.name} mode
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PropertyPanel;