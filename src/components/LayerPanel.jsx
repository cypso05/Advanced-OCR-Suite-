// LayerPanel.jsx - CORRECTED IMPORT SECTION
// REMOVE all non-existent imports and replace with valid ones

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  Divider,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon as MuiListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Avatar,
  Stack
} from '@mui/material';

import {
  // Navigation
  ExpandMore,
  ExpandLess,
  ArrowDropDown,
  ArrowUpward,
  ArrowDownward,
  CallMade,
  TrendingFlat,
  SwapHoriz,
  Home,
  
  // Text & Typography
  TextFields,
  TextFormat,
  Title,
  FormatQuote,
  FormatAlignLeft,
  FormatListBulleted,
  FormatListNumbered,
  Subtitles,
  FormatPaint,
  
  // Shapes & Graphics
  CropSquare,
  Circle,
  Star,
  Favorite,
  Pentagon,
  ChangeHistory,
  TripOrigin,
  HorizontalRule,
  Cloud,
  Polyline,
  Waves,
  
  // UI & Actions
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Delete,
  Add,
  Edit,
  ContentCopy,
  Settings,
  MoreVert,
  MoreHoriz,
  Check,
  Close,
  Verified,
  Info,
  Bookmark,
  Link,
  Email,
  ChatBubble,
  Chat,
  Build,
  
  // Media
  Image as ImageIcon,
  OndemandVideo,
  MusicNote,
  Language,
  Code,
  
  // Data & Charts
  TableChart,
  InsertChart,
  Timeline,
  ShowChart,
  ScatterPlot,
  Functions,
  FilterList,
  TrendingUp,
  
  // Layout
  Layers,
  ViewSidebar,
  ViewColumn,
  Dashboard,
  CardMembership,
  ViewCarousel,
  
  // Effects & Tools
  Brush,
  Create,
  AutoFixHigh,
  Gradient,
  WaterDrop,
  BlurCircular,
  BlurLinear,
  InvertColors,
  FlashOn,
  Tune,
  Adjust,
  Style,
  Pattern,
  Map,
  Looks,
  
  // Status & Indicators
  CheckBox,
  RadioButtonChecked,
  ToggleOn,
  SwitchRight,
  DonutLarge,
  StarRate,
  EmojiEvents,
  AccountCircle,
  Label,
  Category,
  
  // Time & Sequence
  AccessTime,
  Timer,
  ExpandCircleDown,
  
  // Documents
  Description,
  LibraryBooks,
  Book,
  LooksOne,
  BorderBottom,
  
  // Special
  SmartButton,
  Widgets,
  WidgetsOutlined,
  CropFree,
  FilterNone,
  Crop54,
  SelectAll,
  Straighten,
  GridOn,
  TouchApp,
  Speed,
  LinearScale,
  
  // Presentation
  Slideshow,
  SwitchCamera,
  Animation,
  Notes,
  Poll,

   Filter,
  BorderStyle,
  HighlightAlt,
  
  // Add any missing icons individually
} from '@mui/icons-material';

// Import element types utilities
import { 
  ELEMENT_TYPES, 
  getElementCategory,
  getElementTypeName,
  getElementDescription 
} from '../utils/elementTypes';

// Additional icons that exist
import PageviewIcon from '@mui/icons-material/Pageview';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';

// IMPORT THESE SEPARATELY (they don't have named exports)
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import HorizontalSplitIcon from '@mui/icons-material/HorizontalSplit';
// These must be imported separately
import BarChart from '@mui/icons-material/BarChart';
import PieChart from '@mui/icons-material/PieChart';
import Hexagon from '@mui/icons-material/Hexagon';
import Diamond from '@mui/icons-material/Diamond';

// If you really need BarChart, you can use from charts package or alternative:
// import { BarChart } from '@mui/x-charts'; // Different package
// OR use Timeline as alternative for BarChart

