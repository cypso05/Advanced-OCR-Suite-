import React, { forwardRef, useImperativeHandle, useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Group } from 'react-konva';
import GridGuidesOverlay from './GridGuidesOverlay'; // Adjust path as needed

// Utility function
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const CanvasStage = forwardRef(({
  width = 800,
  height = 600,
  zoom = 1,
  pan = { x: 0, y: 0 },
  children,
  onZoom,
  onPan,
  onStageClick,
  onStageContextMenu,
  readOnly = false,
  backgroundColor = '#ffffff',
  showBoundaries = true,
  boundaryColor = 'rgba(0, 0, 0, 0.1)',
  gridSize = 20,
  showGrid = false, // THIS CONTROLS GRID VISIBILITY
  gridColor = 'rgba(0, 0, 0, 0.05)',
  zoomRange = { min: 0.1, max: 10 },
  enableZoom = true,
  enablePan = true,
  zoomSensitivity = 0.001,
  containerClassName = '',
  style = {},
  onViewportChange,
  performance = {
    pixelRatio: 'auto',
    listening: true
  },
  // Layout mode props
  layoutMode = 'word',
  // Mode-specific overrides
  modeOverrides = {}
}, ref) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  
  // State for interactive elements
  const [isPanning, setIsPanning] = useState(false);
  const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });
  
  // Initialize viewport state with clamped values
  const [viewport, setViewport] = useState(() => ({
    zoom: clamp(zoom, zoomRange.min, zoomRange.max),
    pan: {
      x: typeof pan.x === 'number' && !isNaN(pan.x) ? pan.x : 0,
      y: typeof pan.y === 'number' && !isNaN(pan.y) ? pan.y : 0
    }
  }));
  
  // Refs for performance and tracking
  const panStartRef = useRef({ x: 0, y: 0 });
  const [prevProps, setPrevProps] = useState({ zoom, pan });

  // Layout mode configurations - SIMPLIFIED
  const layoutConfigs = useMemo(() => ({
    word: {
      snapToGrid: false,
      backgroundColor: '#ffffff',
      cursor: 'default'
    },
    powerpoint: {
      snapToGrid: false,
      backgroundColor: '#f8f9fa',
      cursor: 'default'
    },
    photoshop: {
      snapToGrid: false,
      backgroundColor: modeOverrides?.canvasColor || '#2d2d2d',
      cursor: 'default'
    },
    excel: {
      snapToGrid: true,
      backgroundColor: '#ffffff',
      cursor: 'default'
    }
  }), [modeOverrides?.canvasColor]);

  // Current config with dynamic background color
  const currentConfig = useMemo(() => ({
    ...layoutConfigs[layoutMode],
    // Override background color if provided via modeOverrides
    backgroundColor: layoutMode === 'photoshop' ? 
      (modeOverrides?.canvasColor || layoutConfigs[layoutMode].backgroundColor) :
      layoutConfigs[layoutMode].backgroundColor
  }), [layoutMode, layoutConfigs, modeOverrides?.canvasColor]);

  // Handle external prop changes
  useEffect(() => {
    const zoomChanged = Math.abs(zoom - prevProps.zoom) > 0.001;
    const panChanged = 
      Math.abs(pan.x - prevProps.pan.x) > 0.1 || 
      Math.abs(pan.y - prevProps.pan.y) > 0.1;

    if (zoomChanged || panChanged) {
      const safeZoom = clamp(zoom, zoomRange.min, zoomRange.max);
      const safePan = {
        x: typeof pan.x === 'number' && !isNaN(pan.x) ? pan.x : 0,
        y: typeof pan.y === 'number' && !isNaN(pan.y) ? pan.y : 0
      };

      const shouldUpdateZoom = Math.abs(safeZoom - viewport.zoom) > 0.001;
      const shouldUpdatePan = 
        Math.abs(safePan.x - viewport.pan.x) > 0.1 || 
        Math.abs(safePan.y - viewport.pan.y) > 0.1;

      if (shouldUpdateZoom || shouldUpdatePan) {
        setViewport({ zoom: safeZoom, pan: safePan });
      }

      setPrevProps({ zoom, pan });
    }
  }, [zoom, pan.x, pan.y, zoomRange.min, zoomRange.max, prevProps, pan, viewport]);

  // Cursor management
  const updateCursor = useCallback((cursor) => {
    if (stageRef.current?.container()) {
      stageRef.current.container().style.cursor = cursor;
    }
  }, []);

  // Expose stage methods to parent
  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    getContainer: () => containerRef.current,
    
    zoomToFit: (padding = 50) => {
      if (!stageRef.current) return;
      
      const stage = stageRef.current.getStage();
      const children = stage.getChildren()[0]?.getChildren();
      
      if (!children || children.length === 0) return;
      
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      children.forEach(node => {
        if (node.visible()) {
          const box = node.getClientRect();
          minX = Math.min(minX, box.x);
          maxX = Math.max(maxX, box.x + box.width);
          minY = Math.min(minY, box.y);
          maxY = Math.max(maxY, box.y + box.height);
        }
      });
      
      if (minX === Infinity) return;
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const scaleX = (width - padding * 2) / contentWidth;
      const scaleY = (height - padding * 2) / contentHeight;
      const newZoom = Math.min(scaleX, scaleY, zoomRange.max);
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      const newPan = {
        x: width / 2 - centerX * newZoom,
        y: height / 2 - centerY * newZoom
      };
      
      if (onViewportChange) {
        onViewportChange(newZoom, newPan);
      } else {
        if (onZoom) onZoom(newZoom);
        if (onPan) onPan(newPan);
      }
    },
    
    resetViewport: () => {
      const newZoom = 1;
      const newPan = { x: 0, y: 0 };
      
      if (onViewportChange) {
        onViewportChange(newZoom, newPan);
      } else {
        if (onZoom) onZoom(newZoom);
        if (onPan) onPan(newPan);
      }
    },
    
    getPointerPosition: () => {
      const stage = stageRef.current?.getStage();
      return stage ? stage.getPointerPosition() : null;
    },
    
    getRelativePointerPosition: () => {
      const stage = stageRef.current?.getStage();
      if (!stage) return null;
      
      const pos = stage.getPointerPosition();
      return {
        x: (pos.x - viewport.pan.x) / viewport.zoom,
        y: (pos.y - viewport.pan.y) / viewport.zoom
      };
    },
    
    toDataURL: (options = {}) => {
      const stage = stageRef.current?.getStage();
      if (!stage) return null;
      
      const defaultOptions = {
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: performance.pixelRatio === 'auto' ? window.devicePixelRatio || 1 : performance.pixelRatio
      };
      
      return stage.toDataURL({ ...defaultOptions, ...options });
    }
  }));

  // Wheel handler for zoom
  const handleWheel = useCallback((e) => {
    if (!enableZoom || readOnly) return;
    
    e.evt.preventDefault();
    e.evt.stopPropagation();
    
    const stage = stageRef.current?.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    const delta = e.evt.deltaY;
    const oldZoom = viewport.zoom;
    
    const zoomFactor = 1 - delta * zoomSensitivity;
    const newZoom = clamp(oldZoom * zoomFactor, zoomRange.min, zoomRange.max);
    
    if (Math.abs(newZoom - oldZoom) < 0.001) return;
    
    const stageX = (pointerPos.x - viewport.pan.x) / oldZoom;
    const stageY = (pointerPos.y - viewport.pan.y) / oldZoom;
    
    const newPan = {
      x: pointerPos.x - stageX * newZoom,
      y: pointerPos.y - stageY * newZoom
    };
    
    setViewport({ zoom: newZoom, pan: newPan });
    
    if (onViewportChange) {
      onViewportChange(newZoom, newPan);
    } else {
      if (onZoom) onZoom(newZoom);
      if (onPan) onPan(newPan);
    }
  }, [enableZoom, readOnly, viewport, zoomSensitivity, zoomRange, onZoom, onPan, onViewportChange]);

  // Mouse down handler
  const handleMouseDown = useCallback((e) => {
    if (readOnly || !enablePan) return;
    
    const stage = stageRef.current?.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    setLastPointerPos(pos);
    panStartRef.current = { ...viewport.pan };
    
    if (e.evt.button === 1) {
      setIsPanning(true);
      updateCursor('grabbing');
      e.evt.preventDefault();
    }
  }, [readOnly, enablePan, viewport.pan, updateCursor]);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    
    const stage = stageRef.current?.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const dx = pos.x - lastPointerPos.x;
    const dy = pos.y - lastPointerPos.y;
    
    const newPan = {
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    };
    
    setViewport(prev => ({ ...prev, pan: newPan }));
    setLastPointerPos(pos);
    
    if (onPan) onPan(newPan);
    if (onViewportChange) onViewportChange(viewport.zoom, newPan);
  }, [isPanning, lastPointerPos, viewport.zoom, onPan, onViewportChange]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      updateCursor(currentConfig.cursor);
    }
  }, [isPanning, updateCursor, currentConfig.cursor]);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    updateCursor(currentConfig.cursor);
  }, [updateCursor, currentConfig.cursor]);

  // Context menu handler
  const handleContextMenu = useCallback((e) => {
    if (onStageContextMenu) {
      e.evt.preventDefault();
      const stage = stageRef.current?.getStage();
      const pos = stage?.getPointerPosition();
      onStageContextMenu(e.evt, pos);
    }
  }, [onStageContextMenu]);

  // Click handler for empty stage area
  const handleStageClick = useCallback((e) => {
    if (e.target === e.currentTarget || e.target.nodeType === 'Stage') {
      if (onStageClick) {
        const stage = stageRef.current?.getStage();
        const pos = stage?.getPointerPosition();
        onStageClick(e.evt, pos);
      }
    }
  }, [onStageClick]);

  // ✅ ADD: Simplified Grid Layer that actually works
