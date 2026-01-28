// src/app/features/ocr/utils/documentEditorHooks.js - COMPLETE FIX
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DocumentEditor from './documentEditor';

/**
 * Main hook for using DocumentEditor in React components with Konva integration
 */
export function useDocumentEditor(options = {}) {
  // Core states
  const [editor, setEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Document states
  const [documentData, setDocumentData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Interactive states
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [viewport, setViewport] = useState({
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    width: 800,
    height: 600
  });
  
  // Tool states
  const [activeTool, setActiveTool] = useState('select');
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  
  // Refs
  const canvasRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const konvaStageRef = useRef(null);

  // Use ref for currentPage to avoid stale closures in event handlers
  const currentPageRef = useRef(currentPage);

  // ... your existing state definitions

// ✅ ADD a cleanup flag to prevent multiple cleanups
const cleanupRef = useRef(null);

  
  // Update the ref when currentPage changes
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Move setupEventListeners to the top and define it properly
// ✅ FIXED: Setup event listeners with proper dependency array
const setupEventListeners = useCallback((docEditor) => {
  console.log('🎯 Setting up DocumentEditor event listeners...');
  
  // Store unsubscribe functions for cleanup
  const unsubscribers = [];
  
  // Helper to safely subscribe to events
  const subscribe = (eventName, handler) => {
    if (typeof docEditor.on === 'function') {
      const unsubscribe = docEditor.on(eventName, handler);
      unsubscribers.push(unsubscribe);
    } else {
      console.error(`DocumentEditor.on() is not a function. Available methods:`, Object.keys(docEditor).filter(key => typeof docEditor[key] === 'function'));
    }
  };

  // Define handlers
  const handlers = {
    elementSelected: (data) => {
      setSelectedElementIds(prev => {
        if (data.multiSelect && !prev.includes(data.elementId)) {
          return [...prev, data.elementId];
        }
        return [data.elementId];
      });
    },
    
    elementClicked: (data) => {
      console.log('Element clicked:', data);
    },
    
    elementDragged: () => {
      if (konvaStageRef.current) {
        konvaStageRef.current.batchDraw();
      }
    },
    
    elementDragCompleted: (data) => {
      console.log('Element drag completed:', data);
    },
    
    elementHovered: (data) => {
      setHoveredElementId(data.elementId || null);
    },
    
    elementTransformed: (data) => {
      console.log('Element transformed:', data);
      setDocumentData(prev => {
        if (!prev) return prev;
        
        const newPages = [...prev.pages];
        // Use currentPageRef to get the latest current page
        const pageIndex = currentPageRef.current - 1;
        
        if (pageIndex < newPages.length) {
          const updatedElements = newPages[pageIndex].elements.map(el => 
            el.id === data.elementId ? { ...el, ...data.updates } : el
          );
          
          newPages[pageIndex] = {
            ...newPages[pageIndex],
            elements: updatedElements
          };
          
          return { ...prev, pages: newPages };
        }
        
        return prev;
      });
    },
    
    viewportChanged: (data) => {
      setViewport(prev => ({
        ...prev,
        pan: data.pan,
        zoom: data.zoom
      }));
    },
    
    zoomChanged: (data) => {
      setViewport(prev => ({
        ...prev,
        zoom: data.zoom,
        pan: data.pan
      }));
    },
    
    panCompleted: () => {
      setIsPanning(false);
    },
    
    selectionChanged: (data) => {
      setSelectedElementIds(data.selectedElementIds || []);
    },
    
    selectionCleared: () => {
      setSelectedElementIds([]);
    },
    
    selectionCompleted: (data) => {
      setSelectedElementIds(data.elementIds || []);
      setIsSelecting(false);
      setSelectionRect(null);
    },
    
    canvasClicked: (data) => {
      if (!data.elementId) {
        setSelectedElementIds([]);
      }
    }
  };
  
  // Register all event handlers
  Object.entries(handlers).forEach(([eventName, handler]) => {
    subscribe(eventName, handler);
  });
  
  console.log(`✅ Registered ${unsubscribers.length} event listeners`);
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up DocumentEditor event listeners...');
    unsubscribers.forEach(unsub => {
      try {
        if (typeof unsub === 'function') {
          unsub();
        }
      } catch (e) {
        console.warn('Error unsubscribing event listener:', e);
      }
    });
  };
}, []); // ✅ Empty dependencies since handlers use refs

// ✅ FIXED: Main initialization useEffect (with double-init guard)
useEffect(() => {
  console.log('🚀 useDocumentEditor: Mounting...');

  // ✅ ADDITION: Prevent double initialization
  if (editorInstanceRef.current) {
    console.log('🔄 Editor already exists, skipping initialization');
    return;
  }

  // ✅ Local lifecycle state (no refs needed)
  let isMounted = true;
  let editorInstance = null;
  let eventCleanup = null;

  const initialize = async () => {
    try {
      if (isMounted) {
        setIsLoading(true);
      }

      // 🎨 Create or reuse canvas
      let canvasElement = canvasRef.current;
      if (!canvasElement) {
        console.log('🎨 Creating canvas element...');
        canvasElement = document.createElement('canvas');
        canvasElement.style.cssText = `
          position: fixed;
          left: -9999px;
          top: -9999px;
          width: 800px;
          height: 600px;
          visibility: hidden;
          pointer-events: none;
        `;
        document.body.appendChild(canvasElement);
        canvasRef.current = canvasElement;
      }

      // 📝 Create editor instance (no auto-init)
      editorInstance = new DocumentEditor({
        ...options,
        canvasElement
      });

      // ✅ Validate event API
      if (typeof editorInstance.on !== 'function') {
        throw new Error(
          'DocumentEditor instance does not have .on() method for event handling'
        );
      }

      console.log('✅ Editor created with .on() method available');

      // 🔗 Store instance reference
      editorInstanceRef.current = editorInstance;

      // 🎧 Setup event listeners
      eventCleanup = setupEventListeners(editorInstance);
      cleanupRef.current = eventCleanup;

      // ✅ Update state only if still mounted
      if (isMounted) {
        setEditor(editorInstance);
        setError(null);
        setIsLoading(false);

        console.log(
          '✅ useDocumentEditor: Editor created (ready for lazy initialization)'
        );
      }
    } catch (error) {
      console.error('❌ useDocumentEditor: Initialization error:', error);
      if (isMounted) {
        setError(error.message || 'Failed to initialize editor');
        setIsLoading(false);
      }
    }
  };

  initialize();

  // 🧹 Cleanup (runs only on unmount or dependency change)
  return () => {
    console.log('🧹 useDocumentEditor: Cleanup triggered...');
    isMounted = false;

    // 🎧 Cleanup event listeners
    if (eventCleanup) {
      try {
        eventCleanup();
      } catch (e) {
        console.warn('Error cleaning up event listeners:', e);
      }
    }

    // 📝 Destroy editor
    if (editorInstance) {
      console.log('🧹 Destroying DocumentEditor instance...');
      try {
        editorInstance.destroy();
      } catch (e) {
        console.warn('Error destroying editor:', e);
      }
      editorInstanceRef.current = null;
    }

    // 🎨 Remove canvas (only if we created it)
    const canvasElement = canvasRef.current;
    if (canvasElement && canvasElement.parentNode === document.body) {
      console.log('🧹 Removing canvas element...');
      try {
        canvasElement.parentNode.removeChild(canvasElement);
      } catch (e) {
        console.warn('Error removing canvas:', e);
      }
      canvasRef.current = null;
    }
  };
}, [options, setupEventListeners]); // ✅ Stable dependencies

  // Process document
// ✅ FIXED: processDocument with proper initialization check
const processDocument = useCallback(async (file, processOptions = {}) => {
  console.log('📄 processDocument called with file:', file?.name);
  
  // Check if we have an editor instance
  if (!editorInstanceRef.current) {
    console.error('❌ Editor instance not created yet');
    throw new Error('Document editor is not ready. Please try again.');
  }
  
  try {
    setIsLoading(true);
    setError(null);
    
    console.log('🔧 Ensuring editor is initialized...');
    
    // ✅ CRITICAL: Use ensureInitialized to wait for initialization
    await editorInstanceRef.current.ensureInitialized();
    
    console.log('✅ Editor initialized, processing document...');
    
    const processedDoc = await editorInstanceRef.current.processDocument(file, processOptions);
    
    // Update states
    setDocumentData(processedDoc);
    setTotalPages(processedDoc.totalPages || 1);
    setCurrentPage(1);
    setSelectedElementIds([]);
    setHoveredElementId(null);
    
    console.log('✅ Document processed successfully:', {
      pages: processedDoc.pages?.length,
      elements: processedDoc.pages?.[0]?.elements?.length
    });
    
    return processedDoc;
    
  } catch (error) {
    console.error('❌ Document processing error:', error);
    
    // Better error message
    let errorMessage = error.message || 'Failed to process document';
    if (errorMessage.includes('initialize') || errorMessage.includes('not ready')) {
      errorMessage = 'Document editor initialization failed. Please refresh and try again.';
    }
    
    setError(errorMessage);
    throw new Error(errorMessage);
    
  } finally {
    setIsLoading(false);
  }
}, []); // ✅ Empty dependencies - uses refs

  // Navigate pages
  const goToPage = useCallback((pageNumber) => {
    if (!editorInstanceRef.current || !documentData) return;
    
    const validPage = Math.max(1, Math.min(pageNumber, totalPages));
    if (validPage !== currentPage) {
      editorInstanceRef.current.goToPage(validPage);
      setCurrentPage(validPage);
      setSelectedElementIds([]); // Clear selection on page change
    }
  }, [documentData, totalPages, currentPage]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Viewport control
  const zoomIn = useCallback(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.zoomOut();
    }
  }, []);

  const setZoom = useCallback((zoom, centerX, centerY) => {
    if (!editorInstanceRef.current) return;
    
    const canvas = canvasRef.current;
    // Use provided coordinates or default to center
    const centerPosX = centerX ?? (canvas?.width / 2);
    const centerPosY = centerY ?? (canvas?.height / 2);
    
    editorInstanceRef.current.setZoom(zoom, centerPosX, centerPosY);
  }, []);

  
  const resetView = useCallback(() => {
    if (!editorInstanceRef.current) return;
    
    editorInstanceRef.current.currentZoom = 1.0;
    editorInstanceRef.current.currentPan = { x: 0, y: 0 };
    editorInstanceRef.current.renderCurrentPage();
    
    setViewport(prev => ({
      ...prev,
      zoom: 1.0,
      pan: { x: 0, y: 0 }
    }));
  }, []);
  
  const fitToView = useCallback((contentWidth, contentHeight, containerWidth, containerHeight) => {
    if (!contentWidth || !contentHeight || !containerWidth || !containerHeight) return;
    
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newZoom = Math.min(scaleX, scaleY) * 0.9;
    
    // Use the center of the container
    setZoom(newZoom, containerWidth / 2, containerHeight / 2);
  }, [setZoom]);

  // Element operations
  const getElementById = useCallback((elementId) => {
    if (!documentData || !editorInstanceRef.current) return null;
    
    const element = editorInstanceRef.current.elementRegistry.get(elementId);
    if (element) return element;
    
    // Fallback to document data
    for (const page of documentData.pages) {
      const foundElement = page.elements.find(el => el.id === elementId);
      if (foundElement) return foundElement;
    }
    
    return null;
  }, [documentData]);

  const updateElement = useCallback((elementId, updates) => {
    if (!editorInstanceRef.current) return;
    
    editorInstanceRef.current.updateElement(elementId, updates);
  }, []);

  const deleteElement = useCallback((elementId) => {
    if (!editorInstanceRef.current) return;
    
    // If it's in current selection, use deleteSelectedElements
    if (selectedElementIds.includes(elementId)) {
      editorInstanceRef.current.deleteSelectedElements();
    } else {
      // Update selection and delete
      setSelectedElementIds([elementId]);
      setTimeout(() => {
        editorInstanceRef.current.deleteSelectedElements();
      }, 0);
    }
  }, [selectedElementIds]);

  const deleteSelectedElements = useCallback(() => {
    if (!editorInstanceRef.current) return;
    
    editorInstanceRef.current.deleteSelectedElements();
    setSelectedElementIds([]);
  }, []);

  const selectElement = useCallback((elementId, multiSelect = false) => {
    if (!editorInstanceRef.current) return;
    
    if (multiSelect) {
      setSelectedElementIds(prev => {
        if (prev.includes(elementId)) {
          return prev.filter(id => id !== elementId);
        }
        return [...prev, elementId];
      });
    } else {
      setSelectedElementIds([elementId]);
    }
    
    // Trigger editor's selection logic
    const element = getElementById(elementId);
    if (element) {
      editorInstanceRef.current.emit('elementSelected', { 
        elementId, 
        multiSelect 
      });
    }
  }, [getElementById]);

  const selectAll = useCallback(() => {
    if (!editorInstanceRef.current || !documentData) return;
    
    const pageData = documentData.pages[currentPage - 1];
    if (pageData && pageData.elements) {
      const allIds = pageData.elements.map(el => el.id);
      setSelectedElementIds(allIds);
      editorInstanceRef.current.emit('selectionChanged', { 
        selectedElementIds: allIds 
      });
    }
  }, [documentData, currentPage]);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
    if (editorInstanceRef.current) {
      editorInstanceRef.current.emit('selectionCleared', {});
    }
  }, []);

  // Selection rectangle operations
  const startSelection = useCallback((x, y) => {
    setIsSelecting(true);
    setSelectionRect({
      x: x,
      y: y,
      width: 0,
      height: 0
    });
  }, []);

  const updateSelectionRect = useCallback((x, y) => {
    if (!selectionRect) return;
    
    setSelectionRect(prev => ({
      ...prev,
      width: x - prev.x,
      height: y - prev.y
    }));
  }, [selectionRect]);

  const endSelection = useCallback(() => {
    if (!selectionRect || !editorInstanceRef.current || !documentData) {
      setIsSelecting(false);
      setSelectionRect(null);
      return;
    }
    
    const pageData = documentData.pages[currentPage - 1];
    if (!pageData || !pageData.elements) {
      setIsSelecting(false);
      setSelectionRect(null);
      return;
    }
    
    // Find elements in selection rectangle
    const selected = editorInstanceRef.current.getElementsInRect(selectionRect);
    const selectedIds = selected.map(el => el.id);
    
    setSelectedElementIds(selectedIds);
    setIsSelecting(false);
    setSelectionRect(null);
    
    editorInstanceRef.current.emit('selectionCompleted', {
      elementIds: selectedIds,
      selectionRect: { ...selectionRect }
    });
  }, [selectionRect, documentData, currentPage]);

  // Export methods
  const exportToImage = useCallback((format = 'png', quality = 1.0) => {
    if (!editorInstanceRef.current) {
      throw new Error('Editor not initialized');
    }
    
    try {
      return editorInstanceRef.current.exportToImage(format, quality);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const exportCurrentPage = useCallback(async () => {
    if (!editorInstanceRef.current || !documentData) {
      throw new Error('No document loaded');
    }
    
    const pageData = documentData.pages[currentPage - 1];
    if (!pageData) {
      throw new Error('Current page not found');
    }
    
    // You can implement custom export logic here
    // For now, use the existing image export
    return exportToImage('png', 1.0);
  }, [documentData, currentPage, exportToImage]);

  // Get document statistics
  const getDocumentStats = useCallback(() => {
    if (!documentData) return null;
    
    const currentPageData = documentData.pages[currentPage - 1];
    if (!currentPageData) return null;
    
    const textElements = currentPageData.elements?.filter(el => el.type === 'text').length || 0;
    const imageElements = currentPageData.elements?.filter(el => el.type === 'image').length || 0;
    const totalElements = currentPageData.elements?.length || 0;
    
    return {
      totalPages,
      currentPage,
      totalElements,
      textElements,
      imageElements,
      pageWidth: currentPageData.width,
      pageHeight: currentPageData.height
    };
  }, [documentData, currentPage, totalPages]);

  // Get current page elements (for Konva rendering)
  const getCurrentPageElements = useCallback(() => {
    if (!documentData || !documentData.pages || documentData.pages.length === 0) {
      return [];
    }
    
    const pageData = documentData.pages[currentPage - 1];
    if (!pageData || !pageData.elements) {
      return [];
    }
    
    return pageData.elements.map(element => ({
      ...element,
      isSelected: selectedElementIds.includes(element.id),
      isHovered: hoveredElementId === element.id
    }));
  }, [documentData, currentPage, selectedElementIds, hoveredElementId]);

  // Convert to Konva-compatible format
  const getKonvaElements = useCallback(() => {
    const elements = getCurrentPageElements();
    
    return elements.map(element => {
      const konvaElement = {
        id: element.id,
        type: element.type,
        x: element.x,
        y: element.y,
        draggable: element.draggable !== false,
        isSelected: element.isSelected,
        isHovered: element.isHovered,
        
        // Konva-specific properties
        onClick: () => selectElement(element.id, false),
        onTap: () => selectElement(element.id, false),
        onDragEnd: (e) => {
          if (editorInstanceRef.current) {
            const newX = e.target.x();
            const newY = e.target.y();
            editorInstanceRef.current.updateElement(element.id, { x: newX, y: newY });
          }
        },
        onTransformEnd: (e) => {
          if (editorInstanceRef.current) {
            const node = e.target;
            const updates = {
              x: node.x(),
              y: node.y(),
              ...(element.type === 'text' && { width: node.width() }),
              ...(element.type === 'image' && {
                width: node.width(),
                height: node.height()
              }),
              ...(element.type === 'rectangle' && {
                width: node.width(),
                height: node.height()
              })
            };
            editorInstanceRef.current.updateElement(element.id, updates);
          }
        }
      };
      
      // Type-specific properties
      switch (element.type) {
        case 'text':
          konvaElement.text = element.text;
          konvaElement.fontSize = element.fontSize || 12;
          konvaElement.fontFamily = element.fontFamily || 'Arial';
          konvaElement.fontWeight = element.fontWeight;
          konvaElement.fontStyle = element.fontStyle;
          konvaElement.fill = element.fill || '#000000';
          konvaElement.textAlign = element.textAlign;
          konvaElement.width = element.width;
          konvaElement.wrap = 'word';
          break;
          
        case 'image':
          konvaElement.image = element.src;
          konvaElement.width = element.width;
          konvaElement.height = element.height;
          break;
          
        case 'rectangle':
          konvaElement.width = element.width;
          konvaElement.height = element.height;
          konvaElement.fill = element.fill || 'transparent';
          konvaElement.stroke = element.stroke || '#000000';
          konvaElement.strokeWidth = element.strokeWidth || 1;
          break;
          
        default:
          break;
      }
      
      return konvaElement;
    });
  }, [getCurrentPageElements, selectElement]);

  // Sync Konva selection with editor
  const syncSelectionWithKonva = useCallback((konvaSelection) => {
    if (!editorInstanceRef.current || !konvaSelection) return;
    
    const selectedIds = konvaSelection.map(node => node.id());
    setSelectedElementIds(selectedIds);
    
    // Update editor's internal state
    editorInstanceRef.current.selectedElementIds = selectedIds;
    editorInstanceRef.current.emit('selectionChanged', { selectedElementIds: selectedIds });
  }, []);

  // Bridge: Handle mouse events from Konva
  const handleKonvaMouseDown = useCallback((e) => {
    if (!editorInstanceRef.current || !canvasRef.current) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    if (activeTool === 'pan') {
      setIsPanning(true);
      editorInstanceRef.current.isPanning = true;
      editorInstanceRef.current.isDragging = true;
      editorInstanceRef.current.dragStartPos = { x: pos.x, y: pos.y };
      editorInstanceRef.current.lastMousePos = { x: pos.x, y: pos.y };
    }
    // Tool selection logic is handled separately
  }, [activeTool]);

  const handleKonvaMouseMove = useCallback((e) => {
    if (!editorInstanceRef.current || !canvasRef.current) return;
    
    if (isPanning && editorInstanceRef.current) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      
      const deltaX = pos.x - editorInstanceRef.current.lastMousePos.x;
      const deltaY = pos.y - editorInstanceRef.current.lastMousePos.y;
      
      editorInstanceRef.current.currentPan.x += deltaX;
      editorInstanceRef.current.currentPan.y += deltaY;
      editorInstanceRef.current.lastMousePos = { x: pos.x, y: pos.y };
      
      setViewport(prev => ({
        ...prev,
        pan: editorInstanceRef.current.currentPan
      }));
      
      editorInstanceRef.current.emit('viewportChanged', {
        pan: editorInstanceRef.current.currentPan,
        zoom: editorInstanceRef.current.currentZoom
      });
    }
  }, [isPanning]);

  const handleKonvaMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      if (editorInstanceRef.current) {
        editorInstanceRef.current.isPanning = false;
        editorInstanceRef.current.isDragging = false;
        editorInstanceRef.current.emit('panCompleted', { 
          pan: editorInstanceRef.current.currentPan 
        });
      }
    }
  }, [isPanning]);

  const handleKonvaWheel = useCallback((e) => {
    if (!editorInstanceRef.current || !canvasRef.current) return;
    
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    // Use actual mouse event instead of creating mock
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: e.evt.deltaY,
      clientX: pos.x,
      clientY: pos.y,
      ctrlKey: e.evt.ctrlKey || e.evt.metaKey,
      bubbles: true
    });
    
    // Trigger editor's wheel handler
    editorInstanceRef.current.handleWheel(wheelEvent);
  }, []);

  // Bridge: Add new element from Konva
  const addElementFromKonva = useCallback((type, konvaProps) => {
    if (!editorInstanceRef.current || !documentData) return null;
    
    const pageData = documentData.pages[currentPage - 1];
    if (!pageData) return null;
    
    const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const element = {
      id: elementId,
      type: type,
      x: konvaProps.x || 100,
      y: konvaProps.y || 100,
      draggable: true,
      page: currentPage,
      ...konvaProps
    };
    
    // Add to editor's registry
    editorInstanceRef.current.elementRegistry.set(elementId, element);
    
    // Update page cache
    pageData.elements.push(element);
    editorInstanceRef.current.pageCache.set(currentPage, pageData);
    
    // Update document data
    setDocumentData(prev => {
      if (!prev) return prev;
      
      const newPages = [...prev.pages];
      newPages[currentPage - 1] = pageData;
      
      return { ...prev, pages: newPages };
    });
    
    // Select the new element
    selectElement(elementId, false);
    
    return elementId;
  }, [documentData, currentPage, selectElement]);

  // Get editor's transformation matrix for Konva
  const getTransformationMatrix = useCallback(() => {
    if (!editorInstanceRef.current) return { scaleX: 1, scaleY: 1, x: 0, y: 0 };
    
    return {
      scaleX: editorInstanceRef.current.currentZoom,
      scaleY: editorInstanceRef.current.currentZoom,
      x: editorInstanceRef.current.currentPan.x,
      y: editorInstanceRef.current.currentPan.y
    };
  }, []);

  // Memoized values
  const currentPageElements = useMemo(() => getCurrentPageElements(), [getCurrentPageElements]);
  const konvaElements = useMemo(() => getKonvaElements(), [getKonvaElements]);
  const transformationMatrix = useMemo(() => getTransformationMatrix(), [getTransformationMatrix]);

  return {
    // State
    editor,
    isLoading,
    error,
    documentData,
    currentPage,
    totalPages,
    selectedElementIds,
    hoveredElementId,
    viewport,
    activeTool,
    isPanning,
    isSelecting,
    selectionRect,
    
    // Refs
    canvasRef,
    konvaStageRef,
    
    // Document operations
    processDocument,
    goToPage,
    nextPage,
    prevPage,
    // Viewport control
    zoomIn,
    zoomOut,
    setZoom,
    resetView,
    fitToView,
    setViewport,
    
    // Element operations
    getElementById,
    updateElement,
    deleteElement,
    deleteSelectedElements,
    selectElement,
    selectAll,
    clearSelection,
    addElementFromKonva,
    
    // Selection operations
    startSelection,
    updateSelectionRect,
    endSelection,
    
    // Export
    exportToImage,
    exportCurrentPage,
    
    // Utilities
    getDocumentStats,
    getCurrentPageElements: () => currentPageElements,
    getKonvaElements: () => konvaElements,
    getTransformationMatrix: () => transformationMatrix,
    
    // Konva bridge handlers
    handleKonvaMouseDown,
    handleKonvaMouseMove,
    handleKonvaMouseUp,
    handleKonvaWheel,
    syncSelectionWithKonva,
    
    // Tool control
    setActiveTool,
    
    // Error handling
    clearError: () => setError(null)
  };
}

