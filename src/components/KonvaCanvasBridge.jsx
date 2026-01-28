// KonvaCanvasBridge.jsx - Updated with proper conversion
import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState, useMemo } from 'react';
import KonvaCanvasEngine from "../upgrade/canvas/KonvaCanvasEngine";

// Add this function to handle element conversion
const convertElementForCanvas = (element) => {
  if (!element) return null;
  
  console.log('🔧 convertElementForCanvas called with:', element);
  
  // If it's already a plain object with type and id, return it
  if (element.type && element.id) {
    console.log('✅ Element already in correct format');
    return element;
  }
  
  // If it's a KonvaElementWrapper, get the plain object
  if (element.getElement && typeof element.getElement === 'function') {
    const plainElement = element.getElement();
    console.log('✅ Element unwrapped from wrapper:', plainElement);
    return plainElement;
  }
  
  // Try to convert from various formats
  let converted = null;
  
  // Format 1: PDF decomposer format
  if (element.elementType || element.konvaType) {
    converted = {
      id: element.id || `element-${Date.now()}`,
      type: element.elementType || element.konvaType || 'rectangle',
      x: element.x || element.left || 0,
      y: element.y || element.top || 0,
      width: element.width || 100,
      height: element.height || 100,
      rotation: element.rotation || 0,
      fill: element.fill || '#3B82F6',
      stroke: element.stroke,
      strokeWidth: element.strokeWidth || 1,
      draggable: element.draggable !== false,
      visible: element.visible !== false,
      opacity: element.opacity !== undefined ? element.opacity : 1,
      ...element
    };
    console.log('✅ Converted from PDF format:', converted.type);
  }
  
  // Format 2: Legacy format
  else if (element.text !== undefined || element.points || element.radius) {
    if (element.text !== undefined) {
      converted = {
        id: element.id || `text-${Date.now()}`,
        type: 'text',
        x: element.x || 0,
        y: element.y || 0,
        text: element.text || '',
        fontSize: element.fontSize || 16,
        fontFamily: element.fontFamily || 'Arial',
        fill: element.fill || '#000000',
        width: element.width || 200,
        align: element.align || 'left',
        draggable: true,
        visible: true,
        opacity: 1
      };
      console.log('✅ Converted from legacy text format');
    } else if (element.points) {
      converted = {
        id: element.id || `line-${Date.now()}`,
        type: 'line',
        points: element.points,
        stroke: element.stroke || '#000000',
        strokeWidth: element.strokeWidth || 2,
        draggable: true,
        visible: true
      };
      console.log('✅ Converted from legacy line format');
    }
  }
  
  // Format 3: Minimal format (just coordinates)
  else if (element.x !== undefined && element.y !== undefined) {
    converted = {
      id: element.id || `rect-${Date.now()}`,
      type: 'rectangle',
      x: element.x,
      y: element.y,
      width: 100,
      height: 100,
      fill: '#3B82F6',
      draggable: true,
      visible: true
    };
    console.log('✅ Converted from minimal format');
  }
  
  if (converted) {
    // Ensure required fields
    if (!converted.id) {
      converted.id = `${converted.type}-${Date.now()}`;
    }
    if (!converted.name) {
      converted.name = converted.id;
    }
    
    return converted;
  }
  
  console.error('❌ Cannot convert element for canvas:', element);
  return null;
};

// Element factory for creating new elements
const createElementForBridge = (type, props = {}) => {
  const defaults = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    x: props.x || 0,
    y: props.y || 0,
    rotation: 0,
    opacity: 1,
    draggable: props.draggable !== false,
    visible: props.visible !== false,
    name: props.name || type,
  };
  
  switch (type) {
    case 'text':
      return {
        ...defaults,
        type: 'text',
        text: props.text || 'New Text',
        fontSize: props.fontSize || 16,
        fontFamily: props.fontFamily || 'Arial',
        fill: props.fill || '#000000',
        width: props.width || 200,
        height: props.height || 'auto',
        align: props.align || 'left',
        verticalAlign: props.verticalAlign || 'top',
        lineHeight: props.lineHeight || 1.2,
        padding: props.padding || 5,
      };
      
    case 'rectangle':
      return {
        ...defaults,
        type: 'rectangle',
        width: props.width || 100,
        height: props.height || 100,
        fill: props.fill || '#3B82F6',
        stroke: props.stroke || '#000000',
        strokeWidth: props.strokeWidth || 2,
        cornerRadius: props.cornerRadius || 0,
      };
      
    case 'circle':
      return {
        ...defaults,
        type: 'circle',
        radius: props.radius || 50,
        fill: props.fill || '#3B82F6',
        stroke: props.stroke || '#000000',
        strokeWidth: props.strokeWidth || 2,
      };
      
    case 'line':
      return {
        ...defaults,
        type: 'line',
        points: props.points || [0, 0, 100, 0],
        stroke: props.stroke || '#000000',
        strokeWidth: props.strokeWidth || 2,
        lineCap: props.lineCap || 'round',
        lineJoin: props.lineJoin || 'round',
      };
      
    default:
      console.warn(`Unknown element type: ${type}, creating rectangle as fallback`);
      return {
        ...defaults,
        type: 'rectangle',
        width: 100,
        height: 100,
        fill: '#FF6B6B',
        stroke: '#000000',
        strokeWidth: 2,
      };
  }
};

