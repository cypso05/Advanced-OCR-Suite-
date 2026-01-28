// src/app/features/ocr/hooks/useCanvasEditor.js
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { throttle, debounce } from 'lodash';

// Import all utilities
import { LAYOUT_MODES, getDefaultLayoutConfig } from '../utils/layoutModes';
import { 
  calculateElementBounds, 
  getElementCenter, 
  calculateGroupBounds,
  isPointInPolygon,
  snapToGrid as snapToGridUtil,
  getDistance,
  getAngle,
  applyLayoutConstraints
} from '../utils/canvasUtils';

import { parseKeyboardEvent, getShortcutAction } from '../utils/keyboardShortcuts';
import { ELEMENT_TYPES, createElementFactory, getElementDefaults } from '../utils/elementTypes';

// ========== PERFORMANCE OPTIMIZATIONS ==========
const BATCH_UPDATE_DELAY = 16; // ~60fps
const HISTORY_LIMIT = 100;
const CANVAS_DEBOUNCE = 100;

// ========== DEFAULT PAGE CREATION ==========
const createDefaultPage = (overrides = {}) => {
  return {
    id: uuidv4(),
    name: 'Page 1',
    activeLayout: 'word',
    layoutConfig: getDefaultLayoutConfig('word'),
    elements: [],
    layers: [
      { id: 'layer-1', name: 'Background', visible: true, locked: false, opacity: 1, elements: [] },
      { id: 'layer-2', name: 'Main Content', visible: true, locked: false, opacity: 1, elements: [] }
    ],
    viewport: { x: 0, y: 0, width: 800, height: 600 },
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotation: 0,
    grid: getDefaultLayoutConfig('word').grid,
    guides: getDefaultLayoutConfig('word').guides,
    rulers: { show: true, unit: 'pt' },
    snap: { enabled: true, toGrid: true, toGuides: true, toObjects: true },
    history: [],
    historyIndex: -1,
    background: { type: 'solid', color: '#ffffff' },
    metadata: {
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      modeSpecific: {}
    },
    ...overrides
  };
};