/**
 * Hook for document viewport/zoom control (enhanced for Konva)
 */
export function useDocumentViewport() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  
  const zoomIn = useCallback((factor = 1.2) => {
    setZoom(prev => Math.min(prev * factor, 5));
  }, []);
  
  const zoomOut = useCallback((factor = 1.2) => {
    setZoom(prev => Math.max(prev / factor, 0.2));
  }, []);
  
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, []);
  
  const panTo = useCallback((x, y) => {
    setPan({ x, y });
  }, []);
  
  const rotate = useCallback((angle) => {
    setRotation(angle % 360);
  }, []);
  
  const fitToView = useCallback((contentWidth, contentHeight, containerWidth, containerHeight) => {
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 2) * 0.9;
    
    setZoom(newZoom);
    setPan({ 
      x: (containerWidth - contentWidth * newZoom) / 2,
      y: (containerHeight - contentHeight * newZoom) / 2
    });
  }, []);
  
  const getTransform = useCallback(() => {
    return {
      scaleX: zoom,
      scaleY: zoom,
      x: pan.x,
      y: pan.y,
      rotation: rotation
    };
  }, [zoom, pan, rotation]);
  
  return {
    zoom,
    pan,
    rotation,
    zoomIn,
    zoomOut,
    resetView,
    panTo,
    rotate,
    fitToView,
    setZoom,
    setPan,
    setRotation,
    getTransform
  };
}