// Mode-specific element groupings
const getModeElementGroups = (mode) => {
  const allElements = Object.values(ELEMENT_TYPES);
  
  const groups = {
    // Word Mode Groups
    word: [
      {
        name: 'Text & Typography',
        icon: <TextFormat />,
        elements: [
          ELEMENT_TYPES.TEXT,
          ELEMENT_TYPES.TEXTBOX,
          ELEMENT_TYPES.PARAGRAPH,
          ELEMENT_TYPES.HEADING,
          ELEMENT_TYPES.BULLET_LIST,
          ELEMENT_TYPES.NUMBERED_LIST,
          ELEMENT_TYPES.QUOTE,
          ELEMENT_TYPES.CAPTION,
          ELEMENT_TYPES.FOOTNOTE,
          ELEMENT_TYPES.WATERMARK,
          ELEMENT_TYPES.PAGE_NUMBER
        ]
      },
      {
        name: 'Document Structure',
        icon: <Description />,
        elements: [
          ELEMENT_TYPES.HEADER,
          ELEMENT_TYPES.FOOTER,
          ELEMENT_TYPES.SIDEBAR,
          ELEMENT_TYPES.COLUMN,
          ELEMENT_TYPES.PAGE_BREAK,
          ELEMENT_TYPES.SECTION,
          ELEMENT_TYPES.TOC,
          ELEMENT_TYPES.INDEX,
          ELEMENT_TYPES.BIBLIOGRAPHY
        ]
      },
      {
        name: 'Word Features',
        icon: <Title />,
        elements: [
          ELEMENT_TYPES.STYLE,
          ELEMENT_TYPES.TEMPLATE,
          ELEMENT_TYPES.MAIL_MERGE,
          ELEMENT_TYPES.COMMENT,
          ELEMENT_TYPES.TRACK_CHANGES,
          ELEMENT_TYPES.HYPERLINK,
          ELEMENT_TYPES.BOOKMARK,
          ELEMENT_TYPES.CROSS_REFERENCE
        ]
      },
      {
        name: 'Shapes & Drawing',
        icon: <Brush />,
        elements: allElements.filter(type => 
          ['shape', 'drawing'].includes(getElementCategory(type))
        ).slice(0, 10) // Limit for display
      },
      {
        name: 'Media',
        icon: <ImageIcon />,
        elements: [ELEMENT_TYPES.IMAGE, ELEMENT_TYPES.IFRAME, ELEMENT_TYPES.EMBED]
      }
    ],

    // Excel Mode Groups
    excel: [
      {
        name: 'Data & Tables',
        icon: <TableChart />,
        elements: [
          ELEMENT_TYPES.TABLE,
          ELEMENT_TYPES.SPREADSHEET,
          ELEMENT_TYPES.DATA_TABLE,
          ELEMENT_TYPES.PIVOT_TABLE,
          ELEMENT_TYPES.CELL_RANGE
        ]
      },
      {
        name: 'Formulas & Analysis',
        icon: <Functions />,
        elements: [
          ELEMENT_TYPES.FORMULA,
          ELEMENT_TYPES.CONDITIONAL_FORMAT,
          ELEMENT_TYPES.DATA_VALIDATION,
          ELEMENT_TYPES.SORT_FILTER,
          ELEMENT_TYPES.PIVOT_FIELD
        ]
      },
      {
        name: 'Charts & Visualization',
        icon: <InsertChart />,
        elements: [
          ELEMENT_TYPES.CHART,
          ELEMENT_TYPES.BAR_CHART,
          ELEMENT_TYPES.PIE_CHART,
          ELEMENT_TYPES.LINE_CHART,
          ELEMENT_TYPES.SCATTER_PLOT,
          ELEMENT_TYPES.SPARKLINE,
          ELEMENT_TYPES.PIVOT_CHART
        ]
      },
      {
        name: 'Shapes & Graphics',
        icon: <CropSquare />,
        elements: [
          ELEMENT_TYPES.RECTANGLE,
          ELEMENT_TYPES.CIRCLE,
          ELEMENT_TYPES.LINE,
          ELEMENT_TYPES.ARROW,
          ELEMENT_TYPES.TEXTBOX,
          ELEMENT_TYPES.IMAGE
        ]
      }
    ],

    // PowerPoint Mode Groups
    powerpoint: [
      {
        name: 'Presentation Elements',
        icon: <Slideshow />,
        elements: [
          ELEMENT_TYPES.SLIDE,
          ELEMENT_TYPES.SLIDE_MASTER,
          ELEMENT_TYPES.TRANSITION,
          ELEMENT_TYPES.ANIMATION,
          ELEMENT_TYPES.PRESENTER_NOTES,
          ELEMENT_TYPES.TIMER,
          ELEMENT_TYPES.POLL
        ]
      },
      {
        name: 'Content & Media',
        icon: <Widgets />,
        elements: [
          ELEMENT_TYPES.TEXT,
          ELEMENT_TYPES.HEADING,
          ELEMENT_TYPES.BULLET_LIST,
          ELEMENT_TYPES.IMAGE,
          ELEMENT_TYPES.VIDEO,
          ELEMENT_TYPES.AUDIO,
          ELEMENT_TYPES.IFRAME
        ]
      },
      {
        name: 'Smart Art & Charts',
        icon: <SmartButton />,
        elements: [
          ELEMENT_TYPES.SMART_ART,
          ELEMENT_TYPES.CHART,
          ELEMENT_TYPES.TABLE,
          ELEMENT_TYPES.BAR_CHART,
          ELEMENT_TYPES.PIE_CHART
        ]
      },
      {
        name: 'Shapes & Effects',
        icon: <AutoFixHigh />,
        elements: [
          ELEMENT_TYPES.RECTANGLE,
          ELEMENT_TYPES.CIRCLE,
          ELEMENT_TYPES.ARROW,
          ELEMENT_TYPES.STAR,
          ELEMENT_TYPES.SHAPE,
          ELEMENT_TYPES.SHADOW,
          ELEMENT_TYPES.GLOW,
          ELEMENT_TYPES.TRANSITION
        ]
      }
    ],

    // Photoshop Mode Groups
    photoshop: [
      {
        name: 'Layers & Effects',
        icon: <Layers />,
        elements: [
          ELEMENT_TYPES.LAYER,
          ELEMENT_TYPES.ADJUSTMENT_LAYER,
          ELEMENT_TYPES.MASK,
          ELEMENT_TYPES.CLIP_PATH,
          ELEMENT_TYPES.FILTER,
          ELEMENT_TYPES.BLEND_MODE,
          ELEMENT_TYPES.LAYER_STYLE
        ]
      },
      {
        name: 'Adjustments & Filters',
        icon: <Tune />,
        elements: [
          ELEMENT_TYPES.ADJUSTMENT,
          ELEMENT_TYPES.GRADIENT_MAP,
          ELEMENT_TYPES.COLOR_LOOKUP,
          ELEMENT_TYPES.CURVES,
          ELEMENT_TYPES.LEVELS,
          ELEMENT_TYPES.PATTERN
        ]
      },
      {
        name: 'Selection Tools',
        icon: <SelectAll />,
        elements: [
          ELEMENT_TYPES.SELECTION,
          ELEMENT_TYPES.MARQUEE,
          ELEMENT_TYPES.LASSO,
          ELEMENT_TYPES.MAGIC_WAND
        ]
      },
      {
        name: 'Smart Objects',
        icon: <WidgetsOutlined />,
        elements: [ELEMENT_TYPES.SMART_OBJECT]
      },
      {
        name: 'Drawing & Painting',
        icon: <Create />,
        elements: [
          ELEMENT_TYPES.BRUSH,
          ELEMENT_TYPES.PEN,
          ELEMENT_TYPES.PENCIL,
          ELEMENT_TYPES.ERASER,
          ELEMENT_TYPES.HIGHLIGHTER
        ]
      },
      {
        name: 'Shapes',
        icon: <CropSquare />,
        elements: allElements.filter(type => 
          getElementCategory(type) === 'shape'
        ).slice(0, 8)
      }
    ],

    // Modern Web Mode (optional)
    web: [
      {
        name: 'UI Components',
        icon: <Dashboard />,
        elements: [
          ELEMENT_TYPES.BUTTON,
          ELEMENT_TYPES.CHECKBOX,
          ELEMENT_TYPES.RADIO_BUTTON,
          ELEMENT_TYPES.DROPDOWN,
          ELEMENT_TYPES.TEXT_INPUT,
          ELEMENT_TYPES.SLIDER,
          ELEMENT_TYPES.TOGGLE_SWITCH,
          ELEMENT_TYPES.PROGRESS_CIRCLE,
          ELEMENT_TYPES.PROGRESS_BAR,
          ELEMENT_TYPES.RATING_STARS
        ]
      },
      {
        name: 'Layout & Cards',
        icon: <CardMembership />,
        elements: [
          ELEMENT_TYPES.CARD,
          ELEMENT_TYPES.MODAL,
          ELEMENT_TYPES.TOOLTIP,
          ELEMENT_TYPES.BADGE,
          ELEMENT_TYPES.AVATAR,
          ELEMENT_TYPES.CHIP,
          ELEMENT_TYPES.DIVIDER
        ]
      },
      {
        name: 'Interactive Components',
        icon: <TouchApp />,
        elements: [
          ELEMENT_TYPES.ACCORDION,
          ELEMENT_TYPES.CAROUSEL,
          ELEMENT_TYPES.TIMELINE,
          ELEMENT_TYPES.STEPPER,
          ELEMENT_TYPES.BREADCRUMB,
          ELEMENT_TYPES.PAGINATION
        ]
      },
      {
        name: 'Content Elements',
        icon: <TextFields />,
        elements: [
          ELEMENT_TYPES.TEXT,
          ELEMENT_TYPES.PARAGRAPH,
          ELEMENT_TYPES.HEADING,
          ELEMENT_TYPES.IMAGE,
          ELEMENT_TYPES.VIDEO,
          ELEMENT_TYPES.AUDIO
        ]
      }
    ]
  };

  return groups[mode] || groups.word; // Default to word mode
};