export const useCanvasEditor = (initialState = {}) => {
  // ========== CORE STATE WITH MULTI-PAGE SUPPORT ==========
  const [state, setState] = useState(() => {
    const defaultPage = createDefaultPage();
    
    // Ensure we have at least one page
    const initialPages = initialState.pages && initialState.pages.length > 0 
      ? initialState.pages 
      : [defaultPage];
    
    // Ensure activePageId exists in pages
    let activePageId = initialState.activePageId;
    if (!activePageId || !initialPages.some(p => p.id === activePageId)) {
      activePageId = initialPages[0].id;
    }

    return {
      // Multi-page support
      pages: initialPages,
      activePageId: activePageId,
      
      // Global state (shared across pages)
      activeTool: initialState.activeTool || 'select',
      toolProperties: {
        select: { mode: 'rectangle', tolerance: 5 },
        text: { 
          fontSize: 12, 
          fontFamily: 'Arial, sans-serif', 
          fill: '#000000', 
          align: 'left',
          bold: false,
          italic: false,
          underline: false,
          lineHeight: 1.5,
          letterSpacing: 0,
          textTransform: 'none'
        },
        shape: { 
          fill: '#3498db', 
          stroke: '#2980b9', 
          strokeWidth: 2,
          cornerRadius: 0,
          shadow: { enabled: false, blur: 5, offsetX: 2, offsetY: 2, color: 'rgba(0,0,0,0.3)' },
          gradient: null
        },
        brush: { 
          stroke: '#000000', 
          strokeWidth: 3,
          opacity: 1,
          smoothing: 0.5,
          pressureSensitive: false,
          brushType: 'round',
          texture: null
        },
        eraser: { 
          size: 20,
          opacity: 1,
          mode: 'pixel',
          shape: 'round'
        },
        pen: {
          stroke: '#000000',
          strokeWidth: 2,
          tension: 0.5,
          closed: false,
          arrowheads: { start: false, end: false }
        },
        table: {
          rows: 3,
          columns: 3,
          cellPadding: 5,
          borderWidth: 1,
          borderColor: '#cccccc',
          headerRow: true,
          alternatingColors: false
        },
        gradient: {
          type: 'linear',
          stops: [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#000000' }
          ],
          angle: 0,
          spread: 'pad'
        },
        image: {
          filter: 'none',
          opacity: 1,
          blendMode: 'normal',
          crop: null
        },
        ...initialState.toolProperties
      },
      
      // Selection & Focus (per-page)
      selectedIds: initialState.selectedIds || [],
      focusedElementId: initialState.focusedElementId || null,
      hoveredElementId: initialState.hoveredElementId || null,
      
      // Text Editing
      editingTextId: initialState.editingTextId || null,
      editingTextValue: initialState.editingTextValue || '',
      textEditorPosition: initialState.textEditorPosition || null,
      
      // Transform Operations
      transform: initialState.transform || { 
        scaleX: 1, 
        scaleY: 1, 
        rotation: 0,
        skewX: 0,
        skewY: 0 
      },
      transformOrigin: initialState.transformOrigin || { x: 0.5, y: 0.5 },
      
      // Performance & Rendering
      renderQuality: initialState.renderQuality || 'high',
      useGPUAcceleration: initialState.useGPUAcceleration !== false,
      batchUpdates: initialState.batchUpdates !== false,
      
      // User Preferences
      preferences: {
        showTooltips: true,
        quickAccessToolbar: ['select', 'text', 'shape', 'brush'],
        theme: 'light',
        keyboardShortcuts: {},
        defaultUnits: 'px',
        snapStrength: 10,
        ...initialState.preferences
      },
      
      // Session state
      clipboard: initialState.clipboard || [],
      temporaryElements: initialState.temporaryElements || [],
      lastAction: initialState.lastAction || null,
      version: '1.0.0'
    };
  });

  // ========== PERFORMANCE REFS ==========
  const stageRef = useRef(null);
  const rendererRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const tempElementRef = useRef(null);
  const selectionRectRef = useRef(null);
  const animationFrameRef = useRef(null);
  const batchUpdatesRef = useRef([]);
  const elementCacheRef = useRef(new Map());
  const pageCacheRef = useRef(new Map());

  // ========== ACTIVE PAGE HELPERS ==========
  const getActivePage = useCallback(() => {
    const page = state.pages.find(page => page.id === state.activePageId);
    if (!page && state.pages.length > 0) {
      // Fallback to first page if active page not found
      return state.pages[0];
    }
    return page;
  }, [state.pages, state.activePageId]);

  // ✅ FIXED: Safe updateActivePage function
  const updateActivePage = useCallback((updater) => {
    setState(prev => {
      const updatedPages = prev.pages.map(page => {
        if (page.id === prev.activePageId) {
          return typeof updater === 'function' 
            ? { ...page, ...updater(page) }
            : { ...page, ...updater };
        }
        return page;
      });
      
      return {
        ...prev,
        pages: updatedPages,
        lastAction: 'page-update'
      };
    });
  }, []);

  // ========== PAGE MANAGEMENT ==========
  const createPage = useCallback((options = {}) => {
    const newPage = createDefaultPage({
      name: options.name || `Page ${state.pages.length + 1}`,
      activeLayout: options.layout || 'word',
      elements: options.elements || [],
      background: options.background || { type: 'solid', color: '#ffffff' }
    });

    setState(prev => ({
      ...prev,
      pages: [...prev.pages, newPage],
      activePageId: newPage.id,
      selectedIds: [],
      editingTextId: null,
      lastAction: 'create-page'
    }));

    return newPage;
  }, [state.pages.length]);

  const deletePage = useCallback((pageId) => {
    if (state.pages.length <= 1) {
      console.warn('Cannot delete the only remaining page');
      return;
    }
    
    setState(prev => {
      const filteredPages = prev.pages.filter(page => page.id !== pageId);
      const newActivePageId = prev.activePageId === pageId 
        ? (filteredPages[0]?.id || null)
        : prev.activePageId;
      
      return {
        ...prev,
        pages: filteredPages,
        activePageId: newActivePageId,
        selectedIds: [],
        editingTextId: null,
        lastAction: 'delete-page'
      };
    });
  }, [state.pages.length, state.activePageId]);

  const duplicatePage = useCallback((pageId) => {
    const sourcePage = state.pages.find(page => page.id === pageId);
    if (!sourcePage) {
      console.warn(`Page with id ${pageId} not found`);
      return null;
    }

    const duplicatedPage = {
      ...sourcePage,
      id: uuidv4(),
      name: `${sourcePage.name} (Copy)`,
      elements: sourcePage.elements.map(el => ({
        ...el,
        id: uuidv4(),
        x: (el.x || 0) + 20,
        y: (el.y || 0) + 20
      })),
      metadata: {
        ...sourcePage.metadata,
        duplicatedFrom: pageId,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      }
    };

    setState(prev => ({
      ...prev,
      pages: [...prev.pages, duplicatedPage],
      activePageId: duplicatedPage.id,
      selectedIds: [],
      editingTextId: null,
      lastAction: 'duplicate-page'
    }));

    return duplicatedPage;
  }, [state.pages]);

  const switchPage = useCallback((pageId) => {
    const targetPage = state.pages.find(page => page.id === pageId);
    if (!targetPage) {
      console.warn(`Page with id ${pageId} not found`);
      return;
    }

    setState(prev => ({
      ...prev,
      activePageId: pageId,
      selectedIds: [],
      editingTextId: null,
      lastAction: 'switch-page'
    }));
  }, [state.pages]);

  const reorderPages = useCallback((fromIndex, toIndex) => {
    setState(prev => {
      const newPages = [...prev.pages];
      const [removed] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, removed);
      
      return {
        ...prev,
        pages: newPages,
        lastAction: 'reorder-pages'
      };
    });
  }, []);

  // ========== LAYOUT MODE MANAGEMENT ==========
  const switchLayoutMode = useCallback((modeId) => {
    const modeConfig = LAYOUT_MODES[modeId];
    if (!modeConfig) {
      console.warn(`Layout mode ${modeId} not found`);
      return;
    }

    updateActivePage(page => {
      if (!page) return page;

      const updates = {
        activeLayout: modeId,
        layoutConfig: modeConfig,
        grid: modeConfig.grid,
        guides: modeConfig.guides,
        viewport: { ...page.viewport, ...modeConfig.viewport },
        metadata: {
          ...page.metadata,
          modeSpecific: {
            ...page.metadata.modeSpecific,
            [modeId]: {
              lastUsed: Date.now(),
              zoom: page.zoom,
              pan: page.pan
            }
          }
        }
      };

      // Apply mode-specific element transformations
      let updatedElements = page.elements || [];
      switch (modeId) {
        case 'word':
          // Word mode: enhance text elements
          updatedElements = updatedElements.map(el => ({
            ...el,
            locked: el.type !== 'text' && el.type !== 'table',
            style: el.type === 'text' ? {
              ...el.style,
              fontFamily: el.style?.fontFamily || 'Georgia, serif',
              lineHeight: 1.6
            } : el.style
          }));
          break;
          
        case 'powerpoint':
          // PowerPoint mode: enhance shapes and alignment
          updatedElements = updatedElements.map(el => ({
            ...el,
            shadow: el.type === 'shape' ? {
              enabled: true,
              blur: 10,
              offsetX: 3,
              offsetY: 3,
              color: 'rgba(0,0,0,0.2)'
            } : el.shadow,
            style: el.type === 'text' ? {
              ...el.style,
              fontFamily: el.style?.fontFamily || 'Arial, sans-serif',
              fontSize: Math.max(18, el.style?.fontSize || 12)
            } : el.style
          }));
          break;
          
        case 'photoshop':
          // Photoshop mode: enable layers and filters
          updatedElements = updatedElements.map(el => ({
            ...el,
            filters: el.filters || [],
            blendMode: el.blendMode || 'normal',
            layerId: el.layerId || 'layer-2',
            opacity: el.opacity !== undefined ? el.opacity : 1
          }));
          break;
          
        case 'excel':
          // Excel mode: enhance tables and grids
          updatedElements = updatedElements.map(el => {
            if (el.type === 'table') {
              return {
                ...el,
                style: {
                  ...el.style,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  headerBackground: '#f5f5f5',
                  alternatingColors: true
                }
              };
            }
            return el;
          });
          break;
      }

      return {
        ...page,
        ...updates,
        elements: applyLayoutConstraints(updatedElements, modeConfig) || [],
        selectedIds: [],
        history: [...page.history, {
          id: uuidv4(),
          timestamp: Date.now(),
          description: `Switched to ${modeId} mode`,
          elements: updatedElements,
          selectedIds: []
        }].slice(-HISTORY_LIMIT),
        historyIndex: -1
      };
    });
  }, [updateActivePage]);

  // ========== HISTORY MANAGEMENT ==========
  const saveHistory = useCallback((description) => {
    const activePage = getActivePage();
    if (!activePage) return;

    const snapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      description,
      elements: [...activePage.elements],
      selectedIds: [...state.selectedIds],
      layers: [...activePage.layers],
      viewport: { ...activePage.viewport },
      zoom: activePage.zoom,
      pan: { ...activePage.pan }
    };

    updateActivePage(page => ({
      ...page,
      history: [
        ...page.history.slice(0, page.historyIndex + 1),
        snapshot
      ].slice(-HISTORY_LIMIT),
      historyIndex: page.historyIndex + 1,
      metadata: {
        ...page.metadata,
        modifiedAt: Date.now()
      }
    }));
  }, [getActivePage, state.selectedIds, updateActivePage]);

  const undo = useCallback(() => {
    const activePage = getActivePage();
    if (!activePage || activePage.historyIndex <= 0) return;
    
    const newIndex = activePage.historyIndex - 1;
    const snapshot = activePage.history[newIndex];
    
    if (snapshot) {
      updateActivePage(page => ({
        ...page,
        ...snapshot,
        historyIndex: newIndex
      }));
    }
  }, [getActivePage, updateActivePage]);

  const redo = useCallback(() => {
    const activePage = getActivePage();
    if (!activePage || activePage.historyIndex >= activePage.history.length - 1) return;
    
    const newIndex = activePage.historyIndex + 1;
    const snapshot = activePage.history[newIndex];
    
    if (snapshot) {
      updateActivePage(page => ({
        ...page,
        ...snapshot,
        historyIndex: newIndex
      }));
    }
  }, [getActivePage, updateActivePage]);

  // ========== ELEMENT OPERATIONS ==========
  const createElement = useCallback((type, props) => {
    const activePage = getActivePage();
    if (!activePage) {
      console.error('No active page found');
      return null;
    }
    
    const elementConfig = createElementFactory(
      type, 
      props, 
      state.toolProperties,
      activePage.activeLayout
    );
    
    if (!elementConfig) {
      console.error(`Failed to create element of type: ${type}`);
      return null;
    }
    
    const element = {
      ...elementConfig,
      id: props.id || uuidv4(),
      pageId: activePage.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      layerId: props.layerId || 'layer-2',
      locked: false,
      visible: true,
      metadata: {
        createdBy: 'editor',
        tool: state.activeTool,
        layout: activePage.activeLayout,
        parentId: props.parentId
      }
    };
    
    return element;
  }, [getActivePage, state.toolProperties, state.activeTool]);

  const addElement = useCallback((type, props = {}) => {
    const element = createElement(type, props);
    if (!element) {
      console.error('Failed to create element');
      return null;
    }
    
    updateActivePage(page => ({
      ...page,
      elements: [...page.elements, element],
      metadata: {
        ...page.metadata,
        modifiedAt: Date.now()
      }
    }));
    
    setState(prev => ({
      ...prev,
      selectedIds: [element.id],
      lastAction: `add-${type}`
    }));
    
    saveHistory(`Added ${type} element`);
    
    return element;
  }, [createElement, updateActivePage, saveHistory]);

  const deleteElements = useCallback((ids) => {
    if (!ids || ids.length === 0) return;
    
    updateActivePage(page => ({
      ...page,
      elements: page.elements.filter(el => !ids.includes(el.id))
    }));
    
    setState(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.filter(id => !ids.includes(id)),
      editingTextId: prev.editingTextId && ids.includes(prev.editingTextId) ? null : prev.editingTextId,
      lastAction: 'delete'
    }));
    
    saveHistory(`Deleted ${ids.length} element(s)`);
  }, [updateActivePage, saveHistory]);

  const batchElementUpdates = useCallback((updates) => {
    if (!state.batchUpdates) {
      updateActivePage(page => {
        const elementMap = new Map(page.elements.map(el => [el.id, el]));
        
        updates.forEach(({ id, updates: elementUpdates }) => {
          if (elementMap.has(id)) {
            elementMap.set(id, { 
              ...elementMap.get(id), 
              ...elementUpdates, 
              updatedAt: Date.now() 
            });
          }
        });

        return {
          ...page,
          elements: Array.from(elementMap.values()),
          metadata: {
            ...page.metadata,
            modifiedAt: Date.now()
          }
        };
      });
      return;
    }

    batchUpdatesRef.current.push(...updates);

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        updateActivePage(page => {
          const elementMap = new Map(page.elements.map(el => [el.id, el]));
          
          batchUpdatesRef.current.forEach(({ id, updates: elementUpdates }) => {
            if (elementMap.has(id)) {
              elementMap.set(id, { 
                ...elementMap.get(id), 
                ...elementUpdates, 
                updatedAt: Date.now() 
              });
            }
          });

          batchUpdatesRef.current = [];
          animationFrameRef.current = null;

          return {
            ...page,
            elements: Array.from(elementMap.values()),
            metadata: {
              ...page.metadata,
              modifiedAt: Date.now()
            }
          };
        });
      });
    }
  }, [state.batchUpdates, updateActivePage]);

  // ========== SELECTION & INTERACTION ==========
  const selectElement = useCallback((id, additive = false) => {
    setState(prev => {
      let selectedIds;
      if (additive) {
        selectedIds = prev.selectedIds.includes(id)
          ? prev.selectedIds.filter(selectedId => selectedId !== id)
          : [...prev.selectedIds, id];
      } else {
        selectedIds = [id];
      }
      
      return {
        ...prev,
        selectedIds,
        editingTextId: null,
        lastAction: 'select'
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: [],
      editingTextId: null,
      lastAction: 'clear-selection'
    }));
  }, []);

  const selectAll = useCallback(() => {
    const activePage = getActivePage();
    if (!activePage) return;
    
    setState(prev => ({
      ...prev,
      selectedIds: activePage.elements.map(el => el.id),
      lastAction: 'select-all'
    }));
  }, [getActivePage]);

  // ========== OPTIMIZED MEMOIZED DATA ==========
  const memoizedActivePage = useMemo(() => {
    const page = getActivePage();
    
    // ✅ FIX: Return a safe default if page is not found
    if (!page) {
      console.warn('No active page found, using default');
      return createDefaultPage();
    }
    
    const cacheKey = `${page.id}-${page.metadata?.modifiedAt || Date.now()}`;
    
    if (pageCacheRef.current.has(cacheKey)) {
      return pageCacheRef.current.get(cacheKey);
    }

    // Pre-calculate enhanced elements with bounds
    const enhancedElements = (page.elements || []).map(element => {
      if (!element) return null;
      
      const elementCacheKey = `${element.id}-${element.updatedAt || element.createdAt || Date.now()}`;
      if (elementCacheRef.current.has(elementCacheKey)) {
        return elementCacheRef.current.get(elementCacheKey);
      }

      const enhancedElement = {
        ...element,
        bounds: calculateElementBounds(element),
        center: getElementCenter(element),
        renderKey: elementCacheKey
      };

      elementCacheRef.current.set(elementCacheKey, enhancedElement);
      return enhancedElement;
    }).filter(Boolean);

    const selectedElements = enhancedElements.filter(el => 
      state.selectedIds.includes(el.id)
    );

    const enhancedPage = {
      ...page,
      elements: enhancedElements,
      selectedElements
    };

    pageCacheRef.current.set(cacheKey, enhancedPage);
    return enhancedPage;
  }, [getActivePage, state.selectedIds]);

  // ========== INITIALIZATION ==========
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Keyboard shortcut handler
      if (event.target.tagName?.toLowerCase() === 'input' || 
          event.target.tagName?.toLowerCase() === 'textarea' ||
          event.target.isContentEditable) {
        return;
      }

      const { ctrlKey, metaKey, shiftKey, key } = event;
      const isModifier = ctrlKey || metaKey;

      switch (key) {
        case 'Delete':
        case 'Backspace':
          if (state.selectedIds.length > 0) {
            deleteElements(state.selectedIds);
            event.preventDefault();
          }
          break;
        case 'a':
        case 'A':
          if (isModifier) {
            selectAll();
            event.preventDefault();
          }
          break;
        case 'z':
        case 'Z':
          if (isModifier) {
            if (shiftKey) {
              redo();
            } else {
              undo();
            }
            event.preventDefault();
          }
          break;
        case 'y':
        case 'Y':
          if (isModifier) {
            redo();
            event.preventDefault();
          }
          break;
        case 'Escape':
          clearSelection();
          break;
        case 'Tab':
          if (isModifier) {
            event.preventDefault();
            const currentIndex = state.pages.findIndex(p => p.id === state.activePageId);
            if (currentIndex !== -1) {
              const nextIndex = (currentIndex + 1) % state.pages.length;
              switchPage(state.pages[nextIndex].id);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.selectedIds, state.pages, state.activePageId, deleteElements, selectAll, undo, redo, clearSelection, switchPage]);

  // ========== FINAL API ==========
  const api = useMemo(() => {
    const activePage = memoizedActivePage;
    
    return {
      // State access
      state,
      activePage,
      pages: state.pages,
      
      // Page management
      createPage,
      deletePage,
      duplicatePage,
      switchPage,
      reorderPages,
      updatePage: updateActivePage,
      
      // Layout modes
      layoutModes: LAYOUT_MODES,
      switchLayoutMode,
      getCurrentLayout: () => LAYOUT_MODES[activePage?.activeLayout] || LAYOUT_MODES.word,
      
      // Element operations
      createElement,
      addElement,
      updateElement: batchElementUpdates,
      deleteElements,
      duplicateElements: (ids) => {
        if (!activePage) return;
        
        const duplicates = ids.map(id => {
          const original = activePage.elements.find(el => el.id === id);
          if (!original) return null;
          return {
            ...original,
            id: uuidv4(),
            x: (original.x || 0) + 20,
            y: (original.y || 0) + 20,
            name: `${original.name || original.type} Copy`
          };
        }).filter(Boolean);

        if (duplicates.length > 0) {
          updateActivePage(page => ({
            ...page,
            elements: [...page.elements, ...duplicates]
          }));
          
          setState(prev => ({
            ...prev,
            selectedIds: duplicates.map(d => d.id)
          }));
        }
      },
      
      // Selection
      selectElement,
      clearSelection,
      selectAll,
      getSelectedElements: () => activePage?.selectedElements || [],
      getSelectionBounds: () => {
        const selected = activePage?.selectedElements || [];
        return selected.length > 0 ? calculateGroupBounds(selected) : null;
      },
      
      // Grouping & alignment
      groupElements: (ids) => {
        if (!activePage || ids.length < 2) return;
        
        const selectedElements = activePage.elements.filter(el => ids.includes(el.id));
        const bounds = calculateGroupBounds(selectedElements);
        
        const group = {
          id: uuidv4(),
          type: 'group',
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          children: ids,
          name: `Group-${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          locked: false,
          visible: true,
          pageId: activePage.id,
          layerId: 'layer-2'
        };
        
        updateActivePage(page => ({
          ...page,
          elements: [
            ...page.elements.filter(el => !ids.includes(el.id)),
            group
          ]
        }));
        
        setState(prev => ({
          ...prev,
          selectedIds: [group.id],
          lastAction: 'group'
        }));
      },
      
      // History
      undo,
      redo,
      canUndo: activePage?.historyIndex > 0 || false,
      canRedo: activePage?.historyIndex < (activePage?.history?.length || 0) - 1 || false,
      
      // Tools
      setActiveTool: (tool) => {
        setState(prev => ({
          ...prev,
          activeTool: tool,
          lastAction: `switch-tool-${tool}`
        }));
      },
      updateToolProperty: (tool, property, value) => {
        setState(prev => ({
          ...prev,
          toolProperties: {
            ...prev.toolProperties,
            [tool]: {
              ...prev.toolProperties[tool],
              [property]: value
            }
          }
        }));
      },
      getActiveToolConfig: () => state.toolProperties[state.activeTool],
      
      // Text editing
      startTextEditing: (elementId, position) => {
        const element = activePage?.elements.find(el => el.id === elementId);
        if (!element || element.type !== 'text') return;

        setState(prev => ({
          ...prev,
          editingTextId: elementId,
          editingTextValue: element.text || '',
          textEditorPosition: position || { x: element.x, y: element.y },
          activeTool: 'text',
          lastAction: 'start-text-edit'
        }));
      },
      updateTextEdit: (value) => {
        setState(prev => ({
          ...prev,
          editingTextValue: value
        }));
      },
      saveTextEdit: () => {
        if (!state.editingTextId) return;

        batchElementUpdates([{
          id: state.editingTextId,
          updates: {
            text: state.editingTextValue,
            updatedAt: Date.now()
          }
        }]);

        setState(prev => ({
          ...prev,
          editingTextId: null,
          editingTextValue: '',
          lastAction: 'save-text-edit'
        }));
      },
      cancelTextEdit: () => {
        setState(prev => ({
          ...prev,
          editingTextId: null,
          editingTextValue: ''
        }));
      },
      
      // Canvas operations
      zoomToFit: () => {
        if (!activePage) return;
        
        const bounds = calculateGroupBounds(activePage.elements);
        if (bounds.width === 0 || bounds.height === 0) return;

        const scaleX = activePage.viewport.width / (bounds.width + 100);
        const scaleY = activePage.viewport.height / (bounds.height + 100);
        const zoom = Math.min(scaleX, scaleY, 1);

        updateActivePage({
          zoom,
          pan: {
            x: -bounds.x * zoom + (activePage.viewport.width - bounds.width * zoom) / 2,
            y: -bounds.y * zoom + (activePage.viewport.height - bounds.height * zoom) / 2
          }
        });
      },
      resetView: () => {
        updateActivePage({
          zoom: 1,
          pan: { x: 0, y: 0 },
          rotation: 0
        });
      },
      setCanvasSize: (width, height) => {
        updateActivePage({
          viewport: { width, height },
          layoutConfig: {
            ...activePage?.layoutConfig,
            canvasSize: { width, height }
          }
        });
      },
      
      // Layers
      createLayer: (name = 'New Layer') => {
        updateActivePage(page => ({
          ...page,
          layers: [...page.layers, {
            id: uuidv4(),
            name,
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: 'normal',
            elements: [],
            createdAt: Date.now()
          }]
        }));
      },
      getLayers: () => activePage?.layers || [],
      
      // Utilities
      snapToGrid: (position) => {
        if (!activePage?.grid?.enabled || !activePage.grid.snap) return position;
        return snapToGridUtil(position, activePage.grid.size, true);
      },
      
      // Refs
      stageRef,
      rendererRef,
      
      // Export state
      exportPageState: (pageId = state.activePageId) => {
        const page = state.pages.find(p => p.id === pageId);
        if (!page) return null;
        
        return {
          pageId: page.id,
          name: page.name,
          layout: page.activeLayout,
          elements: page.elements,
          layers: page.layers,
          viewport: page.viewport,
          background: page.background,
          metadata: page.metadata,
          grid: page.grid,
          guides: page.guides
        };
      },
      
      // Import state
      importPageState: (pageData) => {
        const newPage = createDefaultPage({
          ...pageData,
          id: pageData.pageId || uuidv4(),
          elements: pageData.elements || []
        });
        
        setState(prev => ({
          ...prev,
          pages: [...prev.pages, newPage],
          activePageId: newPage.id
        }));
        
        return newPage;
      }
    };
  }, [
    state,
    memoizedActivePage,
    createPage,
    deletePage,
    duplicatePage,
    switchPage,
    reorderPages,
    updateActivePage,
    switchLayoutMode,
    createElement,
    addElement,
    batchElementUpdates,
    deleteElements,
    selectElement,
    clearSelection,
    selectAll,
    undo,
    redo,
  
  ]);

  return api;
};

export default useCanvasEditor;