/**
 * Hook for document editing operations (enhanced for Konva)
 */
export function useDocumentEditing(documentData, updateElement) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [redoStack, setRedoStack] = useState([]);
  
  const addToHistory = useCallback((state) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state)));
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => prev + 1);
    setRedoStack([]); // Clear redo stack on new action
  }, [historyIndex]);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      setRedoStack(prev => [...prev, documentData]);
      return previousState;
    }
    return null;
  }, [history, historyIndex, documentData]);
  
  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      setHistoryIndex(prev => prev + 1);
      return nextState;
    }
    return null;
  }, [redoStack]);
  
  const updateElementWithHistory = useCallback((elementId, updates) => {
    // Save current state to history
    if (documentData) {
      addToHistory(documentData);
    }
    
    // Perform update
    updateElement(elementId, updates);
  }, [documentData, updateElement, addToHistory]);
  
  const canUndo = historyIndex > 0;
  const canRedo = redoStack.length > 0;
  
  return {
    undo,
    redo,
    updateElementWithHistory,
    addToHistory,
    canUndo,
    canRedo,
    historyIndex,
    historyCount: history.length
  };
}

/**
 * Hook for document layers (enhanced for Konva)
 */
export function useDocumentLayers() {
  const [layers, setLayers] = useState({
    text: { visible: true, opacity: 1, zIndex: 3 },
    images: { visible: true, opacity: 1, zIndex: 2 },
    graphics: { visible: true, opacity: 1, zIndex: 1 },
    annotations: { visible: true, opacity: 0.8, zIndex: 4 },
    background: { visible: true, opacity: 1, zIndex: 0 }
  });
  
  const [activeLayer, setActiveLayer] = useState('text');
  
  const toggleLayer = useCallback((layerName) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        visible: !prev[layerName].visible
      }
    }));
  }, []);
  
  const setLayerOpacity = useCallback((layerName, opacity) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        opacity: Math.max(0, Math.min(1, opacity))
      }
    }));
  }, []);
  
  const setLayerZIndex = useCallback((layerName, zIndex) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        zIndex
      }
    }));
  }, []);
  
  const bringToFront = useCallback((layerName) => {
    const maxZIndex = Math.max(...Object.values(layers).map(l => l.zIndex));
    setLayerZIndex(layerName, maxZIndex + 1);
  }, [layers, setLayerZIndex]);
  
  const sendToBack = useCallback((layerName) => {
    const minZIndex = Math.min(...Object.values(layers).map(l => l.zIndex));
    setLayerZIndex(layerName, minZIndex - 1);
  }, [layers, setLayerZIndex]);
  
  const getSortedLayers = useCallback(() => {
    return Object.entries(layers)
      .sort(([, a], [, b]) => a.zIndex - b.zIndex)
      .map(([name, config]) => ({ name, ...config }));
  }, [layers]);
  
  return {
    layers,
    activeLayer,
    setActiveLayer,
    toggleLayer,
    setLayerOpacity,
    setLayerZIndex,
    bringToFront,
    sendToBack,
    getSortedLayers
  };
}