const KonvaCanvasBridge = forwardRef(({
  // Canvas props
  width = 800,
  height = 600,
  elements = [],
  selectedElementIds = [],
  zoom = 1,
  
  // Event handlers
  onElementsChange,
  onSelectionChange,
  onElementSelect,
  onElementTransform,
  onCanvasClick,
  onElementDoubleClick,
  onContextMenu,
  
  // Text properties
  textProperties,
  
  // Additional props
  backgroundColor = '#ffffff',
  gridEnabled = true,
  snapToGrid = false,
  gridSize = 20,
  readOnly = false,
  
  // Callbacks
  onReady,
  
  // Debug
  debug = true,
}, ref) => {
  
  const konvaEngineRef = useRef(null);
  const isUpdatingFromParentRef = useRef(false);
  const isInitializedRef = useRef(false);
  const elementsCacheRef = useRef([]);
  const pendingOperationsRef = useRef([]);
  
  // State to track bridge status
  const [bridgeStatus, setBridgeStatus] = useState({
    isReady: false,
    engineReady: false,
    elementsCount: 0,
    lastError: null,
  });
  
  // Debug logging
  const log = useCallback((message, data = null) => {
    if (debug) {
      console.log(`🌉 Bridge: ${message}`, data || '');
    }
  }, [debug]);
  
  const error = useCallback((message, err = null) => {
    console.error(`🌉 Bridge Error: ${message}`, err || '');
    setBridgeStatus(prev => ({
      ...prev,
      lastError: message
    }));
  }, []);
  
  // Convert elements for engine
  const convertElementsForEngine = useCallback((elementsToConvert) => {
    if (!Array.isArray(elementsToConvert)) return [];
    
    log('Converting elements for engine:', elementsToConvert.length);
    
    const converted = elementsToConvert.map(element => {
      const convertedElement = convertElementForCanvas(element);
      if (!convertedElement) {
        error('Failed to convert element:', element);
        return null;
      }
      return convertedElement;
    }).filter(Boolean);
    
    log('Conversion completed:', converted.length);
    return converted;
  }, [log, error]);
  
  // Convert elements from engine format
  const convertElementsFromEngine = useCallback((engineElements) => {
    if (!Array.isArray(engineElements)) return [];
    
    log('Converting elements from engine:', engineElements.length);
    
    // Simply return the engine elements - they should already be in the right format
    return engineElements;
  }, [log]);
  
  // Initialize engine
  const initializeEngine = useCallback(() => {
    if (!konvaEngineRef.current) {
      error('Engine ref is null');
      return;
    }
    
    log('Initializing engine communication...');
    
    // Convert initial elements
    const initialElements = convertElementsForEngine(elements);
    log('Initial elements converted:', initialElements.length);
    
    // Update cache
    elementsCacheRef.current = initialElements;
    
    setBridgeStatus(prev => ({
      ...prev,
      elementsCount: initialElements.length,
      engineReady: true
    }));
    
    log('Engine initialization complete');
  }, [elements, log, error, convertElementsForEngine]);
  
  // Sync elements from parent to engine
  useEffect(() => {
    if (isUpdatingFromParentRef.current || !bridgeStatus.engineReady || !konvaEngineRef.current) {
      return;
    }
    
    const engine = konvaEngineRef.current;
    const currentElements = engine.getElements?.() || [];
    const currentElementIds = currentElements.map(el => el.id);
    
    const newElements = convertElementsForEngine(elements);
    const newElementIds = newElements.map(el => el.id);
    
    // Check if elements have changed
    const hasChanged = JSON.stringify(currentElementIds) !== JSON.stringify(newElementIds);
    
    if (hasChanged) {
      log('Syncing elements from parent:', {
        oldCount: currentElements.length,
        newCount: newElements.length,
        hasChanged
      });
      
      isUpdatingFromParentRef.current = true;
      
      try {
        // Clear and re-add all elements
        engine.clearCanvas?.();
        
        newElements.forEach(element => {
          try {
            engine.addElement?.(element);
            log(`Added element: ${element.type} (${element.id})`);
          } catch (err) {
            error(`Failed to add element ${element.id}:`, err);
          }
        });
        
        elementsCacheRef.current = newElements;
      } catch (err) {
        error('Error during element sync:', err);
      } finally {
        setTimeout(() => {
          isUpdatingFromParentRef.current = false;
        }, 50);
      }
    }
  }, [elements, bridgeStatus.engineReady, log, error, convertElementsForEngine]);
  
  // Handle elements change from engine
  const handleElementsChange = useCallback((newElements) => {
    if (isUpdatingFromParentRef.current) {
      return; // Ignore if we're updating from parent
    }
    
    log('Elements changed from engine:', newElements.length);
    
    // Update cache
    elementsCacheRef.current = newElements;
    
    // Convert and notify parent
    const convertedElements = convertElementsFromEngine(newElements);
    
    if (onElementsChange) {
      onElementsChange(convertedElements);
    }
    
    // Update status
    setBridgeStatus(prev => ({
      ...prev,
      elementsCount: newElements.length
    }));
  }, [onElementsChange, log, convertElementsFromEngine]);
  
  // Handle selection change
  const handleSelectionChange = useCallback((selectedIds) => {
    log('Selection changed:', selectedIds);
    
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [onSelectionChange, log]);
  
  // Handle element double click
  const handleTextDoubleClick = useCallback((elementId, element) => {
    log('Text double clicked:', elementId);
    
    // Forward to parent if needed
    if (onElementDoubleClick) {
      onElementDoubleClick(elementId, element);
    }
  }, [onElementDoubleClick, log]);
  
  // Handle engine ready
  const handleEngineReady = useCallback(() => {
    log('✅ Engine is ready!');
    
    setBridgeStatus(prev => ({
      ...prev,
      isReady: true,
      engineReady: true
    }));
    
    isInitializedRef.current = true;
    
    // Process any pending operations
    if (pendingOperationsRef.current.length > 0) {
      log(`Processing ${pendingOperationsRef.current.length} pending operations`);
      // Process pending operations if needed
    }
    
    if (onReady) {
      onReady();
    }
  }, [onReady, log]);
  
// Expose methods to parent
useImperativeHandle(ref, () => {
  const api = {
    // Core element methods
    addElement: (elementOrType, props = {}) => {
      log('addElement called:', { elementOrType, props });
      
      const engine = konvaEngineRef.current;
      if (!engine?.addElement) {
        error('Engine not ready for addElement');
        return null;
      }
      
      try {
        let elementToAdd;
        
        // Check if first argument is an element object or a type string
        if (typeof elementOrType === 'string') {
          // Create element from type and props
          elementToAdd = createElementForBridge(elementOrType, props);
        } else {
          // Convert the element object
          elementToAdd = convertElementForCanvas(elementOrType);
        }
        
        if (!elementToAdd) {
          error('Failed to create/convert element');
          return null;
        }
        
        log('Adding element to engine:', elementToAdd);
        const result = engine.addElement(elementToAdd);
        
        if (result) {
          log('✅ Element added successfully:', result.id);
        } else {
          error('Engine.addElement returned falsy value');
        }
        
        return result;
      } catch (err) {
        error('Error in addElement:', err);
        return null;
      }
    },
    
    updateElement: (elementId, updates) => {
      log('updateElement called:', { elementId, updates });
      
      const engine = konvaEngineRef.current;
      if (!engine?.updateElement) {
        error('Engine not ready for updateElement');
        return false;
      }
      
      try {
        const result = engine.updateElement(elementId, updates);
        log('✅ Element updated:', result ? 'success' : 'failed');
        return result;
      } catch (err) {
        error('Error in updateElement:', err);
        return false;
      }
    },
    
    deleteElement: (elementId) => {
      log('deleteElement called:', elementId);
      
      const engine = konvaEngineRef.current;
      if (!engine?.deleteElement) {
        error('Engine not ready for deleteElement');
        return false;
      }
      
      try {
        const result = engine.deleteElement(elementId);
        log('✅ Element deleted:', result ? 'success' : 'failed');
        return result;
      } catch (err) {
        error('Error in deleteElement:', err);
        return false;
      }
    },
    
    // Selection methods
    setSelectedElementIds: (ids) => {
      log('setSelectedElementIds called:', ids);
      
      const engine = konvaEngineRef.current;
      if (!engine?.setSelectedElementIds) {
        error('Engine not ready for setSelectedElementIds');
        return false;
      }
      
      try {
        engine.setSelectedElementIds(ids);
        log('✅ Selection updated');
        return true;
      } catch (err) {
        error('Error in setSelectedElementIds:', err);
        return false;
      }
    },
    
    getSelectedElements: () => {
      const engine = konvaEngineRef.current;
      if (!engine?.getSelectedElements) {
        error('Engine not ready for getSelectedElements');
        return [];
      }
      
      try {
        const selected = engine.getSelectedElements();
        log('getSelectedElements returned:', selected.length);
        return selected;
      } catch (err) {
        error('Error in getSelectedElements:', err);
        return [];
      }
    },
    
    // Tool methods - 🔥 NEW
    setActiveTool: (toolId) => {
      log('setActiveTool called:', toolId);
      
      const engine = konvaEngineRef.current;
      if (!engine?.setActiveTool) {
        error('Engine not ready for setActiveTool');
        return false;
      }
      
      try {
        const result = engine.setActiveTool(toolId);
        log('✅ Active tool set:', toolId);
        return result !== undefined ? result : true;
      } catch (err) {
        error('Error in setActiveTool:', err);
        return false;
      }
    },
    
    getActiveTool: () => {
      const engine = konvaEngineRef.current;
      if (!engine?.getActiveTool) {
        error('Engine not ready for getActiveTool');
        return 'select';
      }
      
      try {
        const tool = engine.getActiveTool();
        log('getActiveTool returned:', tool);
        return tool;
      } catch (err) {
        error('Error in getActiveTool:', err);
        return 'select';
      }
    },
    
    // Canvas control
    clearCanvas: () => {
      log('clearCanvas called');
      
      const engine = konvaEngineRef.current;
      if (!engine?.clearCanvas) {
        error('Engine not ready for clearCanvas');
        return false;
      }
      
      try {
        engine.clearCanvas();
        log('✅ Canvas cleared');
        return true;
      } catch (err) {
        error('Error in clearCanvas:', err);
        return false;
      }
    },
    
    // Direct engine access
    getEngine: () => {
      log('getEngine called');
      return konvaEngineRef.current;
    },
    
    getElements: () => {
      const engine = konvaEngineRef.current;
      if (!engine?.getElements) {
        error('Engine not ready for getElements');
        return [];
      }
      
      try {
        const elements = engine.getElements();
        log('getElements returned:', elements.length);
        return elements;
      } catch (err) {
        error('Error in getElements:', err);
        return [];
      }
    },
    
    // Debug and status
    getStatus: () => {
      return {
        ...bridgeStatus,
        cacheCount: elementsCacheRef.current.length,
        isInitialized: isInitializedRef.current,
        pendingOps: pendingOperationsRef.current.length,
        // 🔥 ADD tool info
        currentTool: api.getActiveTool ? api.getActiveTool() : 'unknown'
      };
    },
    
    debug: () => {
      console.log('=== Bridge Debug Info ===');
      console.log('Bridge Status:', bridgeStatus);
      console.log('Engine Ready:', !!konvaEngineRef.current);
      console.log('Elements Cache:', elementsCacheRef.current.length);
      console.log('Initialized:', isInitializedRef.current);
      console.log('Current Tool:', api.getActiveTool ? api.getActiveTool() : 'unknown');
      console.log('=======================');
      
      // Also debug the engine if available
      if (konvaEngineRef.current?.debug) {
        konvaEngineRef.current.debug();
      }
    }
  };
  
  return api;
}, [bridgeStatus, log, error, ]); // Add dependencies
  
  // Initial conversion of elements
  const initialElements = useMemo(() => {
    return convertElementsForEngine(elements);
  }, [elements, convertElementsForEngine]);
  
  log('Bridge rendering with:', {
    elements: initialElements.length,
    selectedElementIds: selectedElementIds.length,
    bridgeStatus
  });
  
  return (
    <>
      {debug && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          fontSize: '11px',
          zIndex: 10000,
          pointerEvents: 'none'
        }}>
          🌉 Bridge: {bridgeStatus.isReady ? '✅ Ready' : '🔄 Loading'} | 
          Elements: {bridgeStatus.elementsCount} | 
          Engine: {bridgeStatus.engineReady ? '✅' : '❌'}
        </div>
      )}
      
      <KonvaCanvasEngine
      ref={konvaEngineRef}
      width={width}
      height={height}
      initialElements={initialElements}
      // 🚨 REMOVE THIS LINE: selectedTool={selectedTool}
      selectedElementIds={selectedElementIds}
      onElementsChange={handleElementsChange}
      onSelectionChange={handleSelectionChange}
      onTextDoubleClick={handleTextDoubleClick}
      gridEnabled={gridEnabled}
      snapToGrid={snapToGrid}
      gridSize={gridSize}
      backgroundColor={backgroundColor}
      readOnly={readOnly}
      enableDirectTextEditing={true}
      onReady={handleEngineReady}
      debug={debug}
    />
    </>
  );
});

KonvaCanvasBridge.displayName = 'KonvaCanvasBridge';

export default KonvaCanvasBridge;