// Complete icon mapping for all element types - FULLY VALIDATED VERSION
const getElementIconMUI = (type) => {
  const iconMap = {
    // Text Elements
    [ELEMENT_TYPES.TEXT]: <TextFields fontSize="small" />,
    [ELEMENT_TYPES.TEXTBOX]: <TextFormat fontSize="small" />,
    [ELEMENT_TYPES.PARAGRAPH]: <FormatAlignLeft fontSize="small" />,
    [ELEMENT_TYPES.HEADING]: <Title fontSize="small" />,
    [ELEMENT_TYPES.BULLET_LIST]: <FormatListBulleted fontSize="small" />,
    [ELEMENT_TYPES.NUMBERED_LIST]: <FormatListNumbered fontSize="small" />,
    [ELEMENT_TYPES.QUOTE]: <FormatQuote fontSize="small" />,
    [ELEMENT_TYPES.CAPTION]: <Subtitles fontSize="small" />,
    [ELEMENT_TYPES.FOOTNOTE]: <BorderBottom fontSize="small" />,
    [ELEMENT_TYPES.WATERMARK]: <WaterDrop fontSize="small" />,
    [ELEMENT_TYPES.PAGE_NUMBER]: <LooksOne fontSize="small" />,
    
    // Basic Shapes
    [ELEMENT_TYPES.RECTANGLE]: <CropSquare fontSize="small" />,
    [ELEMENT_TYPES.CIRCLE]: <Circle fontSize="small" />,
    [ELEMENT_TYPES.ELLIPSE]: <TripOrigin fontSize="small" />,
    [ELEMENT_TYPES.LINE]: <HorizontalRule fontSize="small" />,
    [ELEMENT_TYPES.ARROW]: <TrendingFlat fontSize="small" />,
    [ELEMENT_TYPES.POLYGON]: <Pentagon fontSize="small" />,
    [ELEMENT_TYPES.STAR]: <Star fontSize="small" />,
    [ELEMENT_TYPES.TRIANGLE]: <ChangeHistory fontSize="small" />,
    [ELEMENT_TYPES.HEXAGON]: <Hexagon fontSize="small" />,
    [ELEMENT_TYPES.OCTAGON]: <CropSquare fontSize="small" />,
    [ELEMENT_TYPES.HEART]: <Favorite fontSize="small" />,
    [ELEMENT_TYPES.DIAMOND]: <Diamond fontSize="small" />,
    [ELEMENT_TYPES.SPEECH_BUBBLE]: <ChatBubble fontSize="small" />,
    [ELEMENT_TYPES.CALL_OUT]: <CallMade fontSize="small" />,
    [ELEMENT_TYPES.CLOUD]: <Cloud fontSize="small" />,
    [ELEMENT_TYPES.SPIRAL]: <BlurCircular fontSize="small" />,
    [ELEMENT_TYPES.WAVE]: <Waves fontSize="small" />,
    [ELEMENT_TYPES.GEAR]: <Build fontSize="small" />,
    [ELEMENT_TYPES.CROSS]: <Close fontSize="small" />,
    [ELEMENT_TYPES.CHECKMARK]: <Check fontSize="small" />,

  // Drawing Tools - LINE 94-100
  [ELEMENT_TYPES.PATH]: <Polyline fontSize="small" />,
  [ELEMENT_TYPES.BRUSH]: <Brush fontSize="small" />,
  [ELEMENT_TYPES.PEN]: <Create fontSize="small" />,
  [ELEMENT_TYPES.PENCIL]: <Edit fontSize="small" />, // Changed from FormatColorText
  [ELEMENT_TYPES.HIGHLIGHTER]: <HighlightAlt fontSize="small" />,
  [ELEMENT_TYPES.ERASER]: <AutoFixHigh fontSize="small" />,

    // Media
    [ELEMENT_TYPES.IMAGE]: <ImageIcon fontSize="small" />,
    [ELEMENT_TYPES.VIDEO]: <OndemandVideo fontSize="small" />,
    [ELEMENT_TYPES.AUDIO]: <MusicNote fontSize="small" />,
    [ELEMENT_TYPES.IFRAME]: <Language fontSize="small" />,
    [ELEMENT_TYPES.EMBED]: <Code fontSize="small" />,
    
    // Data & Charts
    [ELEMENT_TYPES.TABLE]: <TableChart fontSize="small" />,
    [ELEMENT_TYPES.CHART]: <InsertChart fontSize="small" />,
    [ELEMENT_TYPES.SMART_ART]: <SmartButton fontSize="small" />,
    [ELEMENT_TYPES.PIVOT_TABLE]: <FilterList fontSize="small" />,
    [ELEMENT_TYPES.SPREADSHEET]: <Dashboard fontSize="small" />,
    [ELEMENT_TYPES.DATA_TABLE]: <Widgets fontSize="small" />,
    [ELEMENT_TYPES.BAR_CHART]: <BarChart fontSize="small" />,
    [ELEMENT_TYPES.PIE_CHART]: <PieChart fontSize="small" />,
    [ELEMENT_TYPES.LINE_CHART]: <Timeline fontSize="small" />,
    [ELEMENT_TYPES.SCATTER_PLOT]: <ScatterPlot fontSize="small" />,
    [ELEMENT_TYPES.GAUGE]: <Speed fontSize="small" />,
    [ELEMENT_TYPES.PROGRESS_BAR]: <LinearScale fontSize="small" />,
    
    // UI Components
    [ELEMENT_TYPES.BUTTON]: <SmartButton fontSize="small" />,
    [ELEMENT_TYPES.CHECKBOX]: <CheckBox fontSize="small" />,
    [ELEMENT_TYPES.RADIO_BUTTON]: <RadioButtonChecked fontSize="small" />,
    [ELEMENT_TYPES.DROPDOWN]: <ArrowDropDown fontSize="small" />,
    [ELEMENT_TYPES.TEXT_INPUT]: <TextFields fontSize="small" />,
    [ELEMENT_TYPES.SLIDER]: <Tune fontSize="small" />,
    [ELEMENT_TYPES.TOGGLE_SWITCH]: <ToggleOn fontSize="small" />,
    [ELEMENT_TYPES.PROGRESS_CIRCLE]: <DonutLarge fontSize="small" />,
    [ELEMENT_TYPES.RATING_STARS]: <StarRate fontSize="small" />,
    
    // Special & Effects
    [ELEMENT_TYPES.GROUP]: <Category fontSize="small" />,
    [ELEMENT_TYPES.FRAME]: <CropFree fontSize="small" />,
    [ELEMENT_TYPES.MASK]: <FilterNone fontSize="small" />,
    [ELEMENT_TYPES.CLIP_PATH]: <Crop54 fontSize="small" />,
    [ELEMENT_TYPES.LAYER]: <Layers fontSize="small" />,
    [ELEMENT_TYPES.ADJUSTMENT_LAYER]: <Adjust fontSize="small" />,
    [ELEMENT_TYPES.FILTER]: <Filter fontSize="small" />,
    [ELEMENT_TYPES.BLEND_MODE]: <BlurLinear fontSize="small" />,
    [ELEMENT_TYPES.SHADOW]: <BlurCircular fontSize="small" />,
    [ELEMENT_TYPES.GLOW]: <FlashOn fontSize="small" />,
    [ELEMENT_TYPES.REFLECTION]: <InvertColors fontSize="small" />,
    [ELEMENT_TYPES.TRANSPARENCY]: <InvertColors fontSize="small" />,
    [ELEMENT_TYPES.GRID]: <GridOn fontSize="small" />,
    [ELEMENT_TYPES.GUIDE]: <Straighten fontSize="small" />,
    [ELEMENT_TYPES.RULER]: <Straighten fontSize="small" />,
    [ELEMENT_TYPES.FILTER]: <Filter fontSize="small" />,
    
    // Presentation
    [ELEMENT_TYPES.SLIDE]: <Slideshow fontSize="small" />,
    [ELEMENT_TYPES.SLIDE_MASTER]: <SwitchCamera fontSize="small" />,
    [ELEMENT_TYPES.TRANSITION]: <Animation fontSize="small" />,
    [ELEMENT_TYPES.ANIMATION]: <Animation fontSize="small" />,
    [ELEMENT_TYPES.PRESENTER_NOTES]: <Notes fontSize="small" />,
    [ELEMENT_TYPES.TIMER]: <Timer fontSize="small" />,
    [ELEMENT_TYPES.POLL]: <Poll fontSize="small" />,
    
    // Document Elements (FIXED!)
    [ELEMENT_TYPES.HEADER]: <VerticalAlignTopIcon fontSize="small" />,
    [ELEMENT_TYPES.FOOTER]: <VerticalAlignBottomIcon fontSize="small" />,
    [ELEMENT_TYPES.SIDEBAR]: <ViewSidebar fontSize="small" />,
    [ELEMENT_TYPES.COLUMN]: <ViewColumn fontSize="small" />,
    [ELEMENT_TYPES.PAGE_BREAK]: <HorizontalSplitIcon fontSize="small" />,
    [ELEMENT_TYPES.SECTION]: <Book fontSize="small" />,
    [ELEMENT_TYPES.TOC]: <LibraryBooks fontSize="small" />,
    [ELEMENT_TYPES.INDEX]: <LibraryBooks fontSize="small" />,
    [ELEMENT_TYPES.BIBLIOGRAPHY]: <LibraryBooks fontSize="small" />,
    
    // Photoshop Specific
    [ELEMENT_TYPES.SMART_OBJECT]: <WidgetsOutlined fontSize="small" />,
    [ELEMENT_TYPES.ADJUSTMENT]: <Adjust fontSize="small" />,
    [ELEMENT_TYPES.LAYER_STYLE]: <Style fontSize="small" />,
    [ELEMENT_TYPES.PATTERN]: <Pattern fontSize="small" />,
    [ELEMENT_TYPES.GRADIENT_MAP]: <Map fontSize="small" />,
    [ELEMENT_TYPES.COLOR_LOOKUP]: <Looks fontSize="small" />,
    [ELEMENT_TYPES.CURVES]: <ShowChart fontSize="small" />,
    [ELEMENT_TYPES.LEVELS]: <Tune fontSize="small" />,
    [ELEMENT_TYPES.SELECTION]: <SelectAll fontSize="small" />,
    [ELEMENT_TYPES.MARQUEE]: <Crop54 fontSize="small" />,
    [ELEMENT_TYPES.LASSO]: <Polyline fontSize="small" />,
    [ELEMENT_TYPES.MAGIC_WAND]: <AutoFixHigh fontSize="small" />,
    
    // Excel Specific
    [ELEMENT_TYPES.CELL_RANGE]: <SelectAll fontSize="small" />,
    [ELEMENT_TYPES.FORMULA]: <Functions fontSize="small" />,
    [ELEMENT_TYPES.CONDITIONAL_FORMAT]: <FormatPaint fontSize="small" />,
    [ELEMENT_TYPES.DATA_VALIDATION]: <Verified fontSize="small" />,
    [ELEMENT_TYPES.PIVOT_CHART]: <InsertChart fontSize="small" />,
    [ELEMENT_TYPES.SPARKLINE]: <TrendingUp fontSize="small" />,
    [ELEMENT_TYPES.SORT_FILTER]: <FilterList fontSize="small" />,
    [ELEMENT_TYPES.PIVOT_FIELD]: <TableChart fontSize="small" />,
    
    // Word Specific
    [ELEMENT_TYPES.STYLE]: <Style fontSize="small" />,
    [ELEMENT_TYPES.TEMPLATE]: <Description fontSize="small" />,
    [ELEMENT_TYPES.MAIL_MERGE]: <Email fontSize="small" />,
    [ELEMENT_TYPES.COMMENT]: <Chat fontSize="small" />,
    [ELEMENT_TYPES.TRACK_CHANGES]: <Edit fontSize="small" />,
    [ELEMENT_TYPES.HYPERLINK]: <Link fontSize="small" />,
    [ELEMENT_TYPES.BOOKMARK]: <Bookmark fontSize="small" />,
    [ELEMENT_TYPES.CROSS_REFERENCE]: <SwapHoriz fontSize="small" />,
    
    // Modern Web & App
    [ELEMENT_TYPES.CARD]: <CardMembership fontSize="small" />,
    [ELEMENT_TYPES.MODAL]: <Chat fontSize="small" />,
    [ELEMENT_TYPES.TOOLTIP]: <Info fontSize="small" />,
    [ELEMENT_TYPES.BADGE]: <EmojiEvents fontSize="small" />,
    [ELEMENT_TYPES.AVATAR]: <AccountCircle fontSize="small" />,
    [ELEMENT_TYPES.CHIP]: <Label fontSize="small" />,
    [ELEMENT_TYPES.DIVIDER]: <HorizontalRule fontSize="small" />,
    [ELEMENT_TYPES.ACCORDION]: <ExpandCircleDown fontSize="small" />,
    [ELEMENT_TYPES.CAROUSEL]: <ViewCarousel fontSize="small" />,
    [ELEMENT_TYPES.TIMELINE]: <AccessTime fontSize="small" />,
    [ELEMENT_TYPES.STEPPER]: <FormatListNumbered fontSize="small" />,
    [ELEMENT_TYPES.BREADCRUMB]: <Home fontSize="small" />,
    [ELEMENT_TYPES.PAGINATION]: <MoreHoriz fontSize="small" />,
    
    // Generic Types
    [ELEMENT_TYPES.SHAPE]: <CropSquare fontSize="small" />,
    [ELEMENT_TYPES.ICON]: <Label fontSize="small" />,
    [ELEMENT_TYPES.GRADIENT]: <Gradient fontSize="small" />,
    [ELEMENT_TYPES.BORDER]: <BorderStyle fontSize="small" />,
    [ELEMENT_TYPES.BORDER]: <BorderStyle fontSize="small" />,
  };

  return iconMap[type] || <Label fontSize="small" />;
};