/**
 * Hook for managing multiple documents (enhanced for Konva)
 */
export function useDocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0);
  const [documentHistory, setDocumentHistory] = useState({});
  
  const addDocument = useCallback((documentData, name = 'Untitled') => {
    const newDoc = {
      id: Date.now().toString(),
      name,
      data: documentData,
      createdAt: new Date(),
      modifiedAt: new Date(),
      thumbnail: null,
      tags: []
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocumentIndex(documents.length);
    
    // Initialize history for this document
    setDocumentHistory(prev => ({
      ...prev,
      [newDoc.id]: []
    }));
    
    return newDoc.id;
  }, [documents.length]);
  
  const removeDocument = useCallback((documentId) => {
    setDocuments(prev => {
      const newDocs = prev.filter(doc => doc.id !== documentId);
      if (activeDocumentIndex >= newDocs.length) {
        setActiveDocumentIndex(Math.max(0, newDocs.length - 1));
      }
      return newDocs;
    });
    
    // Remove from history
    setDocumentHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[documentId];
      return newHistory;
    });
  }, [activeDocumentIndex]);
  
  const updateDocument = useCallback((documentId, updates) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, ...updates, modifiedAt: new Date() }
        : doc
    ));
  }, []);
  
  const getActiveDocument = useCallback(() => {
    return documents[activeDocumentIndex] || null;
  }, [documents, activeDocumentIndex]);
  
  const addDocumentHistory = useCallback((documentId, snapshot) => {
    setDocumentHistory(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), snapshot].slice(-50)
    }));
  }, []);
  
  const getDocumentHistory = useCallback((documentId) => {
    return documentHistory[documentId] || [];
  }, [documentHistory]);
  
  const restoreFromHistory = useCallback((documentId, historyIndex) => {
    const history = documentHistory[documentId];
    if (history && history[historyIndex]) {
      updateDocument(documentId, { data: history[historyIndex] });
      return true;
    }
    return false;
  }, [documentHistory, updateDocument]);
  
  return {
    documents,
    activeDocumentIndex,
    setActiveDocumentIndex,
    addDocument,
    removeDocument,
    updateDocument,
    getActiveDocument,
    addDocumentHistory,
    getDocumentHistory,
    restoreFromHistory,
    totalDocuments: documents.length
  };
}