// ✅ REPLACE: Your current GridLayer useMemo with this:

// =================== GRID AND GUIDES LAYER ===================
const GridLayer = useMemo(() => {
  // Only render grid in Excel mode and when showGrid is true
  if (!showGrid || layoutMode !== 'excel') {
    console.log('GridLayer: Grid not shown because:', { 
      showGrid, 
      layoutMode,
      shouldShow: showGrid && layoutMode === 'excel'
    });
    return null;
  }
  
  console.log('GridLayer: Drawing grid for Excel mode', {
    showGrid,
    layoutMode,
    gridSize,
    viewportZoom: viewport.zoom
  });
  
  // Use the dedicated GridGuidesOverlay component
  return (
    <GridGuidesOverlay
      showGrid={showGrid}
      grid={{
        enabled: showGrid,
        size: gridSize,
        snap: layoutMode === 'excel',
        color: gridColor,
        type: 'solid' // Excel style
      }}
      guides={{
        enabled: true,
        vertical: [],
        horizontal: [],
        color: '#00ff00'
      }}
      rulers={{
        show: layoutMode === 'excel',
        unit: 'px'
      }}
      canvasSize={{ width, height }}
      zoom={viewport.zoom}
      pan={viewport.pan}
      showMargins={false}
      margins={{ top: 50, right: 50, bottom: 50, left: 50 }}
      layoutMode={layoutMode}
    />
  );
}, [showGrid, layoutMode, gridSize, gridColor, width, height, viewport]);

  // Calculate pixel ratio
  const pixelRatio = useMemo(() => {
    if (performance.pixelRatio === 'auto') {
      return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    }
    return performance.pixelRatio;
  }, [performance.pixelRatio]);

  const konvaChildren = children;

  return (
    <div 
      ref={containerRef}
      className={`canvas-stage-container ${containerClassName}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'visible',
        userSelect: 'none',
        ...style
      }}
      role="application"
      tabIndex={0}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={viewport.zoom}
        scaleY={viewport.zoom}
        x={viewport.pan.x}
        y={viewport.pan.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleStageClick}
        onContextMenu={handleContextMenu}
        style={{
          backgroundColor: currentConfig.backgroundColor,
        }}
        pixelRatio={pixelRatio}
        listening={performance.listening}
      >
        <Layer>
          {/* ✅ ADD: Background color rect for Photoshop mode */}
          {layoutMode === 'photoshop' && (
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill={currentConfig.backgroundColor}
              listening={false}
            />
          )}
          
          {/* ✅ Render the grid layer */}
          {GridLayer}
          
          {/* Render all children */}
          {konvaChildren}
        </Layer>
      </Stage>
    </div>
  );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;