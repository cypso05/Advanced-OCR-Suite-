import React, { useMemo } from 'react';
import { Line, Rect, Circle, Text, Group } from 'react-konva';

const GridGuidesOverlay = ({
  showGrid = true, // ADDED: Control grid visibility
  grid = { enabled: true, size: 20, snap: true, color: 'rgba(0, 0, 0, 0.1)', type: 'lines' },
  guides = { enabled: true, vertical: [], horizontal: [], color: '#00ff00' },
  rulers = { show: true, unit: 'px' },
  canvasSize = { width: 794, height: 1123 },
  zoom = 1,
  pan = { x: 0, y: 0 },
  showMargins = false,
  margins = { top: 50, right: 50, bottom: 50, left: 50 },
  layoutMode = 'word'
}) => {
  // Layout mode specific grid configurations
  const gridConfigs = {
    word: {
      gridSize: 20,
      gridColor: 'rgba(0, 0, 0, 0.1)',
      gridType: 'dots',
      showMargins: true,
      marginColor: 'rgba(59, 130, 246, 0.2)',
      showRulers: true,
      rulerColor: '#64748b'
    },
    powerpoint: {
      gridSize: 10,
      gridColor: 'rgba(0, 0, 0, 0.08)',
      gridType: 'lines',
      showMargins: false,
      marginColor: 'transparent',
      showRulers: false,
      rulerColor: '#f59e0b'
    },
    photoshop: {
      gridSize: 25,
      gridColor: 'rgba(255, 255, 255, 0.1)',
      gridType: 'lines',
      showMargins: false,
      marginColor: 'transparent',
      showRulers: true,
      rulerColor: '#a78bfa'
    },
    excel: {
      gridSize: 25,
      gridColor: '#e2e8f0',
      gridType: 'solid',
      showMargins: true,
      marginColor: 'rgba(16, 185, 129, 0.2)',
      showRulers: true,
      rulerColor: '#10b981'
    }
  };

  const currentConfig = gridConfigs[layoutMode] || gridConfigs.word;

  // CRITICAL FIX: Use showGrid prop to control grid visibility
  const effectiveGrid = useMemo(() => ({
    ...grid,
    enabled: grid.enabled && showGrid
  }), [grid, showGrid]);

  // Generate grid lines based on layout mode
  const gridElements = useMemo(() => {
    if (!effectiveGrid.enabled) return []; // Use effectiveGrid instead of grid

    const elements = [];
    const effectiveGridSize = currentConfig.gridSize * zoom;
    
    // Calculate visible area
    const visibleStartX = Math.floor(-pan.x / zoom / effectiveGridSize) * effectiveGridSize;
    const visibleEndX = Math.ceil((canvasSize.width - pan.x / zoom) / effectiveGridSize) * effectiveGridSize;
    const visibleStartY = Math.floor(-pan.y / zoom / effectiveGridSize) * effectiveGridSize;
    const visibleEndY = Math.ceil((canvasSize.height - pan.y / zoom) / effectiveGridSize) * effectiveGridSize;

    // Generate grid based on type
    switch (currentConfig.gridType) {
      case 'dots':
        // Create dots at grid intersections
        for (let x = visibleStartX; x <= visibleEndX; x += effectiveGridSize) {
          for (let y = visibleStartY; y <= visibleEndY; y += effectiveGridSize) {
            elements.push(
              <Circle
                key={`dot-${x}-${y}`}
                x={x}
                y={y}
                radius={1 * zoom}
                fill={currentConfig.gridColor}
                listening={false}
              />
            );
          }
        }
        break;

      case 'lines':
        // Vertical lines
        for (let x = visibleStartX; x <= visibleEndX; x += effectiveGridSize) {
          elements.push(
            <Line
              key={`vline-${x}`}
              points={[x, visibleStartY, x, visibleEndY]}
              stroke={currentConfig.gridColor}
              strokeWidth={1 * zoom}
              listening={false}
            />
          );
        }
        // Horizontal lines
        for (let y = visibleStartY; y <= visibleEndY; y += effectiveGridSize) {
          elements.push(
            <Line
              key={`hline-${y}`}
              points={[visibleStartX, y, visibleEndX, y]}
              stroke={currentConfig.gridColor}
              strokeWidth={1 * zoom}
              listening={false}
            />
          );
        }
        break;

      case 'solid':
        // Excel-like solid grid
        for (let x = visibleStartX; x <= visibleEndX; x += effectiveGridSize) {
          elements.push(
            <Line
              key={`vline-${x}`}
              points={[x, 0, x, canvasSize.height]}
              stroke={currentConfig.gridColor}
              strokeWidth={1}
              listening={false}
            />
          );
        }
        for (let y = visibleStartY; y <= visibleEndY; y += effectiveGridSize) {
          elements.push(
            <Line
              key={`hline-${y}`}
              points={[0, y, canvasSize.width, y]}
              stroke={currentConfig.gridColor}
              strokeWidth={1}
              listening={false}
            />
          );
        }
        break;
    }

    return elements;
  }, [effectiveGrid.enabled, currentConfig, zoom, pan, canvasSize]); // Use effectiveGrid.enabled

  // Generate guide lines
  const guideElements = useMemo(() => {
    if (!guides.enabled) return [];

    const elements = [];
    
    // Vertical guides
    guides.vertical.forEach((x, index) => {
      elements.push(
        <Line
          key={`vguide-${index}`}
          points={[x, 0, x, canvasSize.height]}
          stroke={guides.color}
          strokeWidth={2 * zoom}
          dash={[4, 4]}
          listening={false}
        />
      );
    });

    // Horizontal guides
    guides.horizontal.forEach((y, index) => {
      elements.push(
        <Line
          key={`hguide-${index}`}
          points={[0, y, canvasSize.width, y]}
          stroke={guides.color}
          strokeWidth={2 * zoom}
          dash={[4, 4]}
          listening={false}
        />
      );
    });

    return elements;
  }, [guides, zoom, canvasSize]);

  // Generate margins
  const marginElements = useMemo(() => {
    if (!showMargins || !currentConfig.showMargins) return [];

    return [
      // Top margin
      <Rect
        key="margin-top"
        x={0}
        y={0}
        width={canvasSize.width}
        height={margins.top}
        fill={currentConfig.marginColor}
        listening={false}
      />,
      // Right margin
      <Rect
        key="margin-right"
        x={canvasSize.width - margins.right}
        y={0}
        width={margins.right}
        height={canvasSize.height}
        fill={currentConfig.marginColor}
        listening={false}
      />,
      // Bottom margin
      <Rect
        key="margin-bottom"
        x={0}
        y={canvasSize.height - margins.bottom}
        width={canvasSize.width}
        height={margins.bottom}
        fill={currentConfig.marginColor}
        listening={false}
      />,
      // Left margin
      <Rect
        key="margin-left"
        x={0}
        y={0}
        width={margins.left}
        height={canvasSize.height}
        fill={currentConfig.marginColor}
        listening={false}
      />
    ];
  }, [showMargins, currentConfig, margins, canvasSize]);

  // Generate rulers
  const rulerElements = useMemo(() => {
    if (!rulers.show || !currentConfig.showRulers) return [];

    const tickSize = 10 * zoom;
    const majorTickEvery = 100 * zoom;
    const minorTickEvery = 20 * zoom;

    const elements = [];

    // Horizontal ruler at top
    for (let x = 0; x <= canvasSize.width; x += minorTickEvery) {
      const isMajor = x % majorTickEvery === 0;
      elements.push(
        <Line
          key={`hruler-tick-${x}`}
          points={[x, 0, x, isMajor ? tickSize * 2 : tickSize]}
          stroke={currentConfig.rulerColor}
          strokeWidth={1 * zoom}
          listening={false}
        />
      );
      // Labels for major ticks
      if (isMajor) {
        elements.push(
          <Text
            key={`hruler-label-${x}`}
            x={x + 2 * zoom}
            y={tickSize * 2.5}
            text={`${x}${rulers.unit}`}
            fontSize={10 * zoom}
            fill={currentConfig.rulerColor}
            listening={false}
          />
        );
      }
    }

    // Vertical ruler at left
    for (let y = 0; y <= canvasSize.height; y += minorTickEvery) {
      const isMajor = y % majorTickEvery === 0;
      elements.push(
        <Line
          key={`vruler-tick-${y}`}
          points={[0, y, isMajor ? tickSize * 2 : tickSize, y]}
          stroke={currentConfig.rulerColor}
          strokeWidth={1 * zoom}
          listening={false}
        />
      );
      // Labels for major ticks
      if (isMajor) {
        elements.push(
          <Text
            key={`vruler-label-${y}`}
            x={tickSize * 2.5}
            y={y + 2 * zoom}
            text={`${y}${rulers.unit}`}
            fontSize={10 * zoom}
            fill={currentConfig.rulerColor}
            listening={false}
          />
        );
      }
    }

    // Ruler backgrounds
    elements.push(
      <Rect
        key="hruler-bg"
        x={0}
        y={0}
        width={canvasSize.width}
        height={tickSize * 3}
        fill="rgba(30, 41, 59, 0.8)"
        listening={false}
      />
    );
    elements.push(
      <Rect
        key="vruler-bg"
        x={0}
        y={0}
        width={tickSize * 3}
        height={canvasSize.height}
        fill="rgba(30, 41, 59, 0.8)"
        listening={false}
      />
    );

    return elements;
  }, [rulers, currentConfig, zoom, canvasSize]);

  // Layout mode specific indicators
// Layout mode specific indicators
const modeIndicatorElements = useMemo(() => {
  const elements = [];
  
  switch (layoutMode) {
    case 'excel': {
      // Add column letters and row numbers
      const cellSize = currentConfig.gridSize;
      for (let col = 0; col < Math.floor(canvasSize.width / cellSize); col++) {
        elements.push(
          <Text
            key={`col-${col}`}
            x={col * cellSize + cellSize / 2}
            y={-20}
            text={String.fromCharCode(65 + (col % 26)) + (col >= 26 ? Math.floor(col / 26) : '')}
            fontSize={12}
            fill="#64748b"
            align="center"
            listening={false}
          />
        );
      }
      for (let row = 0; row < Math.floor(canvasSize.height / cellSize); row++) {
        elements.push(
          <Text
            key={`row-${row}`}
            x={-20}
            y={row * cellSize + cellSize / 2}
            text={(row + 1).toString()}
            fontSize={12}
            fill="#64748b"
            align="center"
            listening={false}
          />
        );
      }
      break;
    }

    case 'powerpoint':
      // Add slide number and presentation indicators
      elements.push(
        <Text
          key="slide-number"
          x={canvasSize.width - 50}
          y={canvasSize.height - 30}
          text="Slide 1"
          fontSize={14}
          fill="#94a3b8"
          listening={false}
        />
      );
      break;

    case 'photoshop':
      // Add Photoshop-style guides
      elements.push(
        <Rect
          key="canvas-border"
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
          stroke="#4a5568"
          strokeWidth={2}
          listening={false}
        />
      );
      break;
  }

  return elements;
}, [layoutMode, currentConfig, canvasSize]);

  return (
    <Group>
      {gridElements}
      {guideElements}
      {marginElements}
      {rulerElements}
      {modeIndicatorElements}
    </Group>
  );
};

export default React.memo(GridGuidesOverlay);