/**
 * Hook for OCR operations
 */
export function useOCROperations(editor) {
  const [ocrProgress, setOCRProgress] = useState(0);
  const [ocrResults, setOCRResults] = useState(null);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  
  const performOCR = useCallback(async (imageFile, options = {}) => {
    if (!editor || !editor.tesseractWorker) {
      throw new Error('OCR engine not available');
    }
    
    try {
      setIsOCRProcessing(true);
      setOCRProgress(0);
      
      const result = await editor.tesseractWorker.recognize(imageFile, 'eng', {
        logger: (message) => {
          if (message.status === 'recognizing text') {
            setOCRProgress(message.progress || 0);
          }
        },
        ...options
      });
      
      setOCRResults(result);
      return result;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    } finally {
      setIsOCRProcessing(false);
    }
  }, [editor]);
  
 const extractTextFromElement = useCallback(async (element) => {
  if (!editor || element.type !== 'image') {
    throw new Error('Cannot extract text from non-image element');
  }
  
  // Create a temporary canvas to extract image data
  const canvas = document.createElement('canvas');
  canvas.width = element.width;
  canvas.height = element.height;
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  img.src = element.src;
  
  await new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve();
    };
  });
  
  // Fixed: Removed unused imageData variable
  // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  
  return performOCR(blob);
}, [editor, performOCR]);
  
  const clearOCRResults = useCallback(() => {
    setOCRResults(null);
    setOCRProgress(0);
  }, []);
  
  return {
    performOCR,
    extractTextFromElement,
    clearOCRResults,
    ocrProgress,
    ocrResults,
    isOCRProcessing
  };
}
/**
 * Hook for element properties editing - COMPLETELY FIXED
 */