const LayerPanel = ({
  layers = [],
  selectedLayerId,
  selectedElements = [],
  onLayerSelect,
  onLayerCreate,
  onLayerDelete,
  onLayerUpdate,
  onElementSelect,
  onElementDelete,
  onElementDuplicate,
  onElementUpdate,
  showElementCount = true,
  allowLayerOperations = true,
  layoutMode = 'word'
}) => {
  const [expandedLayers, setExpandedLayers] = useState(['layer-1']);
  const [activeTab, setActiveTab] = useState(0);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    elementId: null,
    element: null
  });
  
  // Dialogs State
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedTargetLayer, setSelectedTargetLayer] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const toggleLayer = (layerId) => {
    setExpandedLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const getLayerElements = (layerId) => {
    return selectedElements.filter(el => el.layerId === layerId);
  };

  // Get mode-specific element groups
  const modeElementGroups = useMemo(() => {
    return getModeElementGroups(layoutMode);
  }, [layoutMode]);

  // Helper functions defined inside component
  const getElementDisplayName = (element) => {
    if (element.text && element.text.trim().length > 0) {
      return element.text.length > 30 
        ? element.text.substring(0, 30) + '...' 
        : element.text;
    }
    
    if (element.name && element.name.trim().length > 0) {
      return element.name;
    }
    
    return getElementTypeName(element.type) || `${element.type.charAt(0).toUpperCase() + element.type.slice(1)}`;
  };

  const getElementCategoryColor = (element) => {
    const category = getElementCategory(element.type);
    
    switch (category) {
      case 'text':
        return '#3b82f6';
      case 'shape':
        return '#10b981';
      case 'drawing':
        return '#8b5cf6';
      case 'media':
        return '#ef4444';
      case 'data':
        return '#f59e0b';
      case 'special':
        return '#06b6d4';
      case 'ui':
        return '#ec4899';
      case 'presentation':
        return '#8b5cf6';
      case 'document':
        return '#0ea5e9';
      case 'photoshop':
        return '#a855f7';
      case 'excel':
        return '#059669';
      case 'word':
        return '#2563eb';
      case 'web':
        return '#f97316';
      default:
        return '#64748b';
    }
  };

  const getLayerElementCategories = (layerId) => {
    const elements = getLayerElements(layerId);
    const categories = {};
    
    elements.forEach(element => {
      const category = getElementCategory(element.type);
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  };

  const getLayoutStyles = () => {
    switch (layoutMode) {
      case 'photoshop':
        return {
          bgColor: '#1f2937',
          borderColor: '#4b5563',
          textColor: 'white',
          primaryColor: '#8b5cf6',
          hoverBg: 'rgba(255, 255, 255, 0.05)',
          headerBg: '#111827',
          selectedBg: 'rgba(139, 92, 246, 0.2)',
          chipBg: '#374151',
          chipColor: '#a78bfa',
          tabBg: '#374151',
          tabActive: '#8b5cf6'
        };
      case 'word':
        return {
          bgColor: '#ffffff',
          borderColor: '#d1d5db',
          textColor: '#111827',
          primaryColor: '#2563eb',
          hoverBg: 'rgba(59, 130, 246, 0.05)',
          headerBg: '#f3f4f6',
          selectedBg: 'rgba(59, 130, 246, 0.1)',
          chipBg: '#f1f5f9',
          chipColor: '#64748b',
          tabBg: '#f8fafc',
          tabActive: '#2563eb'
        };
      case 'powerpoint':
        return {
          bgColor: '#ffffff',
          borderColor: '#e5e7eb',
          textColor: '#374151',
          primaryColor: '#dc2626',
          hoverBg: 'rgba(239, 68, 68, 0.05)',
          headerBg: '#fef2f2',
          selectedBg: 'rgba(239, 68, 68, 0.1)',
          chipBg: '#f5f5f5',
          chipColor: '#ef4444',
          tabBg: '#fef2f2',
          tabActive: '#dc2626'
        };
      case 'excel':
        return {
          bgColor: '#ffffff',
          borderColor: '#e5e7eb',
          textColor: '#374151',
          primaryColor: '#059669',
          hoverBg: 'rgba(5, 150, 105, 0.05)',
          headerBg: '#f0fdf4',
          selectedBg: 'rgba(5, 150, 105, 0.1)',
          chipBg: '#f0fdf4',
          chipColor: '#059669',
          tabBg: '#f0fdf4',
          tabActive: '#059669'
        };
      default:
        return {
          bgColor: '#ffffff',
          borderColor: '#d1d5db',
          textColor: '#111827',
          primaryColor: '#2563eb',
          hoverBg: 'rgba(59, 130, 246, 0.05)',
          headerBg: '#f3f4f6',
          selectedBg: 'rgba(59, 130, 246, 0.1)',
          chipBg: '#f1f5f9',
          chipColor: '#64748b',
          tabBg: '#f8fafc',
          tabActive: '#2563eb'
        };
    }
  };

  const layoutStyles = getLayoutStyles();
  const isDarkMode = layoutMode === 'photoshop';

  // Render layer actions
  const renderLayerActions = (layer) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={expandedLayers.includes(layer.id) ? "Collapse" : "Expand"} arrow>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              toggleLayer(layer.id);
            }}
            sx={{ color: isDarkMode ? 'white' : 'inherit' }}
          >
            {expandedLayers.includes(layer.id) ? 
              <ExpandLess fontSize="small" /> : 
              <ExpandMore fontSize="small" />
            }
          </IconButton>
        </Tooltip>

        {allowLayerOperations && (
          <>
            <Tooltip title={layer.locked ? "Unlock Layer" : "Lock Layer"} arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerUpdate?.(layer.id, { locked: !layer.locked });
                }}
                sx={{ 
                  color: isDarkMode ? (layer.locked ? layoutStyles.primaryColor : '#9ca3af') : 'inherit'
                }}
              >
                {layer.locked ? 
                  <Lock fontSize="small" /> : 
                  <LockOpen fontSize="small" />
                }
              </IconButton>
            </Tooltip>

            {layer.id !== 'layer-1' && (
              <Tooltip title="Delete Layer" arrow>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerDelete?.(layer.id);
                  }}
                  sx={{ color: isDarkMode ? '#ef4444' : 'error.main' }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>
    );
  };

  // Context Menu Handlers
  const handleElementContextMenu = (element, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      open: true,
      x: event.clientX,
      y: event.clientY,
      elementId: element.id,
      element: element
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ open: false, x: 0, y: 0, elementId: null, element: null });
  };

  const handleContextMenuAction = (action) => {
    if (!contextMenu.elementId || !contextMenu.element) return;
    
    const element = contextMenu.element;
    
    switch (action) {
      case 'rename':
        setRenameValue(getElementDisplayName(element));
        setRenameDialogOpen(true);
        break;
        
      case 'duplicate':
        if (onElementDuplicate) {
          onElementDuplicate(contextMenu.elementId);
          showSnackbar('Element duplicated', 'success');
        }
        break;
        
      case 'delete':
        if (onElementDelete) {
          onElementDelete(contextMenu.elementId);
          showSnackbar('Element deleted', 'info');
        }
        break;
        
      case 'moveToLayer':
        setSelectedTargetLayer(element.layerId || '');
        setMoveDialogOpen(true);
        break;
        
      case 'toggleLock':
        if (onElementUpdate) {
          const updatedElement = {
            ...element,
            locked: !element.locked
          };
          onElementUpdate(contextMenu.elementId, updatedElement);
          showSnackbar(`Element ${element.locked ? 'unlocked' : 'locked'}`, 'success');
        }
        break;
        
      case 'properties':
        // Select the element first
        if (onElementSelect) {
          onElementSelect(contextMenu.elementId);
        }
        showSnackbar('Element selected for editing', 'info');
        break;
        
      case 'bringForward':
        if (onElementUpdate && element.zIndex !== undefined) {
          onElementUpdate(contextMenu.elementId, { zIndex: (element.zIndex || 0) + 1 });
          showSnackbar('Element brought forward', 'success');
        }
        break;
        
      case 'sendBackward':
        if (onElementUpdate && element.zIndex !== undefined) {
          onElementUpdate(contextMenu.elementId, { zIndex: Math.max(0, (element.zIndex || 0) - 1) });
          showSnackbar('Element sent backward', 'success');
        }
        break;
        
      default:
        break;
    }
    
    handleCloseContextMenu();
  };

  const handleRenameSubmit = () => {
    if (onElementUpdate && contextMenu.elementId && renameValue.trim()) {
      onElementUpdate(contextMenu.elementId, { name: renameValue.trim() });
      showSnackbar('Element renamed', 'success');
    }
    setRenameDialogOpen(false);
    setRenameValue('');
  };

  const handleMoveSubmit = () => {
    if (onElementUpdate && contextMenu.elementId && selectedTargetLayer) {
      onElementUpdate(contextMenu.elementId, { layerId: selectedTargetLayer });
      showSnackbar('Element moved to different layer', 'success');
    }
    setMoveDialogOpen(false);
    setSelectedTargetLayer('');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <>
      <Paper 
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: layoutStyles.borderColor,
          backgroundColor: layoutStyles.bgColor,
          color: layoutStyles.textColor,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with Mode Indicator */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: layoutStyles.borderColor,
          backgroundColor: layoutStyles.headerBg
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: layoutStyles.textColor
              }}
            >
              <Layers fontSize="small" />
              Layers ({layers.length})
              <Badge 
                badgeContent={selectedElements.length} 
                color="primary" 
                sx={{ ml: 1 }}
              />
            </Typography>
            
            {/* Mode Indicator */}
            <Chip
              label={layoutMode.toUpperCase()}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: layoutStyles.primaryColor,
                color: 'white',
                textTransform: 'uppercase',
                fontSize: '0.7rem'
              }}
            />
          </Box>
          
          {allowLayerOperations && (
            <Tooltip title="Add New Layer" arrow>
              <IconButton 
                size="small" 
                onClick={onLayerCreate}
                sx={{ 
                  color: layoutStyles.primaryColor,
                  backgroundColor: `${layoutStyles.primaryColor}15`,
                  '&:hover': {
                    backgroundColor: `${layoutStyles.primaryColor}25`
                  }
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Mode-Specific Element Groups Tabs */}
        <Box sx={{ 
          borderBottom: '1px solid', 
          borderColor: layoutStyles.borderColor,
          backgroundColor: layoutStyles.tabBg
        }}>
        <Tabs 
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'none'
            },
            '& .Mui-selected': {
              color: layoutStyles.tabActive + ' !important'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: layoutStyles.tabActive
            }
          }}
        >
          {modeElementGroups.map((group, index) => (
            <Tab 
              key={group.name}
              value={index} // Add this!
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {group.icon}
                  <span>{group.name}</span>
                  <Chip 
                    label={group.elements.length}
                    size="small"
                    sx={{ 
                      height: 18,
                      fontSize: '0.6rem',
                      backgroundColor: isDarkMode ? '#4b5563' : '#e5e7eb'
                    }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
        </Box>

        {/* Current Group Elements */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          maxHeight: 300,
          p: 2,
          borderBottom: '1px solid',
          borderColor: layoutStyles.borderColor
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 2, 
              color: layoutStyles.textColor,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {modeElementGroups[activeTab]?.icon}
            {modeElementGroups[activeTab]?.name} Elements
          </Typography>
          
          <Stack spacing={1}>
            {modeElementGroups[activeTab]?.elements.map((elementType) => {
              const elementName = getElementTypeName(elementType);
              const elementIcon = getElementIconMUI(elementType);
              const categoryColor = getElementCategory({ type: elementType });
              const description = getElementDescription(elementType);
              
              return (
                <Tooltip key={elementType} title={description} arrow placement="right">
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer',
                      backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                      border: '1px solid',
                      borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: layoutStyles.hoverBg,
                        transform: 'translateX(2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                    onClick={() => {
                      // This would create a new element of this type
                      // You'll need to implement element creation logic
                      console.log(`Create ${elementType} element`);
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: `${categoryColor}20`,
                        color: categoryColor
                      }}
                    >
                      {elementIcon}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {elementName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {description}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={getElementCategory(elementType)}
                      size="small"
                      sx={{
                        backgroundColor: `${categoryColor}20`,
                        color: categoryColor,
                        fontWeight: 500,
                        fontSize: '0.6rem'
                      }}
                    />
                  </Paper>
                </Tooltip>
              );
            })}
          </Stack>
        </Box>

        {/* Layers List */}
        <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
          <List sx={{ p: 0 }}>
            {layers.map((layer, index) => {
              const layerElements = getLayerElements(layer.id);
              const elementCategories = getLayerElementCategories(layer.id);
              const isSelected = selectedLayerId === layer.id;
              const elementCount = layerElements.length;

              return (
                <React.Fragment key={layer.id}>
                  <ListItem
                    sx={{
                      backgroundColor: isSelected ? layoutStyles.selectedBg : 'transparent',
                      borderLeft: isSelected ? `3px solid ${layoutStyles.primaryColor}` : 'none',
                      py: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: layoutStyles.hoverBg
                      }
                    }}
                    onClick={() => onLayerSelect?.(layer.id)}
                    secondaryAction={renderLayerActions(layer)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Tooltip title={layer.visible ? "Hide Layer" : "Show Layer"} arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLayerUpdate?.(layer.id, { visible: !layer.visible });
                          }}
                          sx={{ 
                            color: isDarkMode ? (layer.visible ? layoutStyles.primaryColor : '#9ca3af') : 'inherit'
                          }}
                        >
                          {layer.visible ? 
                            <Visibility fontSize="small" /> : 
                            <VisibilityOff fontSize="small" />
                          }
                        </IconButton>
                      </Tooltip>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              color: layoutStyles.textColor
                            }}
                          >
                            {layer.name || `Layer ${index + 1}`}
                          </Typography>
                          {showElementCount && elementCount > 0 && (
                            <Chip
                              label={elementCount}
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                backgroundColor: layoutStyles.primaryColor,
                                color: 'white'
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography 
                          component="div"
                          variant="body2" 
                          color="textSecondary"
                        >
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {Object.entries(elementCategories).map(([category, count]) => (
                              <Chip
                                key={category}
                                label={`${category}: ${count}`}
                                size="small"
                                sx={{ 
                                  height: 18, 
                                  fontSize: '0.65rem',
                                  backgroundColor: layoutStyles.chipBg,
                                  color: layoutStyles.chipColor
                                }}
                              />
                            ))}
                            
                            <Chip
                              label={`${Math.round(layer.opacity * 100)}%`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                height: 18, 
                                fontSize: '0.65rem',
                                color: layoutStyles.chipColor,
                                borderColor: layoutStyles.borderColor
                              }}
                            />
                            
                            {layer.blendMode && layer.blendMode !== 'normal' && (
                              <Chip
                                label={layer.blendMode}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  height: 18, 
                                  fontSize: '0.65rem',
                                  color: layoutStyles.chipColor,
                                  borderColor: layoutStyles.borderColor
                                }}
                              />
                            )}
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItem>

                  {/* Layer Elements */}
                  <Collapse 
                    in={expandedLayers.includes(layer.id) && layerElements.length > 0} 
                    timeout="auto" 
                    unmountOnExit
                  >
                    <List sx={{ pl: 4, py: 0 }}>
                      {layerElements.map((element) => {
                        const isElementSelected = selectedElements.some(el => el.id === element.id);
                        const categoryColor = getElementCategoryColor(element);
                        
                        return (
                          <ListItem
                            key={element.id}
                            sx={{
                              py: 0.5,
                              cursor: 'pointer',
                              backgroundColor: isElementSelected ? 
                                (isDarkMode ? `${layoutStyles.primaryColor}30` : 'action.selected') : 
                                'transparent',
                              '&:hover': {
                                backgroundColor: layoutStyles.hoverBg
                              },
                              borderLeft: `3px solid ${categoryColor}`,
                              position: 'relative'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onElementSelect?.(element.id);
                            }}
                            onContextMenu={(e) => handleElementContextMenu(element, e)}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {getElementIconMUI(element.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 400,
                                      color: layoutStyles.textColor,
                                      maxWidth: 150,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {getElementDisplayName(element)}
                                  </Typography>
                                  <Chip
                                    label={getElementTypeName(element.type)}
                                    size="small"
                                    sx={{ 
                                      height: 18,
                                      fontSize: '0.6rem',
                                      backgroundColor: `${categoryColor}20`,
                                      color: categoryColor,
                                      fontWeight: 600
                                    }}
                                  />
                                  {element.locked && (
                                    <Lock sx={{ fontSize: 12, color: '#ef4444' }} />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Typography 
                                  component="div"
                                  variant="caption" 
                                  sx={{ 
                                    color: isDarkMode ? '#a78bfa' : 'text.secondary'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>ID: {element.id.substring(0, 6)}</span>
                                    {element.width && element.height && (
                                      <span>{element.width}×{element.height}</span>
                                    )}
                                  </Box>
                                </Typography>
                              }
                            />
                            {isElementSelected && (
                              <Box sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%',
                                backgroundColor: categoryColor,
                                ml: 1
                              }} />
                            )}
                            {/* Quick action button */}
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                right: 4,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '&:hover': { opacity: 1 },
                                color: isDarkMode ? '#9ca3af' : '#64748b'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleElementContextMenu(element, e);
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>

                  <Divider sx={{ borderColor: layoutStyles.borderColor }} />
                </React.Fragment>
              );
            })}
          </List>
        </Box>

        {/* Summary Stats */}
        {layers.length > 0 && (
          <Box sx={{ 
            p: 1.5, 
            borderTop: '1px solid', 
            borderColor: layoutStyles.borderColor,
            backgroundColor: layoutStyles.headerBg
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isDarkMode ? '#9ca3af' : 'text.secondary',
                display: 'block',
                textAlign: 'center'
              }}
            >
              Total: {selectedElements.length} elements across {layers.length} layers
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Context Menu for Elements (keep existing) */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu.open
            ? { top: contextMenu.y, left: contextMenu.x }
            : undefined
        }
        open={contextMenu.open}
        onClose={handleCloseContextMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            minWidth: 220,
            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
            overflow: 'visible',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
              transform: 'translateY(-50%) rotate(45deg)',
              borderLeft: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
              borderTop: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleContextMenuAction('properties')}
          sx={{ 
            color: isDarkMode ? '#f3f4f6' : '#1e293b',
            '&:hover': {
              backgroundColor: isDarkMode ? '#4b5563' : '#f1f5f9'
            }
          }}
        >
          <MuiListItemIcon>
            <Edit fontSize="small" sx={{ color: isDarkMode ? '#9ca3af' : '#64748b' }} />
          </MuiListItemIcon>
          <ListItemText>Edit Properties</ListItemText>
        </MenuItem>
        
        {/* ... rest of context menu items (keep as is) ... */}
        
      </Menu>

      {/* Rename Dialog (keep existing) */}
      <Dialog 
        open={renameDialogOpen} 
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
          }
        }}
      >
        <DialogTitle sx={{ 
          color: isDarkMode ? '#f3f4f6' : '#1e293b',
          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
          borderBottom: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
        }}>
          Rename Element
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            label="Element Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit()}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDarkMode ? '#4b5563' : '#ffffff'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          p: 2,
          borderTop: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
        }}>
          <Button 
            onClick={() => setRenameDialogOpen(false)}
            sx={{ color: isDarkMode ? '#9ca3af' : '#64748b' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRenameSubmit}
            variant="contained"
            disabled={!renameValue.trim()}
            sx={{ 
              backgroundColor: layoutStyles.primaryColor,
              '&:hover': {
                backgroundColor: layoutStyles.primaryColor
              }
            }}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move to Layer Dialog (keep existing) */}
      <Dialog 
        open={moveDialogOpen} 
        onClose={() => setMoveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
          }
        }}
      >
        <DialogTitle sx={{ 
          color: isDarkMode ? '#f3f4f6' : '#1e293b',
          backgroundColor: isDarkMode ? '#374151' : '#ffffff',
          borderBottom: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
        }}>
          Move Element to Layer
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: isDarkMode ? '#9ca3af' : '#64748b' }}>
              Select Layer
            </InputLabel>
            <Select
              value={selectedTargetLayer}
              onChange={(e) => setSelectedTargetLayer(e.target.value)}
              label="Select Layer"
              sx={{
                backgroundColor: isDarkMode ? '#4b5563' : '#ffffff',
                color: isDarkMode ? '#f3f4f6' : '#1e293b'
              }}
            >
              {layers.map((layer) => (
                <MenuItem 
                  key={layer.id} 
                  value={layer.id}
                  sx={{ color: isDarkMode ? '#f3f4f6' : '#1e293b' }}
                >
                  {layer.name || `Layer ${layers.indexOf(layer) + 1}`}
                  {layer.id === contextMenu.element?.layerId && ' (current)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2,
          borderTop: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
        }}>
          <Button 
            onClick={() => setMoveDialogOpen(false)}
            sx={{ color: isDarkMode ? '#9ca3af' : '#64748b' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMoveSubmit}
            variant="contained"
            disabled={!selectedTargetLayer || selectedTargetLayer === contextMenu.element?.layerId}
            sx={{ 
              backgroundColor: layoutStyles.primaryColor,
              '&:hover': {
                backgroundColor: layoutStyles.primaryColor
              }
            }}
          >
            Move
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications (keep existing) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ 
            width: '100%',
            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
            color: isDarkMode ? '#f3f4f6' : '#1e293b',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LayerPanel;