export function useElementProperties(selectedElementIds, updateElement, getElementById, documentData, currentPage) {
  
  // Compute elementType based on actual element data
  const elementType = useMemo(() => {
    if (selectedElementIds.length === 1 && getElementById) {
      const element = getElementById(selectedElementIds[0]);
      return element?.type || null;
    } else if (selectedElementIds.length > 1) {
      // Check if all selected elements are of the same type
      if (selectedElementIds.length > 0 && getElementById) {
        const firstElement = getElementById(selectedElementIds[0]);
        const allSameType = selectedElementIds.every(id => {
          const element = getElementById(id);
          return element?.type === firstElement?.type;
        });
        return allSameType ? `${firstElement?.type}_multiple` : 'mixed';
      }
      return 'multiple';
    } else {
      return null;
    }
  }, [selectedElementIds, getElementById]);
  
  // Compute current properties based on selection
  const properties = useMemo(() => {
    const defaultProperties = {
      fontSize: 12,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      fill: '#000000',
      textAlign: 'left',
      lineHeight: 1.5,
      stroke: '#000000',
      strokeWidth: 1,
      fillColor: '#ffffff',
      opacity: 1,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      draggable: true,
      resizable: true,
      rotatable: true,
      visible: true
    };
    
    if (selectedElementIds.length === 1 && getElementById) {
      const element = getElementById(selectedElementIds[0]);
      if (element) {
        return {
          ...defaultProperties,
          fontSize: element.fontSize || defaultProperties.fontSize,
          fontFamily: element.fontFamily || defaultProperties.fontFamily,
          fontWeight: element.fontWeight || defaultProperties.fontWeight,
          fontStyle: element.fontStyle || defaultProperties.fontStyle,
          fill: element.fill || defaultProperties.fill,
          textAlign: element.textAlign || defaultProperties.textAlign,
          lineHeight: element.lineHeight || defaultProperties.lineHeight,
          stroke: element.stroke || defaultProperties.stroke,
          strokeWidth: element.strokeWidth || defaultProperties.strokeWidth,
          fillColor: element.fillColor || element.fill || defaultProperties.fillColor,
          opacity: element.opacity || defaultProperties.opacity,
          x: element.x || defaultProperties.x,
          y: element.y || defaultProperties.y,
          width: element.width || defaultProperties.width,
          height: element.height || defaultProperties.height,
          rotation: element.rotation || defaultProperties.rotation,
          draggable: element.draggable !== undefined ? element.draggable : defaultProperties.draggable,
          resizable: element.resizable !== undefined ? element.resizable : defaultProperties.resizable,
          rotatable: element.rotatable !== undefined ? element.rotatable : defaultProperties.rotatable,
          visible: element.visible !== undefined ? element.visible : defaultProperties.visible
        };
      }
    }
    
    return defaultProperties;
  }, [selectedElementIds, getElementById]);
  
  // Update properties and apply to selected elements
  const updateProperties = useCallback((newProperties) => {
    // Apply to all selected elements
    selectedElementIds.forEach(elementId => {
      updateElement(elementId, newProperties);
    });
  }, [selectedElementIds, updateElement]);
  
  // Reset properties to defaults
  const resetProperties = useCallback(() => {
    const defaultProperties = {
      fontSize: 12,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      fill: '#000000',
      textAlign: 'left',
      lineHeight: 1.5,
      stroke: '#000000',
      strokeWidth: 1,
      fillColor: '#ffffff',
      opacity: 1,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      draggable: true,
      resizable: true,
      rotatable: true,
      visible: true
    };
    
    // Apply defaults to selected elements
    selectedElementIds.forEach(elementId => {
      updateElement(elementId, defaultProperties);
    });
  }, [selectedElementIds, updateElement]);
  
  // Apply properties to all similar elements on the current page
  const applyToAllSimilar = useCallback((targetType, propertiesToApply) => {
    if (!documentData || !documentData.pages) return;
    
    const pageData = documentData.pages[currentPage - 1];
    if (!pageData || !pageData.elements) return;
    
    // Apply properties to all elements of the same type on current page
    pageData.elements.forEach(element => {
      if (element.type === targetType && updateElement) {
        updateElement(element.id, propertiesToApply);
      }
    });
    
    // If there are selected elements, update them too
    selectedElementIds.forEach(elementId => {
      const element = getElementById(elementId);
      if (element && element.type === targetType) {
        updateElement(elementId, propertiesToApply);
      }
    });
    
  }, [documentData, currentPage, selectedElementIds, getElementById, updateElement]);
  
  // Get specific property values for multiple selected elements
  const getCommonProperty = useCallback((propertyName) => {
    if (selectedElementIds.length === 0) return null;
    
    const values = selectedElementIds.map(id => {
      const element = getElementById(id);
      return element ? element[propertyName] : undefined;
    }).filter(val => val !== undefined);
    
    if (values.length === 0) return null;
    
    // Check if all values are the same
    const firstValue = values[0];
    const allSame = values.every(val => val === firstValue);
    
    return allSame ? firstValue : 'mixed';
  }, [selectedElementIds, getElementById]);
  
  // Apply single property to all selected elements (for property panel UI)
  const applyPropertyToSelection = useCallback((propertyName, value) => {
    if (selectedElementIds.length === 0) return;
    
    selectedElementIds.forEach(elementId => {
      updateElement(elementId, { [propertyName]: value });
    });
  }, [selectedElementIds, updateElement]);
  
  return {
    properties,
    elementType,
    updateProperties,
    resetProperties,
    applyToAllSimilar,
    getCommonProperty,
    applyPropertyToSelection,
    hasSelection: selectedElementIds.length > 0,
    selectionCount: selectedElementIds.length,
    isSingleSelection: selectedElementIds.length === 1,
    isMultipleSelection: selectedElementIds.length > 1,
    isMixedSelection: elementType === 'mixed'
  };
}

export default {
  useDocumentEditor,
  useDocumentViewport,
  useDocumentEditing,
  useDocumentLayers,
  useDocumentManager,
  useOCROperations,
  useElementProperties
};